/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: '**.supabase.co',
            },
        ],
    },
    experimental: {
        serverActions: {
            bodySizeLimit: '10mb',
        },
        optimizeCss: true,
        scrollRestoration: true,
        staleTimes: {
            dynamic: 30,
            static: 300,
        },
        optimizePackageImports: [
            "lucide-react",
            "date-fns",
        ],
    },
    compiler: {
        removeConsole: process.env.NODE_ENV === 'production' ? {exclude: ['error']} : false,
    },
    poweredByHeader: false,
    generateEtags: true,
    compress: true,
    productionBrowserSourceMaps: false,
    turbopack: {
        root: process.cwd()
    },
    async headers() {
        return [
            {
                source: '/(.*)',
                headers: securityHeaders,
            },
        ];
    },
    env: {
        NEXT_PUBLIC_SUPABASE_URL: process.env.SUPABASE_URL,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
    }
};

const securityHeaders = [
    {
        key: 'X-DNS-Prefetch-Control',
        value: 'on',
    },
    {
        key: 'Strict-Transport-Security',
        value: 'max-age=63072000; includeSubDomains; preload',
    },
    {
        key: 'X-Frame-Options',
        value: 'SAMEORIGIN',
    },
    {
        key: 'X-Content-Type-Options',
        value: 'nosniff',
    },
    {
        key: 'Referrer-Policy',
        value: 'origin-when-cross-origin',
    },
    {
        key: 'Content-Security-Policy',
        value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' https: data: blob:; media-src 'self' https: blob:; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.stripe.com; frame-src 'self'; font-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self';",
    },
    {
        key: 'Permissions-Policy',
        value: 'camera=self, microphone=self, geolocation=self, interest-cohort=()',
    },
    {
        key: 'Cross-Origin-Opener-Policy',
        value: 'same-origin',
    },
    {
        key: 'Cross-Origin-Resource-Policy',
        value: 'same-origin',
    },
    {
        key: 'X-Permitted-Cross-Domain-Policies',
        value: 'none',
    },
];

export default nextConfig;
