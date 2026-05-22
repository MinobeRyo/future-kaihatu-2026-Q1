#!/bin/bash
set -e

NODE_ENV=production npx expo export --platform web

sed -i '' 's|src="/_expo/|src="_expo/|g' dist/index.html

echo "✅ ビルド完了・パス修正済み"
