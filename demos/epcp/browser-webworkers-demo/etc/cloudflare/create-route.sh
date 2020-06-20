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

# https://developers.cloudflare.com/workers/api/#upload-a-worker
function create_route() {
  echo "create_route $@"
  pattern="$1"
  if [ -z "$pattern" ]; then
    echo "pattern is required first arg, but got: $pattern"
    exit 1
  fi
  route_json='{ "pattern": "'$pattern'", "enabled": true }'
  echo "route_json=$route_json"
  curl_out="$(curl "https://api.cloudflare.com/client/v4/zones/$CLOUDFLARE_ZONE_ID/workers/filters" \
    -X POST \
    -H "X-Auth-Email: $CLOUDFLARE_EMAIL" \
    -H "X-Auth-Key: $CLOUDFLARE_AUTH_KEY" \
    -H "Content-Type: application/json" \
    --data-binary "$route_json"
  )"
  curl_exit="$?"
  if [ "$curl_exit" != "0" ]; then
    echo "$curl_out"
    echo "error $curl_exit uploading with curl"
    exit 1
  else
    echo "$curl_out"
  fi
}

function require_vars () {
    missing=false
    for var in "$@"; do
        # echo "require_var $var=${!var}"
        if [ -z ${!var+x} ]; then
            echo "var is unset but required: $var"
            missing=true
        fi
    done
    if [ "$missing" == "true" ]; then
        exit 1
    fi
}

function main() {
  . "$THIS_DIR/./bash-functions.sh"
  require_vars CLOUDFLARE_EMAIL CLOUDFLARE_AUTH_KEY CLOUDFLARE_ZONE_ID
  create_route $@
}

main $@