# Server Dockerfile
FROM node:22-alpine

WORKDIR /app

# Install curl for healthchecks
RUN apk add --no-cache curl

# Copy server package files
COPY server/package*.json ./
RUN npm ci --omit=dev

# Copy server source code
COPY server/ .

# Create non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S appuser -u 1001

USER appuser

EXPOSE 5000

CMD ["node", "index.js"]
