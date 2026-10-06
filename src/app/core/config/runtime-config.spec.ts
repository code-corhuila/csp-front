import { loadRuntimeConfig } from './runtime-config';

function answer(body: unknown, status = 200): typeof fetch {
  return () => Promise.resolve(new Response(JSON.stringify(body), { status }));
}

describe('loadRuntimeConfig', () => {
  it('returns the gateway URL of the environment', async () => {
    const config = await loadRuntimeConfig(answer({ gatewayUrl: 'http://gateway.test' }));

    expect(config.gatewayUrl).toBe('http://gateway.test');
  });

  it('asks for config.json without using the cache', async () => {
    const fetchFn = jasmine
      .createSpy('fetch')
      .and.callFake(answer({ gatewayUrl: 'http://gateway.test' }));

    await loadRuntimeConfig(fetchFn);

    expect(fetchFn).toHaveBeenCalledWith('config.json', { cache: 'no-store' });
  });

  it('fails when gatewayUrl is missing', async () => {
    await expectAsync(loadRuntimeConfig(answer({}))).toBeRejectedWithError(/no "gatewayUrl"/);
  });

  it('fails when gatewayUrl is blank', async () => {
    await expectAsync(loadRuntimeConfig(answer({ gatewayUrl: ' ' }))).toBeRejectedWithError(
      /no "gatewayUrl"/,
    );
  });

  it('fails when config.json cannot be read', async () => {
    await expectAsync(loadRuntimeConfig(answer({}, 404))).toBeRejectedWithError(/HTTP 404/);
  });
});
