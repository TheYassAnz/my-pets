import config from '../../vercel.json';

const headerFor = (source: string) => config.headers.find((h) => h.source === source)?.headers ?? [];

describe('vercel.json', () => {
  it('builds the web export into dist', () => {
    expect(config.buildCommand).toBe('npm run build:web');
    expect(config.outputDirectory).toBe('dist');
  });

  it('proxies /api first and falls back to index.html last', () => {
    const { rewrites } = config;
    expect(rewrites[0]).toEqual({
      source: '/api/:path*',
      destination: 'https://my-pets-6j9p.onrender.com/api/:path*',
    });
    expect(rewrites[rewrites.length - 1]).toEqual({ source: '/(.*)', destination: '/index.html' });
    expect(rewrites.slice(0, -1).some((r) => r.source === '/(.*)')).toBe(false);
  });

  it.each(['/sw.js', '/index.html', '/manifest.json', '/'])('serves %s with no-cache', (path) => {
    expect(headerFor(path)).toContainEqual({ key: 'Cache-Control', value: 'no-cache' });
  });

  it('caches hashed assets immutably', () => {
    expect(headerFor('/_expo/static/(.*)')).toContainEqual({
      key: 'Cache-Control',
      value: 'public, max-age=31536000, immutable',
    });
  });
});
