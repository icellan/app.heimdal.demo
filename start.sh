#!/usr/bin/env bash

ADDRESS=`echo -n \`ifconfig en0 2>/dev/null|awk '/inet / {print $2}'\``

yarn
export ROOT_URL=http://${ADDRESS}:3064
meteor --port 3064 --settings settings.json
