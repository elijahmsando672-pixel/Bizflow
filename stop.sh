#!/bin/bash

# BizFlow Stop Script
# Stops all running services and removes containers

echo "Stopping BizFlow services..."
docker-compose down

echo "Services stopped."
echo "To start again, run: ./deploy.sh"
