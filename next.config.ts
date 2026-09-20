import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Dev serves on 127.0.0.1 (see the `dev` script) because that is the
  // canonical origin OAuth redirects are built from. Both spellings are
  // allowed so a stray localhost visit still hydrates instead of rendering a
  // page whose buttons silently do nothing.
  allowedDevOrigins: ['127.0.0.1', 'localhost'],
};

export default nextConfig;
