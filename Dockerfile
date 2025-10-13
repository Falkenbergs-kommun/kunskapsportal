# ===================================
# PRODUCTION DOCKERFILE WITH LIBREOFFICE
# ===================================
# Optimized multi-stage build for Knowledge Base app
# Final image size: ~800MB (includes LibreOffice)

# ===================================
# Stage 1: Base image with LibreOffice
# ===================================
FROM node:22-bookworm-slim AS base-with-libreoffice

# Install LibreOffice and essential system dependencies
# Using bookworm-slim for Debian base (LibreOffice compatibility)
RUN apt-get update && apt-get install -y \
    # LibreOffice headless installation
    libreoffice \
    # Essential fonts for document rendering
    fonts-liberation \
    fonts-dejavu \
    # Process management and utilities
    dumb-init \
    # SSL certificates
    ca-certificates \
    # Clean up to reduce layer size
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Verify LibreOffice installation
RUN libreoffice --version

# ===================================
# Stage 2: Dependencies installation
# ===================================
FROM base-with-libreoffice AS deps

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN corepack enable pnpm && \
    pnpm install --frozen-lockfile --prod=false

# ===================================
# Stage 3: Build application
# ===================================
FROM base-with-libreoffice AS builder

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy application source
COPY . .

# Generate Payload types and build application
RUN corepack enable pnpm && \
    pnpm generate:types && \
    pnpm build

# ===================================
# Stage 4: Production runtime
# ===================================
FROM base-with-libreoffice AS runner

WORKDIR /app

# Create non-root user for security with a proper home directory
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 --home /home/nextjs nextjs && \
    mkdir -p /home/nextjs && \
    chown -R nextjs:nodejs /home/nextjs

# Copy built application from builder stage
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Create temp directory for LibreOffice conversions and media directory for uploads
RUN mkdir -p /app/temp/conversions /app/media && \
    chown -R nextjs:nodejs /app/temp /app/media

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV HOME=/home/nextjs

# Disable Next.js telemetry
ENV NEXT_TELEMETRY_DISABLED=1

# Node.js memory optimization for production
ENV NODE_OPTIONS="--max-old-space-size=2048"

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })" || exit 1

# Use dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "server.js"]

# ===================================
# USAGE
# ===================================
# docker-compose up --build
# 
# Expected image size: ~800MB (includes LibreOffice)
# Memory usage: 512MB-1GB (depending on LibreOffice usage)