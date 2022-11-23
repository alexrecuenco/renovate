import { logger, mocked } from '../../../../../test/util';
import * as _cache from '../../../../util/cache/repository';
import type {
  BranchCache,
  RepoCacheData,
} from '../../../../util/cache/repository/types';
import { getPrCache, setPrCache } from './set-pr-cache';

jest.mock('../../../../util/cache/repository');
const cache = mocked(_cache);

describe('workers/repository/update/pr/set-pr-cache', () => {
  const branchCache: BranchCache = {
    automerge: false,
    baseBranch: 'base_branch',
    baseBranchSha: 'base_sha',
    branchName: 'branch_name',
    prNo: null,
    sha: 'sha',
    upgrades: [],
    prCache: null,
  };
  const dummyCache: RepoCacheData = {
    branches: [branchCache],
  };

  describe('getPrCache()', () => {
    it('return null for null cache', () => {
      cache.getCache.mockReturnValue({});
      expect(getPrCache('branch_name')).toBeNull();
    });

    it('return null if prCache is absent or null', () => {
      cache.getCache.mockReturnValue(dummyCache);
      expect(getPrCache('branch_name')).toBeNull();
    });

    it('returns prCache', () => {
      branchCache.prCache = {
        fingerprint: 'fp',
        lastEdited: new Date('11/11/2011'),
      };
      cache.getCache.mockReturnValue(dummyCache);
      expect(getPrCache('branch_name')).toStrictEqual({
        fingerprint: 'fp',
        lastEdited: new Date('11/11/2011'),
      });
    });
  });

  describe('setPrCache()', () => {
    it('logs if branch not found', () => {
      cache.getCache.mockReturnValue(dummyCache);
      setPrCache('branch_1', 'fingerprint_hash');
      expect(logger.logger.debug).toHaveBeenCalledWith(
        'setPrCache(): Branch cache not present'
      );
    });

    it('set prCache', () => {
      cache.getCache.mockReturnValue(dummyCache);
      jest.useFakeTimers().setSystemTime(new Date('2020-01-01'));
      setPrCache('branch_name', 'fingerprint_hash');
      expect(dummyCache).toStrictEqual({
        branches: [
          {
            ...branchCache,

            prCache: {
              fingerprint: 'fingerprint_hash',
              lastEdited: new Date('2020-01-01'),
            },
          },
        ],
      });
    });
  });
});
