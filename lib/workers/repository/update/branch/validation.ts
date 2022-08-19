import { GlobalConfig } from '../../../../config/global';
import { REPOSITORY_CHANGED } from '../../../../constants/error-messages';
import { logger } from '../../../../logger';
import { Pr, platform } from '../../../../modules/platform';
import { hashBody } from '../../../../modules/platform/pr-body';
import { PrState } from '../../../../types';
import { getBranchCommit, isBranchModified } from '../../../../util/git';
import { Limit, isLimitReached } from '../../../global/limits';
import { BranchConfig, BranchResult } from '../../../types';
import { getPlatformPrOptions, updatePrDebugData } from '../pr';
import { getPrBody } from '../pr/body';
import { prAlreadyExisted } from './check-existing';
import { handlepr } from './handle-existing';
import type { ProcessBranchResult } from '.';

export async function validation(
  config: BranchConfig,
  branchPr: Pr,
  branchExists: boolean,
  dependencyDashboardCheck?: string
): Promise<ProcessBranchResult | null> {
  // check if branch already existed
  const existingPr = branchPr ? undefined : await prAlreadyExisted(config);
  if (existingPr && !dependencyDashboardCheck) {
    logger.debug(
      { prTitle: config.prTitle },
      'Closed PR already exists. Skipping branch.'
    );
    await handlepr(config, existingPr);
    return {
      branchExists: false,
      prNo: existingPr.number,
      result: BranchResult.AlreadyExisted,
    };
  }

  if (!branchExists && config.dependencyDashboardApproval) {
    if (dependencyDashboardCheck) {
      logger.debug(`Branch ${config.branchName} is approved for creation`);
    } else {
      logger.debug(`Branch ${config.branchName} needs approval`);
      return {
        branchExists,
        prNo: branchPr?.number,
        result: BranchResult.NeedsApproval,
      };
    }
  }

  if (
    !branchExists &&
    isLimitReached(Limit.Branches) &&
    !dependencyDashboardCheck &&
    !config.isVulnerabilityAlert
  ) {
    logger.debug('Reached branch limit - skipping branch creation');
    return {
      branchExists,
      prNo: branchPr?.number,
      result: BranchResult.BranchLimitReached,
    };
  }

  if (
    isLimitReached(Limit.Commits) &&
    !dependencyDashboardCheck &&
    !config.isVulnerabilityAlert
  ) {
    logger.debug('Reached commits limit - skipping branch');
    return {
      branchExists,
      prNo: branchPr?.number,
      result: BranchResult.CommitLimitReached,
    };
  }

  // stop processing branch if it has pending checks
  if (!branchExists && config.pendingChecks && !dependencyDashboardCheck) {
    return {
      branchExists: false,
      prNo: branchPr?.number,
      result: BranchResult.Pending,
    };
  }

  // check if pr has been edited
  if (branchExists) {
    logger.debug('Checking if PR has been edited');
    const branchIsModified = await isBranchModified(config.branchName);
    if (branchPr) {
      logger.debug('Found existing branch PR');
      if (branchPr.state !== PrState.Open) {
        logger.debug(
          'PR has been closed or merged since this run started - aborting'
        );
        throw new Error(REPOSITORY_CHANGED);
      }
      if (
        branchIsModified ||
        (branchPr.targetBranch && branchPr.targetBranch !== config.baseBranch)
      ) {
        logger.debug({ prNo: branchPr.number }, 'PR has been edited');
        if (dependencyDashboardCheck || config.rebaseRequested) {
          logger.debug('Manual rebase has been requested for PR');
        } else {
          const newBody = await getPrBody(config, {
            debugData: updatePrDebugData(existingPr?.bodyStruct?.debugData),
            rebasingNotice:
              'Renovate will not automatically rebase this PR, because other commits have been found.',
          });
          const newBodyHash = hashBody(newBody);
          if (newBodyHash !== branchPr.bodyStruct?.hash) {
            if (GlobalConfig.get('dryRun')) {
              logger.info(
                `DRY-RUN: Would update existing PR to indicate that rebasing is not possible`
              );
            } else {
              logger.debug(
                'Updating existing PR to indicate that rebasing is not possible'
              );
              await platform.updatePr({
                number: branchPr.number,
                prTitle: branchPr.title,
                prBody: newBody,
                platformOptions: getPlatformPrOptions(config),
              });
            }
          }
          return {
            branchExists,
            prNo: branchPr.number,
            result: BranchResult.PrEdited,
          };
        }
      }
    } else if (branchIsModified) {
      const oldPr = await platform.findPr({
        branchName: config.branchName,
        state: PrState.NotOpen,
      });
      if (!oldPr) {
        logger.debug('Branch has been edited but found no PR - skipping');
        return {
          branchExists,
          result: BranchResult.PrEdited,
        };
      }
      const branchSha = getBranchCommit(config.branchName);
      const oldPrSha = oldPr?.sha;
      if (!oldPrSha || oldPrSha === branchSha) {
        logger.debug(
          { oldPrNumber: oldPr.number, oldPrSha, branchSha },
          'Found old PR matching this branch - will override it'
        );
      } else {
        logger.debug(
          { oldPrNumber: oldPr.number, oldPrSha, branchSha },
          'Found old PR but the SHA is different'
        );
        return {
          branchExists,
          result: BranchResult.PrEdited,
        };
      }
    }
  }

  return null;
}
