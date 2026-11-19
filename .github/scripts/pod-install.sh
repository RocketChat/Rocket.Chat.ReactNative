#!/usr/bin/env bash
set -euo pipefail

if [ -d ios/Pods ] && ! cmp -s ios/Podfile.lock ios/Pods/Manifest.lock; then
	echo "ios/Pods was restored for a different Podfile.lock; removing it"
	rm -rf ios/Pods
fi

pnpm pod-install
