#!/usr/bin/env bash
export MONGO_URL=mongodb://localhost:3062/meteor
export MONGO_OPLOG_URL=mongodb://localhost:3062/local
meteor --port 3064
