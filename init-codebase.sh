#!/usr/bin/env bash

set -exu
#### local repo
REPO_HOST=localhost:6060
REPO_NAME=image-verify

version=`curl -s http://$REPO_HOST/api/v1/repo/$REPO_NAME | jq -r .version`
version=$(( version+1 ))

#create repo
curl -X POST http://$REPO_HOST/api/v1/repo/$REPO_NAME
#main
curl -X POST http://$REPO_HOST/api/v1/repo/$REPO_NAME/main.js --data-binary '@./repo/scripts/main.js'
#config
curl -X POST http://$REPO_HOST/api/v1/repo/$REPO_NAME/config.json --data-binary '@./repo/scripts/config.json'

#release
curl -X POST http://$REPO_HOST/api/v1/repo/$REPO_NAME --data '{"version": '$version'}'