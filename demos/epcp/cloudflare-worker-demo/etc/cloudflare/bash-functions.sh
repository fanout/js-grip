#!/usr/bin/env bash

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
