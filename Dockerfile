# Stage 1: Building the code
FROM node:23-alpine AS builder

WORKDIR /precios-mercado-central

RUN apk add --no-cache yarn

# Install dependencies for building
COPY package*.json yarn.lock ./
RUN yarn install --frozen-lockfile

# Copy source and build
COPY . .
RUN yarn build

# Stage 2: Run the built code
FROM node:23-alpine AS runner
WORKDIR /precios-mercado-central

# Set to production
ENV NODE_ENV=production

# Don't run production as root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files
COPY --from=builder /precios-mercado-central/public ./public
COPY --from=builder /precios-mercado-central/package.json ./package.json
COPY --from=builder /precios-mercado-central/yarn.lock ./yarn.lock

RUN chmod -R 777 ./public

# Copy built assets
COPY --from=builder --chown=nextjs:nodejs /precios-mercado-central/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /precios-mercado-central/.next/static ./.next/static

# Set user
USER nextjs

# Expose and run
EXPOSE 3049
ENV PORT 3049

CMD ["node", "server.js"]
