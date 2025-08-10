#!/usr/bin/env bash
set -euo pipefail

###
# React → S3 + CloudFront deploy (yarn version)
#
# Requirements:
#   - AWS CLI v2 configured (profile/role with s3:PutObject, s3:ListBucket, cloudfront:CreateInvalidation)
#   - Node & yarn
#
# Usage:
#   S3_BUCKET=my-bucket CF_DIST_ID=E1234567890 ./deploy.sh
#   (optional) BUILD_DIR=dist AWS_PROFILE=prod AWS_REGION=us-east-1 ./deploy.sh
#   Add --no-build to skip building if you already ran it.
###

# -------- Config --------
BUILD_DIR="build"           # CRA default "build"; Vite default often "dist"
S3_BUCKET="delta-kappa-connection"
CF_DIST_ID="E2YOTX78V0BRWP"
AWS_PROFILE="deltakappa"
AWS_REGION="us-east-2"

SKIP_BUILD="false"
if [[ "${1:-}" == "--no-build" ]]; then
  SKIP_BUILD="true"
fi

# -------- Guardrails --------
if ! command -v aws >/dev/null 2>&1; then
  echo "❌ aws CLI not found. Install AWS CLI v2 and configure credentials." >&2
  exit 1
fi
if ! command -v yarn >/dev/null 2>&1; then
  echo "❌ yarn not found. Install Yarn (npm install -g yarn)." >&2
  exit 1
fi
if [[ -z "$S3_BUCKET" ]]; then
  echo "❌ S3_BUCKET env var is required." >&2
  exit 1
fi
if [[ -z "$CF_DIST_ID" ]]; then
  echo "❌ CF_DIST_ID env var is required." >&2
  exit 1
fi

# Check bucket access early
aws s3 ls "s3://$S3_BUCKET" --profile "$AWS_PROFILE" >/dev/null

# -------- Build --------
if [[ "$SKIP_BUILD" != "true" ]]; then
  echo "📦 Building React app with yarn…"
  yarn install --frozen-lockfile
  yarn build
else
  echo "⏩ Skipping build ( --no-build )"
fi

if [[ ! -d "$BUILD_DIR" ]]; then
  echo "❌ Build directory '$BUILD_DIR' not found." >&2
  exit 1
fi

# -------- Upload hashed static assets (long cache) --------
echo "☁️  Syncing static assets with long cache headers…"
aws s3 sync "$BUILD_DIR/" "s3://$S3_BUCKET/" \
  --profile "$AWS_PROFILE" --region "$AWS_REGION" \
  --delete \
  --exclude "index.html" \
  --cache-control "public,max-age=31536000,immutable"

# Optional: treat source maps differently (short cache)
if compgen -G "$BUILD_DIR/**/*.map" > /dev/null; then
  echo "🗺️  Uploading source maps with short cache…"
  aws s3 cp "$BUILD_DIR" "s3://$S3_BUCKET" \
    --profile "$AWS_PROFILE" --region "$AWS_REGION" \
    --recursive --exclude "*" --include "*.map" \
    --cache-control "public,max-age=300"
fi

# -------- Upload HTML entry (no cache) --------
echo "📄 Uploading index.html with no-cache…"
aws s3 cp "$BUILD_DIR/index.html" "s3://$S3_BUCKET/index.html" \
  --profile "$AWS_PROFILE" --region "$AWS_REGION" \
  --cache-control "no-cache" \
  --content-type "text/html; charset=utf-8"

if [[ -f "$BUILD_DIR/200.html" ]]; then
  aws s3 cp "$BUILD_DIR/200.html" "s3://$S3_BUCKET/200.html" \
    --profile "$AWS_PROFILE" --region "$AWS_REGION" \
    --cache-control "no-cache" \
    --content-type "text/html; charset=utf-8"
fi

# -------- CloudFront invalidation --------
echo "🌬️  Creating CloudFront invalidation…"
aws cloudfront create-invalidation \
  --profile "$AWS_PROFILE" \
  --distribution-id "$CF_DIST_ID" \
  --paths "/index.html" "/"

echo "✅ Deploy complete."
