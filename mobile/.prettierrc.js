module.exports = {
  semi: true,
  trailingComma: 'es5',
  singleQuote: true,
  printWidth: 100,
  tabWidth: 2,
  useTabs: false,
  bracketSpacing: true,
  jsxBracketSameLine: false,
  arrowParens: 'always',
  endOfLine: 'lf',
  jsxSingleQuote: false,
  quoteProps: 'as-needed',
  importOrder: [
    '^react',
    '^react-native',
    '^expo',
    '^@?\\w',
    '^@/',
    '^[./]'
  ],
  importOrderSeparation: true,
  importOrderSortSpecifiers: true
};