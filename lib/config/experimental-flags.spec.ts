import { GlobalConfig } from '../config/global';
import { ExperimentalFlag } from './experimental-flags';

describe('util/experimental-flags', () => {
  describe('experimentalFlagValue()', () => {
    beforeEach(() => {
      GlobalConfig.reset();
      ExperimentalFlag.reset();
    });

    it('returns null if flag not found', () => {
      GlobalConfig.set({
        experimentalFlags: ['dockerMaxPages=19'],
      });
      expect(ExperimentalFlag.get('dockerHubTags')).toBeNull();
    });

    it('returns null if experimentalFlags is undefined', () => {
      expect(ExperimentalFlag.get('dockerHubTags')).toBeNull();
    });

    it('returns value', () => {
      GlobalConfig.set({
        experimentalFlags: [
          'dockerHubTags',
          'dockerMaxPages=19',
          'mergeConfidenceSupportedDatasources=["docker"]',
        ],
      });
      expect(ExperimentalFlag.get('dockerHubTags')).toBe('dockerHubTags');
      expect(ExperimentalFlag.get('dockerHubTags')).toBe('dockerHubTags'); // validate caching
      expect(ExperimentalFlag.get('dockerMaxPages')).toBe('19');
      expect(ExperimentalFlag.get('mergeConfidenceSupportedDatasources')).toBe(
        '["docker"]',
      );
    });
  });
});
