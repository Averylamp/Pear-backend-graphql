#!/bin/bash
git pull
yarn build
pm2 reload pm2.config.json 
