#!/bin/bash
# Keep Render API alive by pinging health endpoint every 10 minutes
# Add to crontab: */10 * * * * /home/emoh/Desktop/Bizflow/scripts/keep-alive.sh >> /tmp/bizflow-keepalive.log 2>&1

API_URL="https://bizflow-api-qo3d.onrender.com/api/auth/health"
LOG_PREFIX="[$(date '+%Y-%m-%d %H:%M:%S')]"

response=$(curl -s -w "\n%{http_code}" --max-time 30 "$API_URL" 2>&1)
http_code=$(echo "$response" | tail -1)

if [ "$http_code" = "200" ]; then
  echo "$LOG_PREFIX API healthy (HTTP $http_code)"
else
  echo "$LOG_PREFIX API unreachable (HTTP $http_code) — Render may be waking up"
fi
