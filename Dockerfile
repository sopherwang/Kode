# Use Node.js 18 as base image
FROM node:18-alpine AS base

# Configure Alpine to use China mirrors
RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.aliyun.com/g' /etc/apk/repositories

# Install dependencies needed for the build
RUN apk add --no-cache \
    bash \
    git \
    python3 \
    py3-pip \
    make \
    g++ \
    curl

# Configure npm to use China registry
RUN npm config set registry https://registry.npmmirror.com/

# Configure pip to use Tsinghua mirror
RUN pip config set global.index-url https://pypi.tuna.tsinghua.edu.cn/simple

# Install bun with SSL bypass for China network
RUN curl -kfsSL https://bun.sh/install | bash || \
    (wget --no-check-certificate -O- https://bun.sh/install | bash) || \
    echo "Bun installation failed, will use npm as fallback"
ENV PATH="/root/.bun/bin:$PATH"
# Set working directory
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* bun.lock* ./

# Install dependencies (try bun first, fallback to npm)
RUN (command -v bun && bun install) || npm install

# Copy source code, excluding node_modules (handled by .dockerignore)
COPY . .
# Build the application
RUN (command -v bun && bun run build) || npm run build

# Verify files exist after build
RUN ls -la /app/

# Also install tsx globally since it's needed at runtime (with SSL bypass)
RUN npm config set strict-ssl false && \
    npm install -g tsx && \
    npm config set strict-ssl true

WORKDIR /workspace 
 
# Create the entrypoint script directly in the container
RUN echo '#!/bin/sh' > /entrypoint.sh && \
    echo 'if command -v bun > /dev/null 2>&1; then' >> /entrypoint.sh && \
    echo '  /root/.bun/bin/bun /app/cli.js -c /workspace "$@"' >> /entrypoint.sh && \
    echo 'else' >> /entrypoint.sh && \
    echo '  node /app/cli.js -c /workspace "$@"' >> /entrypoint.sh && \
    echo 'fi' >> /entrypoint.sh

RUN chmod +x /entrypoint.sh

# Set the entrypoint
ENTRYPOINT ["/entrypoint.sh"]