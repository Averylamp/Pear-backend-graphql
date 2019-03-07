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

