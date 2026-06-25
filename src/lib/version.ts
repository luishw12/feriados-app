import packageJson from '../../package.json';

export function getAppVersion(): string {
  return packageJson.version;
}

export function formatVersionLabel(version?: string): string {
  return `v${version ?? getAppVersion()}`;
}
