import JSON5 from 'json5';
import upath from 'upath';
import type { RenovateConfig } from '../../../config/types';
import { validateConfig } from '../../../config/validation';
import { logger } from '../../../logger';
import { platform } from '../../../modules/platform';
import { scm } from '../../../modules/platform/scm';
import { getCache } from '../../../util/cache/repository';
import { readLocalFile } from '../../../util/fs';
import { getBranchCommit } from '../../../util/git';
import { detectConfigFile } from '../init/merge';
import {
  deleteReconfigureBranchCache,
  setReconfigureBranchCache,
} from './reconfigure-cache';

export async function reconfigureLogic(config: RenovateConfig): Promise<void> {
  logger.debug('reconfigureLogic()');
  const context = `renovate/config-validation`;

  const branchName = `${config.branchPrefix}reconfigure`;
  const branchExists = await scm.branchExists(branchName);

  // this is something, the user initiates so skip if no branch exists
  if (!branchExists) {
    logger.debug('No reconfigure branch found');
    deleteReconfigureBranchCache();
    return;
  }

  // look for config file
  // 1. check reconfigure branch cache and use the conifgFileName if it exists
  // 2. checkout reconfigure branch and look for the config file, don't assume default config fileName
  const branchSha = getBranchCommit(branchName);
  const cache = getCache();
  let configFileName: string | null = null;
  const branchCache = cache.reconfigureBranchCache;

  // only use cached information if it is valid
  if (branchCache?.reconfigureBranchSha === branchSha) {
    configFileName = branchCache?.configFileName ?? null;
  }

  if (!configFileName) {
    try {
      await scm.checkoutBranch(branchName);
      configFileName = await detectConfigFile();
    } catch (err) {
      logger.debug(
        { err },
        'Error while searching for config file in reconfigure branch'
      );
    }
  }

  // return to base branch
  try {
    await scm.checkoutBranch(config.baseBranch!);
  } catch (err) {
    logger.debug({ err }, 'Error checking out base branch');
  }

  if (!configFileName) {
    logger.warn('No config file found in reconfigure branch');
    await platform.setBranchStatus({
      branchName,
      context,
      description: 'Validation Failed - No config file found',
      state: 'red',
    });
    return;
  }

  let configFileRaw: string | null = null;
  try {
    configFileRaw = await readLocalFile(configFileName, 'utf8');
  } catch (err) {
    logger.debug('Error while reading config file');
  }

  if (!configFileRaw) {
    logger.debug('Empty config file');
    await platform.setBranchStatus({
      branchName,
      context,
      description: 'Validation Failed - Empty config file',
      state: 'red',
    });
    return;
  }

  let configFileParsed: any;
  try {
    const fileType = upath.extname(configFileName);
    if (fileType === '.json') {
      configFileParsed = JSON.parse(
        (await readLocalFile(configFileName, 'utf8'))!
      );
      // ? should we allow package.json
      // no need to confirm renovate field in package.json we already do it in `detectConfigFile()`
      if (configFileName === 'package.json') {
        configFileParsed = configFileParsed.renovate;
      }
    } else {
      configFileParsed = JSON5.parse(
        (await readLocalFile(configFileName, 'utf8'))!
      );
    }
  } catch (err) {
    logger.debug({ err }, 'Error while reading config file');
    return;
  }

  // perform validation
  const validationResult = await validateConfig(configFileParsed);
  const existingState = await platform.getBranchStatusCheck(
    branchName,
    context
  );

  // Provide a passing or failing check run based on result
  // failing check
  if (validationResult.errors.length > 0) {
    if (existingState !== 'red') {
      await platform.setBranchStatus({
        branchName,
        context,
        description: 'Validation Failed',
        state: 'red',
      });
      setReconfigureBranchCache(branchSha!, configFileName, false);
    }
  }

  // passing check
  if (existingState !== 'green') {
    await platform.setBranchStatus({
      branchName,
      context,
      description: 'Validation Successfull',
      state: 'green',
    });
    setReconfigureBranchCache(branchSha!, configFileName, true);
  }
}
