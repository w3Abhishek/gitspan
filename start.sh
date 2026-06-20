#!/bin/bash
echo "Starting GitSpan via Docker Compose..."
docker-compose up -d --build
echo "GitSpan is now running in the background!"
echo "- Frontend: http://localhost:3000"
echo "- Backend API: http://localhost:8000"
