#!/usr/bin/env bash

# Would use readlink -f, but it's not available on macOS
# ---
pushd .

TARGET_FILE=$0
while [ "$TARGET_FILE" != "" ]; do
    cd `dirname $TARGET_FILE`
    FILENAME=`basename $TARGET_FILE`
    TARGET_FILE=`readlink $FILENAME`
done
LINK=`pwd -P`/$FILENAME

popd
# ---

THIS_DIR="$(dirname "$LINK")"
default_worker="$THIS_DIR/../../dist/*.cloudflareworker.js"

# https://developers.cloudflare.com/workers/api/#upload-a-worker
function upload_worker() {
  echo "upload_worker $@"
  worker="${1:-default_worker}"
  curl_out="$(curl "https://api.cloudflare.com/client/v4/zones/$CLOUDFLARE_ZONE_ID/workers/script" \
    -H "X-Auth-Email: $CLOUDFLARE_EMAIL" \
    -X PUT \
    -H "X-Auth-Key: $CLOUDFLARE_AUTH_KEY" \
    -H "Content-Type:application/javascript" \
    --data-binary "@$worker")"
  curl_exit="$?"
  if [ "$curl_exit" != "0" ]; then
    echo "$curl_out"
    echo "error $curl_exit uploading with curl"
  fi
}

function main() {
    . "$THIS_DIR/./bash-functions.sh"
    require_vars CLOUDFLARE_EMAIL CLOUDFLARE_AUTH_KEY CLOUDFLARE_ZONE_ID
    upload_worker $@
}

main $@