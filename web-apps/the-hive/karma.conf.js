/* eslint-disable import/no-extraneous-dependencies */
const { createDefaultConfig } = require('@open-wc/testing-karma');
const path  = require('path');
const { merge } = require('webpack-merge');

process.env.CHROME_BIN = require('puppeteer').executablePath();
console.log(process.env.CHROME_BIN);

module.exports = (config) => {
  config.set(
    merge(createDefaultConfig(config), {
      files: [
        // runs all files ending with .test in the test folder,
        // can be overwritten by passing a --grep flag. examples:
        //
        // npm run test -- --grep test/foo/bar.test.js
        // npm run test -- --grep test/bar/*
        { pattern: config.grep ? config.grep : 'test/unit/**/*.test.js', type: 'module' }
      ],
      esm: {
        nodeResolve: true,
        coverageExclude: [
          'src/styles/characters.js',
          'src/styles/index.js',
          // RE - exclude this difficult to test services
          'src/services/icon.service.js',
          'src/services/markdown.service.js' 
        ]
      },
      customLaunchers: {
        ChromeHeadlessNoSandbox: {
          base: "ChromeHeadless",
          chromeDataDir: path.resolve(__dirname, '.chrome')
        }
      },
      coverageIstanbulReporter: {
        thresholds: {
          global: {
            branches: 70,
            functions: 75
          }
        }
      }
      // you can overwrite/extend the config further
    })
  );
  return config;
};
