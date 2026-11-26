import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Without this, a stray lockfile in the home directory makes Next infer the
  // wrong workspace root, which changes how Turbopack resolves modules.
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
