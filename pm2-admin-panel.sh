#!/bin/bash
git pull
yarn install
yarn build
sh admin-panel/start-admin.sh
pm2 reload pm2.config.adminpanel.json 

