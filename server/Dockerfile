# Server Dockerfile
FROM node:18-alpine

WORKDIR /app

# Install curl for healthchecks
RUN apk add --no-cache curl

# Copy root package files (dependencies are defined at project root)
COPY package*.json ./
RUN npm ci --only=production

# Copy server source code
COPY server ./server

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

USER nextjs

EXPOSE 5000

CMD ["node", "server/index.js"]
