import { getManagerConfig, mergeChildConfig } from '../../../config';
import type {
  RegexManagerTemplates,
  RenovateConfig,
} from '../../../config/types';
import { getManagerList } from '../../../modules/manager';
import { getCustomManagerList } from '../../../modules/manager/custom';
import { validMatchFields } from '../../../modules/manager/custom/regex/utils';
import type { CustomExtractConfig } from '../../../modules/manager/types';
import type { WorkerExtractConfig } from '../../types';

export interface FingerprintExtractConfig {
  managerList: Set<string>;
  managers: WorkerExtractConfig[];
}

function getRegexManagerFields(
  config: WorkerExtractConfig
): CustomExtractConfig {
  const regexFields = {} as CustomExtractConfig;
  for (const field of validMatchFields.map(
    (f) => `${f}Template` as keyof RegexManagerTemplates
  )) {
    if (config[field]) {
      regexFields[field] = config[field];
    }
  }

  return {
    autoReplaceStringTemplate: config.autoReplaceStringTemplate,
    matchStrings: config.matchStrings,
    matchStringsStrategy: config.matchStringsStrategy,
    ...regexFields,
  };
}

function getFilteredManagerConfig(
  config: WorkerExtractConfig
): WorkerExtractConfig {
  return {
    ...(config.manager === 'custom.regex' && getRegexManagerFields(config)),
    manager: config.manager,
    fileMatch: config.fileMatch,
    npmrc: config.npmrc,
    npmrcMerge: config.npmrcMerge,
    enabled: config.enabled,
    ignorePaths: config.ignorePaths ?? [],
    includePaths: config.includePaths ?? [],
    skipInstalls: config.skipInstalls,
    registryAliases: config.registryAliases,
    fileList: [],
  };
}

export function generateFingerprintConfig(
  config: RenovateConfig
): FingerprintExtractConfig {
  const managerExtractConfigs: WorkerExtractConfig[] = [];
  const customManagerList = getCustomManagerList();
  let managerList: Set<string>;
  const { enabledManagers } = config;
  if (enabledManagers?.length) {
    managerList = new Set(enabledManagers);
  } else {
    managerList = new Set(getManagerList());
  }

  const fingerprintManagerList: Set<string> = new Set();

  const handleCustomManager = (
    customMgr: string,
    config: RenovateConfig
  ): void => {
    // TODO: filter regexManagers using customType
    for (const regexManager of config.regexManagers ?? []) {
      const customManagerConfig = getManagerConfig(config, customMgr);
      managerExtractConfigs.push({
        ...mergeChildConfig(customManagerConfig, regexManager),
        fileList: [],
      });
    }
  };

  for (const manager of managerList) {
    if (manager === 'custom') {
      for (const customManager of customManagerList) {
        fingerprintManagerList.add(`custom.${customManager}`);
        handleCustomManager(`custom.${customManager}`, config);
      }
    } else if (manager.startsWith('custom.')) {
      handleCustomManager(manager, config);
    } else {
      const managerConfig = getManagerConfig(config, manager);
      managerExtractConfigs.push({ ...managerConfig, fileList: [] });
    }
    fingerprintManagerList.add(manager);
  }

  return {
    managerList: fingerprintManagerList,
    managers: managerExtractConfigs.map(getFilteredManagerConfig),
  };
}
