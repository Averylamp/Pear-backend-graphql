module.exports = {
  env: {
    es6: true,
    node: true,
  },
  extends: 'airbnb-base',
  globals: {
    Atomics: 'readonly',
    SharedArrayBuffer: 'readonly',
  },
  parserOptions: {
    ecmaVersion: 2018,
  },
  rules: {
    "no-continue": "off",
    "no-await-in-loop": "off",
    "no-restricted-syntax": "off",
    "no-underscore-dangle": "off",
    "import/prefer-default-export": "off",
    "camelcase" : [ "error", { "allow": ["_id", "_ids"]}]
  },
};
