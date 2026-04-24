#!/bin/bash

# BizFlow Production Deployment Script
# This script builds and deploys the fullstack application using Docker Compose

set -e

echo "========================================"
echo "BizFlow Production Deployment"
echo "========================================"

# Check if .env exists
if [ ! -f .env ]; then
    echo "ERROR: .env file not found!"
    echo "Please copy .env.example to .env and configure your environment variables."
    exit 1
fi

# Validate required environment variables
echo "Validating environment variables..."
required_vars=("DB_PASSWORD" "JWT_SECRET" "NEXT_PUBLIC_API_URL")
missing_vars=()

for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        missing_vars+=("$var")
    fi
done

if [ ${#missing_vars[@]} -gt 0 ]; then
    echo "ERROR: Missing required environment variables: ${missing_vars[*]}"
    echo "Please update your .env file."
    exit 1
fi

# Pull latest images
echo "Pulling base images..."
docker-compose pull postgres

# Build and start services
echo "Building and starting services..."
docker-compose up -d --build

# Wait for services to be healthy
echo "Waiting for services to become healthy..."
sleep 10

# Check service health
echo "Checking service health..."
docker-compose ps

# Display logs
echo ""
echo "========================================"
echo "Deployment Complete!"
echo "========================================"
echo ""
echo "Services running:"
echo "  Frontend:  http://localhost:3000"
echo "  Backend:   http://localhost:5000"
echo "  PostgreSQL: localhost:5432"
echo ""
echo "To view logs:    docker-compose logs -f"
echo "To stop:         docker-compose down"
echo "To stop + clear: docker-compose down -v"
echo ""
