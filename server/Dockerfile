# Server Dockerfile
FROM node:22-alpine

WORKDIR /app

# Install curl for healthchecks and pg_dump for database backups
RUN apk add --no-cache curl postgresql16-client

# Copy server package files
COPY server/package*.json ./
RUN npm ci --omit=dev

# Copy server source code
COPY server/ .

# Create non-root user with a writable backup directory
RUN addgroup -g 1001 -S nodejs \
 && adduser -S appuser -u 1001 \
 && mkdir -p /app/backups \
 && chown appuser:nodejs /app/backups \
 && chmod 0700 /app/backups

USER appuser

EXPOSE 5000

CMD ["node", "index.js"]
