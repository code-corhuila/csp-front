import { InjectionToken } from '@angular/core';

export interface RuntimeConfig {
  readonly gatewayUrl: string;
}

export const RUNTIME_CONFIG = new InjectionToken<RuntimeConfig>('RUNTIME_CONFIG');

const CONFIG_PATH = 'config.json';

/**
 * Reads the per-environment configuration the container renders at startup.
 * There is deliberately no default: a shell without it must not guess a gateway.
 */
export async function loadRuntimeConfig(fetchFn: typeof fetch = fetch): Promise<RuntimeConfig> {
  const response = await fetchFn(CONFIG_PATH, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`Cannot start: ${CONFIG_PATH} answered HTTP ${response.status}.`);
  }
  const body: unknown = await response.json();
  const gatewayUrl = (body as { gatewayUrl?: unknown } | null)?.gatewayUrl;
  if (typeof gatewayUrl !== 'string' || gatewayUrl.trim() === '') {
    throw new Error(`Cannot start: ${CONFIG_PATH} has no "gatewayUrl".`);
  }
  return { gatewayUrl };
}
