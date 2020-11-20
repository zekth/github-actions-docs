module.exports = {
  root: true,
  parserOptions: {
    ecmaVersion: 2017,
    sourceType: 'module',
  },
  env: {
    node: true,
    es6: true,
  },
  parser: '@typescript-eslint/parser',
  plugins: ['prettier', '@typescript-eslint/eslint-plugin'],
  extends: ['eslint:recommended', require.resolve('eslint-config-prettier')],
  rules: {
    'prettier/prettier': 'warn',
    'no-unused-vars': 'warn',
    'prefer-const': 'warn',
    // 'max-params': [2, 3],
  },
};
