#!/bin/bash
sh admin-panel/start-admin.sh
cd $(dirname $0)
pm2 reload pm2.config.adminpanel.json 
ADMIN_SERVER_URL=http://sloths.mit.edu:1235/graphql pm2 serve --name  Admin-Panel admin-panel/build 9091 --spa
