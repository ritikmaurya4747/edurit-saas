import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // TODO: Remove this redirect when the login page is implemented async redirects() { 
  async redirects() { 
    return [
      {
        source: "/",
        destination: "/login",
        permanent: false, 
      },
    ];
  },
};

export default nextConfig;
