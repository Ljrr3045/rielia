/** Operator configuration only; tools never accept an address or credentials. */
export function healthEndpoint(env: NodeJS.ProcessEnv): URL {
  const origin = env['RIELIA_API_ORIGIN'];
  const allowance = env['RIELIA_MCP_ALLOW_LOOPBACK_HTTP'];
  if (!origin || !/^https?:\/\/[^/?#]+\/?$/.test(origin)
    || (allowance !== undefined && allowance !== 'true' && allowance !== 'false')) {
    throw new Error('Invalid MCP configuration. Set an HTTPS RIELIA_API_ORIGIN; see the local MCP guide.');
  }
  const url = new URL(origin);
  if (url.username || url.password || origin.includes('@') || origin.includes('\\')
    || /\s/.test(origin) || url.pathname !== '/' || url.search || url.hash
    || (url.protocol !== 'https:' && !(url.protocol === 'http:' && allowance === 'true'
      && (url.hostname === '127.0.0.1' || url.hostname === '[::1]')))) {
    throw new Error('Invalid MCP configuration. HTTP requires explicit numeric-loopback development allowance.');
  }
  return new URL('/api/v1/health', url);
}
