#!/bin/bash
git pull
yarn install
yarn build
pm2 reload pm2.config.json --env development
sh pm2-admin-panel.sh
