import {
  withCache,
  invalidateTags,
  clearCache,
  cacheSize
} from '../../index.js';

// cacheEnabled() reads this at call time, so setting it here is enough.
process.env.CACHE_ENABLED = 'true';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

describe('lib/cache', () => {
  beforeEach(() => clearCache());

  it('stores the computed value and reuses it on the next call', async () => {
    let calls = 0;
    const compute = async () => {
      calls += 1;
      return 'value';
    };
    const first = await withCache('k1', { tags: ['t'] }, compute);
    const second = await withCache('k1', { tags: ['t'] }, compute);
    expect(first).toEqual('value');
    expect(second).toEqual('value');
    expect(calls).toEqual(1);
  });

  it('recomputes after the TTL expires', async () => {
    let calls = 0;
    const compute = async () => {
      calls += 1;
      return calls;
    };
    const first = await withCache('k2', { ttl: 20, tags: [] }, compute);
    await sleep(50);
    const second = await withCache('k2', { ttl: 20, tags: [] }, compute);
    expect(first).toEqual(1);
    expect(second).toEqual(2);
  });

  it('invalidateTags drops every entry carrying the tag', async () => {
    await withCache('a', { tags: ['product:1'] }, async () => 'a');
    await withCache('b', { tags: ['product:1', 'listings'] }, async () => 'b');
    await withCache('c', { tags: ['product:2'] }, async () => 'c');
    expect(cacheSize()).toEqual(3);

    invalidateTags(['product:1']);
    expect(cacheSize()).toEqual(1);

    let cCalls = 0;
    await withCache('c', { tags: ['product:2'] }, async () => {
      cCalls += 1;
      return 'c';
    });
    expect(cCalls).toEqual(0);
  });

  it('supports tags computed from the resolved value', async () => {
    await withCache(
      'cat',
      { tags: (v) => [`category:${v.id}`] },
      async () => ({ id: 7 })
    );
    invalidateTags(['category:7']);
    expect(cacheSize()).toEqual(0);
  });

  it('does not cache when the compute function throws', async () => {
    await expect(
      withCache('boom', { tags: [] }, async () => {
        throw new Error('fail');
      })
    ).rejects.toThrow('fail');
    expect(cacheSize()).toEqual(0);
  });

  it('evicts the oldest entries past the size cap', async () => {
    for (let i = 0; i < 540; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      await withCache(`key-${i}`, { tags: [] }, async () => i);
    }
    expect(cacheSize()).toEqual(500);
  });
});
