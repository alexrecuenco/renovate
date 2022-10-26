import { commitFiles } from '../../util/git';
import type { CommitFilesConfig } from '../../util/git/types';
import { platform } from '.';

export function commitAndPush(
  commitConfig: CommitFilesConfig
): Promise<string | null> {
  return commitConfig.platformCommit && platform.commitFiles
    ? platform.commitFiles(commitConfig)
    : commitFiles(commitConfig);
}
