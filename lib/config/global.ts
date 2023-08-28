import type { RenovateConfig, RepoGlobalConfig } from './types';

export class GlobalConfig {
  private static readonly OPTIONS: (keyof RepoGlobalConfig)[] = [
    'allowCustomCrateRegistries',
    'allowedPostUpgradeCommands',
    'allowPlugins',
    'allowPostUpgradeCommandTemplating',
    'allowScripts',
    'binarySource',
    'cacheDir',
    'cacheHardTtlMinutes',
    'cacheTtlOverride',
    'containerbaseDir',
    'customEnvVariables',
    'dockerChildPrefix',
    'dockerCliOptions',
    'dockerSidecarImage',
    'dockerUser',
    'dryRun',
    'exposeAllEnv',
    'executionTimeout',
    'githubTokenWarn',
    'localDir',
    'migratePresets',
    'privateKey',
    'privateKeyOld',
    'gitTimeout',
    'platform',
    'endpoint',
    'autodiscover',
    'autodiscoverFilter',
    'autodiscoverTopics',
    'baseDir',
    'bbUseDevelopmentBranch',
    'checkedBranches',
    'detectGlobalManagerConfig',
    'detectHostRulesFromEnv',
    'force',
    'forceCli',
    'forkOrg',
    'forkToken',
    'gitNoVerify',
    'gitUrl',
    'globalExtends',
    'includeMirrors',
    'logContext',
    'logFile',
    'logFileLevel',
    'onboarding',
    'onboardingBranch',
    'onboardingCommitMessage',
    'onboardingConfig',
    'onboardingNoDeps',
    'onboardingPrTitle',
    'onboardingRebaseCheckbox',
    'optimizeForDisabled',
    'password',
    'persistRepoData',
    'prCommitsPerRunLimit',
    'privateKeyPath',
    'privateKeyPathOld',
    'productLinks',
    'repositories',
    'repositoryCache',
    'repositoryCacheType',
    'requireConfig',
    'secrets',
    'skipInstalls',
    'token',
    'unicodeEmoji',
    'username',
    'writeDiscoveredRepos',
    'gitPrivateKey',
    'onboardingConfigFileName',
    'redisUrl',
  ];

  private static config: RepoGlobalConfig = {};

  static get(): RepoGlobalConfig;
  static get<Key extends keyof RepoGlobalConfig>(
    key: Key
  ): RepoGlobalConfig[Key];
  static get<Key extends keyof RepoGlobalConfig>(
    key: Key,
    defaultValue: Required<RepoGlobalConfig>[Key]
  ): Required<RepoGlobalConfig>[Key];
  static get<Key extends keyof RepoGlobalConfig>(
    key?: Key,
    defaultValue?: RepoGlobalConfig[Key]
  ): RepoGlobalConfig | RepoGlobalConfig[Key] {
    return key ? GlobalConfig.config[key] ?? defaultValue : GlobalConfig.config;
  }

  static set(config: RenovateConfig | RepoGlobalConfig): RenovateConfig {
    GlobalConfig.reset();

    const result = { ...config };
    for (const option of GlobalConfig.OPTIONS) {
      GlobalConfig.config[option] = config[option] as never;
      delete result[option];
    }

    return result;
  }

  static reset(): void {
    GlobalConfig.config = {};
  }
}
