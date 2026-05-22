#!/bin/bash
set -e

NODE_ENV=production npx expo export --platform web

# index.html: スクリプトパスを相対パスに修正
sed -i '' 's|src="/_expo/|src="_expo/|g' dist/index.html

# index.html: 絵文字フォント追加
sed -i '' 's|</head>|  <link href="https://fonts.googleapis.com/css2?family=Noto+Color+Emoji\&display=swap" rel="stylesheet">\n  </head>|' dist/index.html

# JSバンドル: 画像パスを相対パスに修正
JS_FILE=$(find dist/_expo/static/js/web -name "AppEntry-*.js" | head -1)
if [ -n "$JS_FILE" ]; then
  sed -i '' 's|"/assets/|"assets/|g' "$JS_FILE"
  echo "✅ JSバンドルのパス修正完了: $JS_FILE"
fi

echo "✅ ビルド完了・全パス修正・絵文字フォント追加済み"
