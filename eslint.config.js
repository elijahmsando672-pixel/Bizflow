module.exports = {
  root: true,
  extends: ['eslint:recommended'],
  rules: {
    'no-unused-vars': 'warn',
    'no-console': 'warn',
  },
  ignorePatterns: ['dist/', 'node_modules/', 'coverage/'],
};
