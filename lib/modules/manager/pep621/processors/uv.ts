import is from '@sindresorhus/is';
import { quote } from 'shlex';
import { TEMPORARY_ERROR } from '../../../../constants/error-messages';
import { logger } from '../../../../logger';
import type { HostRule } from '../../../../types';
import { exec } from '../../../../util/exec';
import type { ExecOptions, ToolConstraint } from '../../../../util/exec/types';
import { getSiblingFileName, readLocalFile } from '../../../../util/fs';
import { getGitEnvironmentVariables } from '../../../../util/git/auth';
import { find } from '../../../../util/host-rules';
import { Result } from '../../../../util/result';
import { parseUrl } from '../../../../util/url';
import { PypiDatasource } from '../../../datasource/pypi';
import type {
  PackageDependency,
  UpdateArtifact,
  UpdateArtifactsResult,
  Upgrade,
} from '../../types';
import { applyGitSource } from '../../util';
import { type PyProject, UvLockfileSchema } from '../schema';
import { depTypes, parseDependencyList } from '../utils';
import type { PyProjectProcessor } from './types';

const uvUpdateCMD = 'uv lock';

export class UvProcessor implements PyProjectProcessor {
  process(project: PyProject, deps: PackageDependency[]): PackageDependency[] {
    const uv = project.tool?.uv;
    if (is.nullOrUndefined(uv)) {
      return deps;
    }

    deps.push(
      ...parseDependencyList(
        depTypes.uvDevDependencies,
        uv['dev-dependencies'],
      ),
    );

    // https://docs.astral.sh/uv/concepts/dependencies/#dependency-sources
    // Skip sources that do not make sense to handle (e.g. path).
    if (uv.sources) {
      for (const dep of deps) {
        // istanbul ignore if
        if (!dep.packageName) {
          continue;
        }

        // Using `packageName` as it applies PEP 508 normalization, which is
        // also applied by uv when matching a source to a dependency.
        const depSource = uv.sources[dep.packageName];
        if (depSource) {
          dep.depType = depTypes.uvSources;
          if ('url' in depSource) {
            dep.skipReason = 'unsupported-url';
          } else if ('path' in depSource) {
            dep.skipReason = 'path-dependency';
          } else if ('workspace' in depSource) {
            dep.skipReason = 'inherited-dependency';
          } else {
            applyGitSource(
              dep,
              depSource.git,
              depSource.rev,
              depSource.tag,
              depSource.branch,
            );
          }
        }
      }
    }

    return deps;
  }

  async extractLockedVersions(
    project: PyProject,
    deps: PackageDependency[],
    packageFile: string,
  ): Promise<PackageDependency[]> {
    const lockFileName = getSiblingFileName(packageFile, 'uv.lock');
    const lockFileContent = await readLocalFile(lockFileName, 'utf8');
    if (lockFileContent) {
      const { val: lockFileMapping, err } = Result.parse(
        lockFileContent,
        UvLockfileSchema,
      ).unwrap();

      if (err) {
        logger.debug({ packageFile, err }, `Error parsing uv lock file`);
      } else {
        for (const dep of deps) {
          const packageName = dep.packageName;
          if (packageName && packageName in lockFileMapping) {
            dep.lockedVersion = lockFileMapping[packageName];
          }
        }
      }
    }

    return Promise.resolve(deps);
  }

  async updateArtifacts(
    updateArtifact: UpdateArtifact,
    project: PyProject,
  ): Promise<UpdateArtifactsResult[] | null> {
    const { config, updatedDeps, packageFileName } = updateArtifact;

    const isLockFileMaintenance = config.updateType === 'lockFileMaintenance';

    // abort if no lockfile is defined
    const lockFileName = getSiblingFileName(packageFileName, 'uv.lock');
    try {
      const existingLockFileContent = await readLocalFile(lockFileName, 'utf8');
      if (is.nullOrUndefined(existingLockFileContent)) {
        logger.debug('No uv.lock found');
        return null;
      }

      const pythonConstraint: ToolConstraint = {
        toolName: 'python',
        constraint:
          config.constraints?.python ?? project.project?.['requires-python'],
      };
      const uvConstraint: ToolConstraint = {
        toolName: 'uv',
        constraint: config.constraints?.uv,
      };

      const extraEnv = {
        ...getGitEnvironmentVariables(['pep621']),
        ...getUvExtraIndexUrl(updateArtifact.updatedDeps),
      };
      const execOptions: ExecOptions = {
        cwdFile: packageFileName,
        extraEnv,
        docker: {},
        userConfiguredEnv: config.env,
        toolConstraints: [pythonConstraint, uvConstraint],
      };

      // on lockFileMaintenance do not specify any packages and update the complete lock file
      // else only update specific packages
      let cmd: string;
      if (isLockFileMaintenance) {
        cmd = `${uvUpdateCMD} --upgrade`;
      } else {
        cmd = generateCMD(updatedDeps);
      }
      await exec(cmd, execOptions);

      // check for changes
      const fileChanges: UpdateArtifactsResult[] = [];
      const newLockContent = await readLocalFile(lockFileName, 'utf8');
      const isLockFileChanged = existingLockFileContent !== newLockContent;
      if (isLockFileChanged) {
        fileChanges.push({
          file: {
            type: 'addition',
            path: lockFileName,
            contents: newLockContent,
          },
        });
      } else {
        logger.debug('uv.lock is unchanged');
      }

      return fileChanges.length ? fileChanges : null;
    } catch (err) {
      // istanbul ignore if
      if (err.message === TEMPORARY_ERROR) {
        throw err;
      }
      logger.debug({ err }, 'Failed to update uv lock file');
      return [
        {
          artifactError: {
            lockFile: lockFileName,
            stderr: err.message,
          },
        },
      ];
    }
  }
}

function generateCMD(updatedDeps: Upgrade[]): string {
  const deps: string[] = [];

  for (const dep of updatedDeps) {
    switch (dep.depType) {
      case depTypes.optionalDependencies: {
        deps.push(dep.depName!.split('/')[1]);
        break;
      }
      case depTypes.uvDevDependencies:
      case depTypes.uvSources: {
        deps.push(dep.depName!);
        break;
      }
      case depTypes.buildSystemRequires:
        // build requirements are not locked in the lock files, no need to update.
        break;
      default: {
        deps.push(dep.packageName!);
      }
    }
  }

  return `${uvUpdateCMD} ${deps.map((dep) => `--upgrade-package ${quote(dep)}`).join(' ')}`;
}

function getMatchingHostRule(url: string | undefined): HostRule {
  return find({ hostType: PypiDatasource.id, url });
}

function getUvExtraIndexUrl(deps: Upgrade[]): NodeJS.ProcessEnv {
  const pyPiRegistryUrls = deps
    .filter((dep) => dep.datasource === PypiDatasource.id)
    .map((dep) => dep.registryUrls)
    .flat();
  const registryUrls = new Set(pyPiRegistryUrls);
  const extraIndexUrls: string[] = [];

  for (const registryUrl of registryUrls) {
    const parsedUrl = parseUrl(registryUrl);
    if (!parsedUrl) {
      continue;
    }

    const rule = getMatchingHostRule(parsedUrl.toString());
    if (rule.username) {
      parsedUrl.username = rule.username;
    }
    if (rule.password) {
      parsedUrl.password = rule.password;
    }

    extraIndexUrls.push(parsedUrl.toString());
  }

  return {
    UV_EXTRA_INDEX_URL: extraIndexUrls.join(' '),
  };
}
