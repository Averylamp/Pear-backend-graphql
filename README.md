# GraphQL-MongoDB

All the important starting code is in `src/start.js`.
Models and the schema representation is split up in files in `src/models`

We will be using yarn for this repo, not npm

To install the required managers, use brew:

On Linux:
`sh -c "$(curl -fsSL https://raw.githubusercontent.com/Linuxbrew/install/master/install.sh)"`
(You may need to add brew to the path afterwards)

On MacOS:
`/usr/bin/ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"`

Then install dependencies with:

```
brew install node yarn
yarn install
```

Yarn Build / Run:
```
yarn build
yarn start
```

Dev Hot-Reload:
```
yarn startdev
```

To run tests you must have the CircleCI CLI and Docker Installed
To install CircleCI
```
brew install circleci
```
To install Docker it is recommended to go to their website and install Docker Desktop
https://docs.docker.com/docker-for-mac/install/


We will also be using git flow to track release versioning
To start on a new feature use 

`git flow feature start featurename`

To merge that feature into develop:
** Do not run `git flow feature finish featurename`**
First, publish the feature to github, using:
- `git flow feature publish featurename`
- Create a pull request on github into devlop
- Get the pull request reviewed
- Merge the pull request into develop
- Delete the feature branch on remote and locally


Writeups on gitflow
```
https://nvie.com/posts/a-successful-git-branching-model/
https://jeffkreeftmeijer.com/git-flow/
https://github.com/nvie/gitflow

```

To set up linting scripts run from root project folder: 
```
cp pre-commit .git/hooks
```

You shouldn't be able to push directly to master; instead, create and merge PRs.


To add npm packages also user yarn
```
yarn add package
yarn add --dev package
```

Upload schema to Apollo:
```
apollo service:push --key="service:pear-matchmaking-8936:V43kf4Urhi-63wQycK_yoA" --endpoint=host/graphql  --tags="Optional tags"
```


### Deployment

We will be using pm2 for cluster deployment
Our two servers are koala.mit.edu (prod) and sloths.mit.edu (dev)

To update a deploy, pull the latest changes, build them into dist with `yarn build`, then `pm2 reload` to perform a zero-downtime reload.

To install pm2:
```
npm install pm2 -g && pm2 update
pm2 completion install
```

To monitor the deployment:
`pm2 monit`

To list instances:
`pm2 ls`

To start a pm2 deploy
`pm2 start pm2.config.json --env development/production`

Other helpful commands
```
pm2 delete all
pm2 logs all
```



