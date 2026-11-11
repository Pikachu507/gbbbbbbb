import type { NextConfig } from 'next';
const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: { remotePatterns: [
    {protocol:'https',hostname:'**.supabase.co'},
    {protocol:'https',hostname:'images.unsplash.com'},
  ]},
  headers: async () => [{source:'/(.*)',headers:[
    {key:'X-Content-Type-Options',value:'nosniff'},
    {key:'Referrer-Policy',value:'strict-origin-when-cross-origin'},
    {key:'X-Frame-Options',value:'DENY'},
  ]}],
};
export default nextConfig;
