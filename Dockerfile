# Mirror - Production Docker Image
# Phase 8: Deployment & Operations

# Use Node.js 18 LTS Alpine for smaller image size
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    curl \
    && rm -rf /var/cache/apk/*

# Install PM2 globally
RUN npm install -g pm2 @babel/runtime

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy application code
COPY . .

# Create necessary directories
RUN mkdir -p data logs data/historical data/backtests

# Set environment variables
ENV NODE_ENV=production
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S mirror -u 1001

# Change ownership of app directory
RUN chown -R mirror:nodejs /app
USER mirror

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node healthcheck.js || exit 1

# Expose port for health checks (optional)
EXPOSE 3000

# Default command - can be overridden
CMD ["pm2-runtime", "ecosystem.config.js", "--env", "production"]
