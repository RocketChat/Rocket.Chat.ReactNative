#!/bin/bash

# Number of retry attempts
MAX_RETRIES=3
RETRY_COUNT=0
REGISTRIES=(
  "https://registry.npmjs.org/"
  "https://registry.yarnpkg.com/"
)

# Try installation with default registry first
echo "Attempting yarn install with default registry..."
yarn install
RESULT=$?

# If failed, try with different registries and retry logic
while [ $RESULT -ne 0 ] && [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
  RETRY_COUNT=$((RETRY_COUNT+1))
  echo "Attempt $RETRY_COUNT failed. Retrying..."
  
  # Try each registry
  for REGISTRY in "${REGISTRIES[@]}"; do
    echo "Trying with registry: $REGISTRY"
    yarn config set registry $REGISTRY
    yarn cache clean
    yarn install
    RESULT=$?
    
    if [ $RESULT -eq 0 ]; then
      echo "Installation successful with registry: $REGISTRY"
      exit 0
    fi
  done
  
  # If all registries failed, wait and retry
  echo "All registries failed. Waiting before retry..."
  sleep 10
done

if [ $RESULT -ne 0 ]; then
  echo "Failed to install dependencies after $MAX_RETRIES attempts."
  exit 1
else
  echo "Installation successful."
  exit 0
fi
