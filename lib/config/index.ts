import { logger } from '../logger';
import { get, getManagerList } from '../modules/manager';
import * as options from './options';
import type {
  AllConfig,
  ManagerConfig,
  RenovateConfig,
  RenovateConfigStage,
} from './types';
import { mergeChildConfig } from './utils';

export { mergeChildConfig };

export function getManagerConfig(
  config: RenovateConfig,
  manager: string
): ManagerConfig {
  let managerConfig: ManagerConfig = {
    ...config,
    manager,
  };
  const categories = get(manager, 'categories');
  if (categories) {
    managerConfig.categories = categories;
  }
  // TODO: fix types #7154
  // TODO: do we allow separate config objects for custom managers? if yes this need minor modification
  managerConfig = mergeChildConfig(managerConfig, config[manager] as any);
  // TODO: do we allow separate config objects for custom managers? if yes this need minor modification
  for (const i of getManagerList()) {
    delete managerConfig[i];
  }
  return managerConfig;
}

export function filterConfig(
  inputConfig: AllConfig,
  targetStage: RenovateConfigStage
): AllConfig {
  logger.trace({ config: inputConfig }, `filterConfig('${targetStage}')`);
  const outputConfig: RenovateConfig = { ...inputConfig };
  const stages: (string | undefined)[] = [
    'global',
    'repository',
    'package',
    'branch',
    'pr',
  ];
  const targetIndex = stages.indexOf(targetStage);
  for (const option of options.getOptions()) {
    const optionIndex = stages.indexOf(option.stage);
    if (optionIndex !== -1 && optionIndex < targetIndex) {
      delete outputConfig[option.name];
    }
  }
  return outputConfig;
}
