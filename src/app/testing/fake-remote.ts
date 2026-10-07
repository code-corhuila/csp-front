interface FederationRegistry {
  remoteNamesToRemote: Map<string, unknown>;
  baseUrlToRemoteNames: Map<string, string>;
}

const registry = (): FederationRegistry =>
  (globalThis as unknown as { __NATIVE_FEDERATION__: FederationRegistry }).__NATIVE_FEDERATION__;

/**
 * Registers a portal in the federation runtime as if its remoteEntry had been read. The exposed
 * module is a data: URL holding `source`, so loading it needs no server.
 * Returns the function that removes the portal again.
 */
export function registerFakeRemote(name: string, exposedModule: string, source: string): () => void {
  const baseUrl = `data:text/javascript;charset=utf-8,${encodeURIComponent(`${source}
//`)}`;
  registry().remoteNamesToRemote.set(name, {
    name,
    baseUrl,
    shared: [],
    exposes: [{ key: exposedModule, outFileName: 'module.js' }],
  });
  registry().baseUrlToRemoteNames.set(baseUrl, name);
  return () => {
    registry().remoteNamesToRemote.delete(name);
    registry().baseUrlToRemoteNames.delete(baseUrl);
  };
}
