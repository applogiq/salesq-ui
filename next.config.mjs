/** @type {import('next').NextConfig} */

// Fix: corporate proxy / self-signed cert causes "UNABLE_TO_VERIFY_LEAF_SIGNATURE"
// when Next.js hot-reloader fetches version info. Safe for dev only.
if (process.env.NODE_ENV !== 'production') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

const nextConfig = {};

export default nextConfig;
