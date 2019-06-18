#!/bin/bash
git submodule update
sh admin-panel/start-admin.sh
cd $(dirname $0)
pm2 reload pm2.config.adminpanel.json 

