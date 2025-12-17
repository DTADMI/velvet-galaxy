## Multi-stage Dockerfile for Velvet Galaxy (Next.js 16, Node 20, pnpm)

# 1) Base image with pnpm
FROM node:20-alpine AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable && corepack prepare pnpm@latest --activate

# 2) Install dependencies (with caching)
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
# If using optional .npmrc or .pnpmfile.cjs, copy them too
RUN pnpm fetch
# Copy only package manifests to maximize cache
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --offline --frozen-lockfile

# 3) Build
FROM base AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NODE_ENV=production
# Ensure Next.js telemetry is disabled in CI builds
ENV NEXT_TELEMETRY_DISABLED=1
# Build the app
RUN pnpm build

# 4) Production runtime image
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create a non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

# Copy necessary build artifacts
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/node_modules ./node_modules

# Expose Next.js port
EXPOSE 3000

USER nextjs

CMD ["pnpm", "start"]
