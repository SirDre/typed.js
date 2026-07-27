#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const root = path.resolve(__dirname, '..');
const srcDir = path.join(root, 'src');
const outFile = path.join(root, 'assets', 'demos.js');

const moduleOrder = ['defaults.js', 'html-parser.js', 'initializer.js', 'typed.js'];

function readSource(fileName) {
  return fs.readFileSync(path.join(srcDir, fileName), 'utf8');
}

function transformModule(fileName, code) {
  let output = code;

  // Strip ESM imports because this bundle is an IIFE.
  output = output.replace(/^import\s+[^;]+;\n?/gm, '');

  // Convert export default class declarations to regular classes.
  output = output.replace(/export\s+default\s+class\s+/g, 'class ');

  // Remove default exports and keep module-local symbols.
  output = output.replace(/^export\s+default\s+defaults;\n?/gm, '');

  if (fileName === 'initializer.js') {
    output = output.replace(
      /^export\s+let\s+initializer\s*=\s*new\s+Initializer\(\);\n?/gm,
      'const initializer = new Initializer();\n'
    );
  }

  if (fileName === 'html-parser.js') {
    output = output.replace(
      /^export\s+let\s+htmlParser\s*=\s*new\s+HTMLParser\(\);\n?/gm,
      'const htmlParser = new HTMLParser();\n'
    );
  }

  return output.trim();
}

function buildDemoBootstrap() {
  return `
(function bootstrapDemo() {
  function onReady(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn);
    } else {
      fn();
    }
  }

  onReady(function initDemoPage() {
    if (!document.querySelector('#typed')) {
      return;
    }

    function prettyLog(message) {
      if (window.console && window.console.log) {
        window.console.log('[Glitch demo]', message);
      }
    }

    const typed = new Typed('#typed', {
      stringsElement: '#typed-strings',
      typeSpeed: 40,
      backSpeed: 22,
      backDelay: 800,
      startDelay: 300,
      loop: false,
      onBegin: function (self) { prettyLog('onBegin ' + self); },
      onComplete: function (self) { prettyLog('onComplete ' + self); },
      preStringTyped: function (pos, self) { prettyLog('preStringTyped ' + pos + ' ' + self); },
      onStringTyped: function (pos, self) { prettyLog('onStringTyped ' + pos + ' ' + self); },
      onLastStringBackspaced: function (self) { prettyLog('onLastStringBackspaced ' + self); },
      onTypingPaused: function (pos, self) { prettyLog('onTypingPaused ' + pos + ' ' + self); },
      onTypingResumed: function (pos, self) { prettyLog('onTypingResumed ' + pos + ' ' + self); },
      onReset: function (self) { prettyLog('onReset ' + self); },
      onStop: function (pos, self) { prettyLog('onStop ' + pos + ' ' + self); },
      onStart: function (pos, self) { prettyLog('onStart ' + pos + ' ' + self); },
      onDestroy: function (self) { prettyLog('onDestroy ' + self); }
    });

    const typed2 = new Typed('#typed2', {
      strings: ['Some <i>strings</i> with', 'Some <strong>HTML</strong>', 'Chars &times; &copy;'],
      typeSpeed: 34,
      backSpeed: 18,
      fadeOut: true,
      loop: true
    });

    new Typed('#typed-glitch', {
      strings: [
        'SYSTEM BREACH DETECTED',
        'RE-RUNNING INTEGRITY CHECKS',
        'PATCH COMPLETE // RETURNING TO STABLE'
      ],
      typeSpeed: 34,
      backSpeed: 16,
      backDelay: 1400,
      loop: true,
      contentType: 'null'
    });

    new Typed('#typed3', {
      strings: [
        'My strings are: <i>strings</i> with',
        'My strings are: <strong>HTML</strong>',
        'My strings are: Chars &times; &copy;'
      ],
      typeSpeed: 32,
      backSpeed: 18,
      smartBackspace: true,
      loop: true
    });

    new Typed('#typed4', {
      strings: ['Some strings without', 'Some HTML', 'Chars'],
      typeSpeed: 32,
      backSpeed: 18,
      attr: 'placeholder',
      bindInputFocusEvents: true,
      loop: true
    });

    new Typed('#typed5', {
      strings: [
        '1 Some <i>strings</i> with',
        '2 Some <strong>HTML</strong>',
        '3 Chars &times; &copy;'
      ],
      typeSpeed: 30,
      backSpeed: 16,
      cursorChar: '_',
      shuffle: true,
      smartBackspace: false,
      loop: true
    });

    new Typed('#typed6', {
      strings: ['npm install^1000\\n \`installing components...\` ^1000\\n \`Fetching from source...\`'],
      typeSpeed: 40,
      backSpeed: 0,
      loop: true
    });

    const toggleButton = document.querySelector('.toggle');
    const startButton = document.querySelector('.start');
    const stopButton = document.querySelector('.stop');
    const resetButton = document.querySelector('.reset');
    const destroyButton = document.querySelector('.destroy');
    const loopButton = document.querySelector('.loop');
    const loop2Button = document.querySelector('.loop2');

    if (toggleButton) {
      toggleButton.addEventListener('click', function () {
        typed.toggle();
      });
    }

    if (startButton) {
      startButton.addEventListener('click', function () {
        typed.start();
      });
    }

    if (stopButton) {
      stopButton.addEventListener('click', function () {
        typed.stop();
      });
    }

    if (resetButton) {
      resetButton.addEventListener('click', function () {
        typed.reset();
      });
    }

    if (destroyButton) {
      destroyButton.addEventListener('click', function () {
        typed.destroy();
      });
    }

    if (loopButton) {
      loopButton.addEventListener('click', function () {
        typed.loop = !typed.loop;
      });
    }

    if (loop2Button) {
      loop2Button.addEventListener('click', function () {
        typed2.loop = !typed2.loop;
      });
    }
  });
})();
`.trim();
}

function buildBundle() {
  const transformedModules = moduleOrder
    .map((fileName) => transformModule(fileName, readSource(fileName)))
    .join('\n\n');

  const demoBootstrap = buildDemoBootstrap();

  return `/* Auto-generated by scripts/install-src-demo.js. Do not edit this file directly. */
(function (global) {
  'use strict';

${transformedModules}

  global.Typed = Typed;
  global.Glitch = Typed;

${demoBootstrap}
})(typeof window !== 'undefined' ? window : this);
`;
}

function install() {
  const bundle = buildBundle();
  fs.writeFileSync(outFile, bundle, 'utf8');
  console.log(`Built ${path.relative(root, outFile)} from src modules.`);
}

install();
