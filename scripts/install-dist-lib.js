#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const root = path.resolve(__dirname, '..');
const srcDir = path.join(root, 'src');
const distDir = path.join(root, 'dist');
const libDir = path.join(root, 'lib');

const packageJson = JSON.parse(
  fs.readFileSync(path.join(root, 'package.json'), 'utf8')
);

const moduleOrder = ['defaults.js', 'html-parser.js', 'initializer.js', 'typed.js'];

function readSource(fileName) {
  return fs.readFileSync(path.join(srcDir, fileName), 'utf8');
}

function transformModule(fileName, code) {
  let output = code;

  // Strip ESM imports because this bundle is wrapped as UMD.
  output = output.replace(/^import\s+[^;]+;\n?/gm, '');

  // Convert export default class declarations to regular classes.
  output = output.replace(/export\s+default\s+class\s+/g, 'class ');

  // Remove default exports and keep module-local symbols.
  output = output.replace(/^export\s+default\s+defaults;\n?/gm, '');
  output = output.replace(/^export\s+default\s+Typed;\n?/gm, '');

  if (fileName === 'initializer.js') {
    output = output.replace(
      /^export\s+default\s+class\s+Initializer\s*/m,
      'class Initializer '
    );
    output = output.replace(
      /^export\s+let\s+initializer\s*=\s*new\s+Initializer\(\);\n?/gm,
      'const initializer = new Initializer();\n'
    );
  }

  if (fileName === 'html-parser.js') {
    output = output.replace(
      /^export\s+default\s+class\s+HTMLParser\s*/m,
      'class HTMLParser '
    );
    output = output.replace(
      /^export\s+let\s+htmlParser\s*=\s*new\s+HTMLParser\(\);\n?/gm,
      'const htmlParser = new HTMLParser();\n'
    );
  }

  return output.trim();
}

function createBanner() {
  const year = new Date().getFullYear();
  return `/*!\n * typed.js v${packageJson.version} | (c) ${year} Matt Boldt | GPL-3.0\n * https://github.com/mattboldt/typed.js\n */`;
}

function buildReadableUmd() {
  const transformedModules = moduleOrder
    .map((fileName) => transformModule(fileName, readSource(fileName)))
    .join('\n\n');

  return `${createBanner()}
(function (root, factory) {
  if (typeof exports === 'object' && typeof module === 'object') {
    module.exports = factory();
  } else if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof exports === 'object') {
    exports.Typed = factory();
  } else {
    root.Typed = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

${transformedModules}

  return Typed;
});
`;
}

function buildMinifiedUmd() {
  const umdPath = path.join(distDir, 'typed.umd.js');
  if (!fs.existsSync(umdPath)) {
    throw new Error('Missing dist/typed.umd.js. Run `npm run build` first.');
  }

  const umd = fs.readFileSync(umdPath, 'utf8');

  // Keep the minified payload from dist but remap source map path for lib.
  const minBody = umd
    .replace(/\n?\/\/# sourceMappingURL=.*$/m, '')
    .trim();

  return `${createBanner()}\n${minBody}\n//# sourceMappingURL=typed.min.js.map\n`;
}

function writeMinifiedSourceMap() {
  const distMapPath = path.join(distDir, 'typed.umd.js.map');
  const libMapPath = path.join(libDir, 'typed.min.js.map');

  if (!fs.existsSync(distMapPath)) {
    throw new Error('Missing dist/typed.umd.js.map. Run `npm run build` first.');
  }

  const map = JSON.parse(fs.readFileSync(distMapPath, 'utf8'));
  map.file = 'typed.min.js';
  fs.writeFileSync(libMapPath, JSON.stringify(map), 'utf8');
}

function install() {
  if (!fs.existsSync(libDir)) {
    fs.mkdirSync(libDir, { recursive: true });
  }

  const readable = buildReadableUmd();
  const minified = buildMinifiedUmd();

  fs.writeFileSync(path.join(libDir, 'typed.js'), readable, 'utf8');
  fs.writeFileSync(path.join(libDir, 'typed.min.js'), minified, 'utf8');
  writeMinifiedSourceMap();

  console.log('Built lib/typed.js, lib/typed.min.js, and lib/typed.min.js.map');
}

install();
