const pluginCommonjs = require('@rollup/plugin-commonjs');
const pluginBabel = require('rollup-plugin-babel');
const { terser } = require('rollup-plugin-terser');

module.exports = {
  input: './src/index.js',
  output: [
    {
      format: "esm",
      file: "./lib/dl-store.esm.js"
    },
    {
      format: "esm",
      file: "./lib/dl-store.esm.min.js",
      plugins: [
        terser({
          compress: {
            drop_console: true
          }
        })
      ]
    },
    {
      format: "cjs",
      exports: 'default',
      file: "./lib/dl-store.cjs.js"
    },
    {
      format: "cjs",
      exports: 'default',
      file: "./lib/dl-store.cjs.min.js",
      plugins: [
        terser({
          compress: {
            drop_console: true
          }
        })
      ]
    },
    {
      format: "iife",
      extend: true,
      file: "./lib/dl-store.iife.js",
      name: "DlStore"
    },
    {
      format: "iife",
      extend: true,
      file: "./lib/dl-store.iife.min.js",
      name: "DlStore",
      plugins: [
        terser({
          compress: {
            drop_console: true
          }
        })
      ]
    }
  ],
  plugins: [
    pluginCommonjs(),
    pluginBabel({
      exclude: 'node_modules/**'
    })
  ]
}
