import { initFederation } from '@angular-architects/native-federation';
import { loadRuntimeConfig } from './app/core/config/runtime-config';

function showStartupError(err: unknown): void {
  console.error(err);
  document.body.textContent = err instanceof Error ? err.message : 'The application cannot start.';
}

// The environment configuration is read first: without it the shell must not start.
// Federation comes next: it must know where every portal lives before Angular
// bootstraps and the router tries to load one. A manifest that does not answer
// does not stop the shell.
loadRuntimeConfig()
  .then(async (config) => {
    await initFederation('federation.manifest.json').catch((err) => console.error(err));
    const { bootstrap } = await import('./bootstrap');
    return bootstrap(config);
  })
  .catch(showStartupError);
