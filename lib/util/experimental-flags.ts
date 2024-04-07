import { GlobalConfig } from '../config/global';

const parsedExperimentalFlags: Record<string, string> = {};

export function experimentalFlagValue(flagName: string): string | null {
  const experimentalFlags = GlobalConfig.get('experimentalFlags');

  if (!experimentalFlags) {
    return null;
  }

  // Check if the flag value is already parsed and stored
  if (parsedExperimentalFlags[flagName]) {
    return parsedExperimentalFlags[flagName];
  }

  for (const flag of experimentalFlags) {
    if (flag.includes(flagName)) {
      const [key, value] = flag.split('=');
      parsedExperimentalFlags[key] = value ?? key;
      return value ?? key;
    }
  }

  return null;
}
