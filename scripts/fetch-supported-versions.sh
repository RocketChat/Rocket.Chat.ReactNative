#!/bin/bash

# URL to fetch data from
URL="https://releases.rocket.chat/v2/server/supportedVersions?source=mobile"

# Output file name
OUTPUT_FILE="app-supportedversions.json"

# Use curl to fetch data and save it to a temporary file
TEMP_FILE=$(mktemp)
curl -s "$URL" > "$TEMP_FILE"

# Check if the curl command was successful (HTTP status code 200)
if [ $? -eq 0 ]; then
  # Use jq to pretty-print the JSON and save it to the output file
  jq '.' "$TEMP_FILE" > "$OUTPUT_FILE"
  echo "Data fetched and saved to $OUTPUT_FILE"
else
  echo "Failed to fetch data from $URL"
fi

# Clean up the temporary file
rm "$TEMP_FILE"