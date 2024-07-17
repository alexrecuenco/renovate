import type { Preset, PresetConfig } from '../types';
import * as configPreset from './config';
import * as customManagersPreset from './custom-managers';
import * as defaultPreset from './default';
import * as dockerPreset from './docker';
import * as groupPreset from './group';
import * as helpersPreset from './helpers';
import * as mergeConfidence from './merge-confidence';
import * as monorepoPreset from './monorepos';
import * as npm from './npm';
import * as packagesPreset from './packages';
import * as previewPreset from './preview';
import * as replacements from './replacements';
import * as schedulePreset from './schedule';
import * as securityPreset from './security';
import * as workaroundsPreset from './workarounds';

/* eslint sort-keys: ["error", "asc", {caseSensitive: false, natural: true}] */

export const groups: Record<
  string,
  Record<string, Preset> | Promise<Record<string, Preset>>
> = {
  config: configPreset.presets,
  customManagers: customManagersPreset.presets,
  default: defaultPreset.presets,
  docker: dockerPreset.presets,
  group: groupPreset.presets,
  helpers: helpersPreset.presets,
  mergeConfidence: mergeConfidence.presets,
  monorepo: monorepoPreset.presets,
  npm: npm.presets,
  packages: packagesPreset.presets,
  preview: previewPreset.presets,
  replacements: replacements.presets,
  schedule: schedulePreset.presets,
  security: securityPreset.presets,
  workarounds: workaroundsPreset.presets,
};

export async function getPreset({
  repo,
  presetName,
}: PresetConfig): Promise<Preset | undefined> {
  const pres = await groups[repo];
  return pres && presetName ? pres[presetName] : undefined;
}
