// rollup.config.mjs
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import terser from "@rollup/plugin-terser";

const plugins = [
  resolve({ browser: true }),
  commonjs(),
  terser(),
];

export default [
  // CORE
  {
    input: "src/core.js",
    output: {
      file: "dist/rs-core.min.js",
      format: "iife",
      sourcemap: true,
    },
    plugins,
  },

  // MODULE: MODAL (requires core included first)
  {
    input: "src/modules/modal.js",
    output: {
      file: "dist/modules/rs-modal.min.js",
      format: "iife",
      sourcemap: true,
    },
    plugins,
  },
  // MODULE: ACCODRION (requires core included first)

  {
    input: "src/modules/accordion.js",
    output: {
      file: "dist/modules/rs-accordion.min.js",
      format: "iife",
      sourcemap: true,
    },
    plugins,
  },


  // TOOLKIT (core + all modules)
  {
    input: "src/toolkit.js",
    output: {
      file: "dist/rs-toolkit.min.js",
      format: "iife",
      sourcemap: true,
    },
    plugins,
  },
];
