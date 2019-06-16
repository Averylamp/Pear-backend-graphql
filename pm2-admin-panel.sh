#!/bin/bash
git pull
yarn install
yarn build
pm2 reload pm2.config.json --env admin-panel

