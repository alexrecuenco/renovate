import is from '@sindresorhus/is';
import hasha from 'hasha';
import type { RenovateConfig } from '../../../config/types';
import { addMeta, logger, removeMeta } from '../../../logger';
import { hashMap } from '../../../modules/manager';
import { getCache } from '../../../util/cache/repository';
import type { BranchCache } from '../../../util/cache/repository/types';
import { branchExists } from '../../../util/git';
import { Limit, incLimitedValue, setMaxLimit } from '../../global/limits';
import { BranchConfig, BranchResult } from '../../types';
import { processBranch } from '../update/branch';
import { getBranchesRemaining, getPrsRemaining } from './limits';

export type WriteUpdateResult = 'done' | 'automerged';

export async function writeUpdates(
  config: RenovateConfig,
  allBranches: BranchConfig[]
): Promise<WriteUpdateResult> {
  const branches = allBranches;
  logger.debug(
    `Processing ${branches.length} branch${
      branches.length === 1 ? '' : 'es'
    }: ${branches
      .map((b) => b.branchName)
      .sort()
      .join(', ')}`
  );
  const cache = getCache();
  const { branches: cachedBranches = [] } = cache;
  const prsRemaining = await getPrsRemaining(config, branches);
  logger.debug({ prsRemaining }, 'Calculated maximum PRs remaining this run');
  setMaxLimit(Limit.PullRequests, prsRemaining);

  const branchesRemaining = await getBranchesRemaining(config, branches);
  logger.debug(
    { branchesRemaining },
    'Calculated maximum branches remaining this run'
  );
  setMaxLimit(Limit.Branches, branchesRemaining);

  for (const branch of branches) {
    const { baseBranch, branchName } = branch;
    const meta: Record<string, string> = { branch: branchName };
    if (config.baseBranches?.length && baseBranch) {
      meta['baseBranch'] = baseBranch;
    }
    addMeta(meta);
    const branchExisted = branchExists(branch.branchName);
    let branchCache = {} as BranchCache;
    if (branchExisted) {
      branchCache =
        cachedBranches?.find((br) => br.branchName === branch.branchName) ??
        ({} as BranchCache);

      if (
        config.repositoryCache === 'enabled' &&
        Object.keys(branchCache).length === 0
      ) {
        logger.debug(`No branch cache found for ${branch.branchName}`);
      }
    }
    const branchManagersFingerprint = hasha(
      branch.upgrades
        .map((upgrade) => hashMap.get(upgrade.manager) ?? upgrade.manager)
        .filter(is.string)
    );
    branch.branchFingerprint = hasha([
      JSON.stringify(config),
      branchManagersFingerprint,
    ]);
    const res = await processBranch(branch, branchCache);
    branch.prBlockedBy = res?.prBlockedBy;
    branch.prNo = res?.prNo;
    branch.result = res?.result;
    if (
      branch.result === BranchResult.Automerged &&
      branch.automergeType !== 'pr-comment'
    ) {
      // Stop processing other branches because base branch has been changed
      return 'automerged';
    }
    if (!branchExisted && branchExists(branch.branchName)) {
      incLimitedValue(Limit.Branches);
    }
  }
  removeMeta(['branch', 'baseBranch']);
  return 'done';
}
