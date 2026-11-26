#!/bin/sh
# Collect the files the academy serves into public/ (used by the Cloudflare build).
set -e
rm -rf public && mkdir public
cp app.html public/index.html
cp sw.js manifest.webmanifest _headers icon-192.png icon-512.png icon-maskable-512.png apple-touch-icon.png public/
