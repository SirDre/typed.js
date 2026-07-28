/*!
 * typed.js v3.0.0 | (c) 2026 Matt Boldt | GPL-3.0
 * https://github.com/mattboldt/typed.js
 */
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

/**
 * Defaults & options
 * @returns {object} Typed defaults & options
 * @public
 */

const defaults = {
  /**
   * @property {array} strings strings to be typed
   * @property {string} stringsElement ID of element containing string children
   */
  strings: [
    'These are the default values...',
    'You know what you should do?',
    'Use your own!',
    'Have a great day!'
  ],
  stringsElement: null,

  /**
   * @property {number} typeSpeed type speed in milliseconds
   */
  typeSpeed: 0,

  /**
   * @property {number} startDelay time before typing starts in milliseconds
   */
  startDelay: 0,

  /**
   * @property {number} backSpeed backspacing speed in milliseconds
   */
  backSpeed: 0,

  /**
   * @property {boolean} smartBackspace only backspace what doesn't match the previous string
   */
  smartBackspace: true,

  /**
   * @property {boolean} shuffle shuffle the strings
   */
  shuffle: false,

  /**
   * @property {number} backDelay time before backspacing in milliseconds
   */
  backDelay: 700,

  /**
   * @property {boolean} fadeOut Fade out instead of backspace
   * @property {string} fadeOutClass css class for fade animation
   * @property {boolean} fadeOutDelay Fade out delay in milliseconds
   */
  fadeOut: false,
  fadeOutClass: 'glitched-fade-out',
  fadeOutDelay: 500,

  /**
   * @property {boolean} glitch enable glitch effect while typing plain text
   * @property {string} glitchClass css class for completed glitch animation
   * @property {string} glitchRandomChars character set used for random glitch frames
   */
  glitch: true,
  glitchClass: 'glitch',
  glitchRandomChars:
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*(){}[]<>.,;:',

  /**
   * @property {boolean} loop loop strings
   * @property {number} loopCount amount of loops
   */
  loop: false,
  loopCount: Infinity,

  /**
   * @property {boolean} showCursor show cursor
   * @property {string} cursorChar character for cursor
   * @property {boolean} autoInsertCss insert CSS for cursor and fadeOut into HTML <head>
   */
  showCursor: true,
  cursorChar: '|',
  cursorClass: 'glitched-cursor',
  autoInsertCss: true,

  /**
   * @property {string} attr attribute for typing
   * Ex: input placeholder, value, or just HTML text
   */
  attr: null,

  /**
   * @property {boolean} bindInputFocusEvents bind to focus and blur if el is text input
   */
  bindInputFocusEvents: false,

  /**
   * @property {string} contentType 'html' or 'null' for plaintext
   */
  contentType: 'html',

  /**
   * Before it begins typing
   * @param {Typed} self
   */
  onBegin: (self) => {},

  /**
   * All typing is complete
   * @param {Typed} self
   */
  onComplete: (self) => {},

  /**
   * Before each string is typed
   * @param {number} arrayPos
   * @param {Typed} self
   */
  preStringTyped: (arrayPos, self) => {},

  /**
   * After each string is typed
   * @param {number} arrayPos
   * @param {Typed} self
   */
  onStringTyped: (arrayPos, self) => {},

  /**
   * During looping, after last string is typed
   * @param {Typed} self
   */
  onLastStringBackspaced: (self) => {},

  /**
   * Typing has been stopped
   * @param {number} arrayPos
   * @param {Typed} self
   */
  onTypingPaused: (arrayPos, self) => {},

  /**
   * Typing has been started after being stopped
   * @param {number} arrayPos
   * @param {Typed} self
   */
  onTypingResumed: (arrayPos, self) => {},

  /**
   * After reset
   * @param {Typed} self
   */
  onReset: (self) => {},

  /**
   * After stop
   * @param {number} arrayPos
   * @param {Typed} self
   */
  onStop: (arrayPos, self) => {},

  /**
   * After start
   * @param {number} arrayPos
   * @param {Typed} self
   */
  onStart: (arrayPos, self) => {},

  /**
   * After destroy
   * @param {Typed} self
   */
  onDestroy: (self) => {}
};

/**
 * TODO: These methods can probably be combined somehow
 * Parse HTML tags & HTML Characters
 */

class HTMLParser {
  /**
   * Type HTML tags & HTML Characters
   * @param {string} curString Current string
   * @param {number} curStrPos Position in current string
   * @param {Typed} self instance of Typed
   * @returns {number} a new string position
   * @private
   */

  typeHtmlChars(curString, curStrPos, self) {
    if (self.contentType !== 'html') return curStrPos;
    const curChar = curString.substr(curStrPos).charAt(0);
    if (curChar === '<' || curChar === '&') {
      let endTag = '';
      if (curChar === '<') {
        endTag = '>';
      } else {
        endTag = ';';
      }
      while (curString.substr(curStrPos + 1).charAt(0) !== endTag) {
        curStrPos++;
        if (curStrPos + 1 > curString.length) {
          break;
        }
      }
      curStrPos++;
    }
    return curStrPos;
  }

  /**
   * Backspace HTML tags and HTML Characters
   * @param {string} curString Current string
   * @param {number} curStrPos Position in current string
   * @param {Typed} self instance of Typed
   * @returns {number} a new string position
   * @private
   */
  backSpaceHtmlChars(curString, curStrPos, self) {
    if (self.contentType !== 'html') return curStrPos;
    const curChar = curString.substr(curStrPos).charAt(0);
    if (curChar === '>' || curChar === ';') {
      let endTag = '';
      if (curChar === '>') {
        endTag = '<';
      } else {
        endTag = '&';
      }
      while (curString.substr(curStrPos - 1).charAt(0) !== endTag) {
        curStrPos--;
        if (curStrPos < 0) {
          break;
        }
      }
      curStrPos--;
    }
    return curStrPos;
  }
}

const htmlParser = new HTMLParser();

/**
 * Initialize the Typed object
 */

class Initializer {
  /**
   * Load up defaults & options on the Typed instance
   * @param {Typed} self instance of Typed
   * @param {object} options options object
   * @param {string} elementId HTML element ID _OR_ instance of HTML element
   * @private
   */

  load(self, options, elementId) {
    // chosen element to manipulate text
    if (typeof elementId === 'string') {
      self.el = document.querySelector(elementId);
    } else {
      self.el = elementId;
    }

    self.options = { ...defaults, ...options };

    // attribute to type into
    self.isInput = self.el.tagName.toLowerCase() === 'input';
    self.attr = self.options.attr;
    self.bindInputFocusEvents = self.options.bindInputFocusEvents;

    // show cursor
    self.showCursor = self.isInput ? false : self.options.showCursor;

    // custom cursor
    self.cursorChar = self.options.cursorChar;
    self.cursorClass = self.options.cursorClass;
    self.cursorBlinkClass = `${self.cursorClass}--blink`;

    // glitch effect config
    self.glitch = self.options.glitch;
    self.glitchClass = self.options.glitchClass;
    self.glitchRandomChars = self.options.glitchRandomChars;

    // Is the cursor blinking
    self.cursorBlinking = true;

    // text content of element
    self.elContent = self.attr
      ? self.el.getAttribute(self.attr)
      : self.el.textContent;

    // html or plain text
    self.contentType = self.options.contentType;

    // typing speed
    self.typeSpeed = self.options.typeSpeed;

    // add a delay before typing starts
    self.startDelay = self.options.startDelay;

    // backspacing speed
    self.backSpeed = self.options.backSpeed;

    // only backspace what doesn't match the previous string
    self.smartBackspace = self.options.smartBackspace;

    // amount of time to wait before backspacing
    self.backDelay = self.options.backDelay;

    // Fade out instead of backspace
    self.fadeOut = self.options.fadeOut;
    self.fadeOutClass = self.options.fadeOutClass;
    self.fadeOutDelay = self.options.fadeOutDelay;

    // variable to check whether typing is currently paused
    self.isPaused = false;

    // input strings of text
    self.strings = self.options.strings.map((s) => s.trim());

    // div containing strings
    if (typeof self.options.stringsElement === 'string') {
      self.stringsElement = document.querySelector(self.options.stringsElement);
    } else {
      self.stringsElement = self.options.stringsElement;
    }

    if (self.stringsElement) {
      self.strings = [];
      self.stringsElement.style.display = 'none';
      const strings = Array.prototype.slice.apply(self.stringsElement.children);
      const stringsLength = strings.length;

      if (stringsLength) {
        for (let i = 0; i < stringsLength; i += 1) {
          const stringEl = strings[i];
          self.strings.push(stringEl.innerHTML.trim());
        }
      }
    }

    // character number position of current string
    self.strPos = 0;

    // current array position
    self.arrayPos = 0;

    // index of string to stop backspacing on
    self.stopNum = 0;

    // Looping logic
    self.loop = self.options.loop;
    self.loopCount = self.options.loopCount;
    self.curLoop = 0;

    // shuffle the strings
    self.shuffle = self.options.shuffle;
    // the order of strings
    self.sequence = [];

    self.pause = {
      status: false,
      typewrite: true,
      curString: '',
      curStrPos: 0
    };

    // When the typing is complete (when not looped)
    self.typingComplete = false;

    // Set the order in which the strings are typed
    for (let i in self.strings) {
      self.sequence[i] = i;
    }

    // If there is some text in the element
    self.currentElContent = this.getCurrentElContent(self);

    self.autoInsertCss = self.options.autoInsertCss;

    this.appendAnimationCss(self);
  }

  getCurrentElContent(self) {
    let elContent = '';
    if (self.attr) {
      elContent = self.el.getAttribute(self.attr);
    } else if (self.isInput) {
      elContent = self.el.value;
    } else if (self.contentType === 'html') {
      elContent = self.el.innerHTML;
    } else {
      elContent = self.el.textContent;
    }
    return elContent;
  }

  appendAnimationCss(self) {
    const cssDataName = 'data-typed-js-css';
    if (!self.autoInsertCss) {
      return;
    }
    if (!self.showCursor && !self.fadeOut && !self.glitch) {
      return;
    }
    if (document.querySelector(`[${cssDataName}]`)) {
      return;
    }

    let css = document.createElement('style');
    css.type = 'text/css';
    css.setAttribute(cssDataName, true);

    let innerCss = '';
    if (self.showCursor) {
      innerCss += `
        .${self.cursorClass}{
          opacity: 1;
        }
        .${self.cursorClass}.${self.cursorBlinkClass}{
          animation: typedjsBlink 0.7s infinite;
          -webkit-animation: typedjsBlink 0.7s infinite;
                  animation: typedjsBlink 0.7s infinite;
        }
        @keyframes typedjsBlink{
          50% { opacity: 0.0; }
        }
        @-webkit-keyframes typedjsBlink{
          0% { opacity: 1; }
          50% { opacity: 0.0; }
          100% { opacity: 1; }
        }
      `;
    }
    if (self.fadeOut) {
      innerCss += `
        .${self.fadeOutClass}{
          opacity: 0;
          transition: opacity .25s;
        }
        .${self.cursorClass}.${self.cursorBlinkClass}.${self.fadeOutClass}{
          -webkit-animation: 0;
          animation: 0;
        }
      `;
    }
    if (self.glitch) {
      innerCss += `
        .${self.glitchClass} {
          position: relative;
          animation: 1s linear infinite alternate-reverse glitch-skew;
        }

        .${self.glitchClass}::before,
        .${self.glitchClass}::after {
          content: attr(data-text);
          position: absolute;
          top: 0;
          width: 100%;
          height: 100%;
        }

        .${self.glitchClass}::before {
          left: 2px;
          text-shadow: -2px 0 #ff0015;
          clip: rect(44px, 450px, 56px, 0);
          animation: 5s linear infinite alternate-reverse glitch-anim;
        }

        .${self.glitchClass}::after {
          left: -2px;
          text-shadow: -2px 0 #00fff2, 2px 2px #ff0015;
          animation: 1s linear infinite alternate-reverse glitch-anim2;
        }

        @keyframes glitch-anim {
          0% { clip: rect(10px, 9999px, 30px, 0); transform: skew(0.5deg); }
          5% { clip: rect(92px, 9999px, 93px, 0); transform: skew(0.8deg); }
          10% { clip: rect(68px, 9999px, 34px, 0); transform: skew(0.1deg); }
          15% { clip: rect(22px, 9999px, 10px, 0); transform: skew(0.6deg); }
          20% { clip: rect(56px, 9999px, 98px, 0); transform: skew(0.4deg); }
          25% { clip: rect(3px, 9999px, 23px, 0); transform: skew(0.7deg); }
          30% { clip: rect(48px, 9999px, 23px, 0); transform: skew(0.2deg); }
          35% { clip: rect(54px, 9999px, 86px, 0); transform: skew(0.9deg); }
          40% { clip: rect(10px, 9999px, 12px, 0); transform: skew(0.3deg); }
          45% { clip: rect(43px, 9999px, 59px, 0); transform: skew(0.5deg); }
          50% { clip: rect(35px, 9999px, 58px, 0); transform: skew(0.7deg); }
          55% { clip: rect(21px, 9999px, 73px, 0); transform: skew(0.1deg); }
          60% { clip: rect(90px, 9999px, 76px, 0); transform: skew(0.6deg); }
          65% { clip: rect(6px, 9999px, 53px, 0); transform: skew(0.4deg); }
          70% { clip: rect(57px, 9999px, 95px, 0); transform: skew(0.8deg); }
          75% { clip: rect(20px, 9999px, 78px, 0); transform: skew(0.2deg); }
          80% { clip: rect(82px, 9999px, 24px, 0); transform: skew(0.9deg); }
          85% { clip: rect(62px, 9999px, 53px, 0); transform: skew(0.3deg); }
          90% { clip: rect(39px, 9999px, 63px, 0); transform: skew(0.5deg); }
          95% { clip: rect(56px, 9999px, 17px, 0); transform: skew(0.7deg); }
          100% { clip: rect(5px, 9999px, 53px, 0); transform: skew(0.1deg); }
        }

        @keyframes glitch-anim2 {
          0% { clip: rect(65px, 9999px, 33px, 0); }
          15% { clip: rect(87px, 9999px, 74px, 0); }
          30% { clip: rect(18px, 9999px, 36px, 0); }
          45% { clip: rect(25px, 9999px, 6px, 0); }
          60% { clip: rect(73px, 9999px, 55px, 0); }
          75% { clip: rect(56px, 9999px, 88px, 0); }
          90% { clip: rect(43px, 9999px, 15px, 0); }
          100% { clip: rect(78px, 9999px, 30px, 0); }
        }

        @keyframes glitch-skew {
          0%, 40% { transform: skew(-2deg); }
          10%, 50%, 100% { transform: skew(-1deg); }
          20%, 90% { transform: skew(3deg); }
          30%, 80% { transform: skew(1deg); }
          60% { transform: skew(2deg); }
          70% { transform: skew(-3deg); }
        }
      `;
    }
    if (innerCss.length === 0) {
      return;
    }
    css.innerHTML = innerCss;
    document.body.appendChild(css);
  }
}

const initializer = new Initializer();

/**
 * Welcome to Typed.js!
 * @param {string} elementId HTML element ID _OR_ HTML element
 * @param {object} options options object
 * @returns {object} a new Typed object
 */
class Typed {
  constructor(elementId, options) {
    // Initialize it up
    initializer.load(this, options, elementId);
    // All systems go!
    this.begin();
  }

  /**
   * Toggle start() and stop() of the Typed instance
   * @public
   */
  toggle() {
    this.pause.status ? this.start() : this.stop();
  }

  /**
   * Stop typing / backspacing and enable cursor blinking
   * @public
   */
  stop() {
    if (this.typingComplete) return;
    if (this.pause.status) return;
    this.toggleBlinking(true);
    this.pause.status = true;
    this.options.onStop(this.arrayPos, this);
  }

  /**
   * Start typing / backspacing after being stopped
   * @public
   */
  start() {
    if (this.typingComplete) return;
    if (!this.pause.status) return;
    this.pause.status = false;
    if (this.pause.typewrite) {
      this.typewrite(this.pause.curString, this.pause.curStrPos);
    } else {
      this.backspace(this.pause.curString, this.pause.curStrPos);
    }
    this.options.onStart(this.arrayPos, this);
  }

  /**
   * Destroy this instance of Typed
   * @public
   */
  destroy() {
    this.reset(false);
    this.options.onDestroy(this);
  }

  /**
   * Reset Typed and optionally restarts
   * @param {boolean} restart
   * @public
   */
  reset(restart = true) {
    clearInterval(this.timeout);
    this.clearGlitchClass();
    this.replaceText('');
    if (this.cursor && this.cursor.parentNode) {
      this.cursor.parentNode.removeChild(this.cursor);
      this.cursor = null;
    }
    this.strPos = 0;
    this.arrayPos = 0;
    this.curLoop = 0;
    if (restart) {
      this.insertCursor();
      this.options.onReset(this);
      this.begin();
    }
  }

  /**
   * Begins the typing animation
   * @private
   */
  begin() {
    this.options.onBegin(this);
    this.typingComplete = false;
    this.shuffleStringsIfNeeded(this);
    this.insertCursor();
    if (this.bindInputFocusEvents) this.bindFocusEvents();
    this.timeout = setTimeout(() => {
      // Check if there is some text in the element, if yes start by backspacing the default message
      if (!this.currentElContent || this.currentElContent.length === 0) {
        this.typewrite(this.strings[this.sequence[this.arrayPos]], this.strPos);
      } else {
        // Start typing
        this.backspace(this.currentElContent, this.currentElContent.length);
      }
    }, this.startDelay);
  }

  /**
   * Called for each character typed
   * @param {string} curString the current string in the strings array
   * @param {number} curStrPos the current position in the curString
   * @private
   */
  typewrite(curString, curStrPos) {
    if (this.fadeOut && this.el.classList.contains(this.fadeOutClass)) {
      this.el.classList.remove(this.fadeOutClass);
      if (this.cursor) this.cursor.classList.remove(this.fadeOutClass);
    }

    const humanize = this.humanizer(this.typeSpeed);
    let numChars = 1;

    if (this.pause.status === true) {
      this.setPauseStatus(curString, curStrPos, true);
      return;
    }

    // contain typing function in a timeout humanize'd delay
    this.timeout = setTimeout(() => {
      // skip over any HTML chars
      curStrPos = htmlParser.typeHtmlChars(curString, curStrPos, this);

      let pauseTime = 0;
      let substr = curString.substr(curStrPos);
      // check for an escape character before a pause value
      // format: \^\d+ .. eg: ^1000 .. should be able to print the ^ too using ^^
      // single ^ are removed from string
      if (substr.charAt(0) === '^') {
        if (/^\^\d+/.test(substr)) {
          let skip = 1; // skip at least 1
          substr = /\d+/.exec(substr)[0];
          skip += substr.length;
          pauseTime = parseInt(substr);
          this.temporaryPause = true;
          this.options.onTypingPaused(this.arrayPos, this);
          // strip out the escape character and pause value so they're not printed
          curString =
            curString.substring(0, curStrPos) +
            curString.substring(curStrPos + skip);
          this.toggleBlinking(true);
        }
      }

      // check for skip characters formatted as
      // "this is a `string to print NOW` ..."
      if (substr.charAt(0) === '`') {
        while (curString.substr(curStrPos + numChars).charAt(0) !== '`') {
          numChars++;
          if (curStrPos + numChars > curString.length) break;
        }
        // strip out the escape characters and append all the string in between
        const stringBeforeSkip = curString.substring(0, curStrPos);
        const stringSkipped = curString.substring(
          stringBeforeSkip.length + 1,
          curStrPos + numChars
        );
        const stringAfterSkip = curString.substring(curStrPos + numChars + 1);
        curString = stringBeforeSkip + stringSkipped + stringAfterSkip;
        numChars--;
      }

      // timeout for any pause after a character
      this.timeout = setTimeout(() => {
        // Accounts for blinking while paused
        this.toggleBlinking(false);

        // We're done with this sentence!
        if (curStrPos >= curString.length) {
          this.doneTyping(curString, curStrPos);
        } else {
          this.keepTyping(curString, curStrPos, numChars);
        }
        // end of character pause
        if (this.temporaryPause) {
          this.temporaryPause = false;
          this.options.onTypingResumed(this.arrayPos, this);
        }
      }, pauseTime);

      // humanized value for typing
    }, humanize);
  }

  /**
   * Continue to the next string & begin typing
   * @param {string} curString the current string in the strings array
   * @param {number} curStrPos the current position in the curString
   * @private
   */
  keepTyping(curString, curStrPos, numChars) {
    // call before functions if applicable
    if (curStrPos === 0) {
      this.clearGlitchClass();
      this.toggleBlinking(false);
      this.options.preStringTyped(this.arrayPos, this);
    }
    // start typing each new char into existing string
    // curString: arg, this.el.html: original text inside element
    curStrPos += numChars;
    if (this.canRenderGlitchFrame(curString)) {
      this.replaceText(this.renderGlitchFrame(curString, curStrPos));
    } else {
      this.replaceText(curString.substr(0, curStrPos));
    }
    // loop the function
    this.typewrite(curString, curStrPos);
  }

  /**
   * We're done typing the current string
   * @param {string} curString the current string in the strings array
   * @param {number} curStrPos the current position in the curString
   * @private
   */
  doneTyping(curString, curStrPos) {
    this.replaceText(curString);
    this.applyGlitchClass(curString);
    // fires callback function
    this.options.onStringTyped(this.arrayPos, this);
    this.toggleBlinking(true);
    // is this the final string
    if (this.arrayPos === this.strings.length - 1) {
      // callback that occurs on the last typed string
      this.complete();
      // quit if we wont loop back
      if (this.loop === false || this.curLoop === this.loopCount) {
        return;
      }
    }
    this.timeout = setTimeout(() => {
      this.backspace(curString, curStrPos);
    }, this.backDelay);
  }

  /**
   * Backspaces 1 character at a time
   * @param {string} curString the current string in the strings array
   * @param {number} curStrPos the current position in the curString
   * @private
   */
  backspace(curString, curStrPos) {
    if (this.pause.status === true) {
      this.setPauseStatus(curString, curStrPos, false);
      return;
    }
    if (this.fadeOut) return this.initFadeOut();

    this.clearGlitchClass();
    this.toggleBlinking(false);
    const humanize = this.humanizer(this.backSpeed);

    this.timeout = setTimeout(() => {
      curStrPos = htmlParser.backSpaceHtmlChars(curString, curStrPos, this);
      // replace text with base text + typed characters
      const curStringAtPosition = curString.substr(0, curStrPos);
      this.replaceText(curStringAtPosition);

      // if smartBack is enabled
      if (this.smartBackspace) {
        // the remaining part of the current string is equal of the same part of the new string
        let nextString = this.strings[this.arrayPos + 1];
        if (
          nextString &&
          curStringAtPosition === nextString.substr(0, curStrPos)
        ) {
          this.stopNum = curStrPos;
        } else {
          this.stopNum = 0;
        }
      }

      // if the number (id of character in current string) is
      // less than the stop number, keep going
      if (curStrPos > this.stopNum) {
        // subtract characters one by one
        curStrPos--;
        // loop the function
        this.backspace(curString, curStrPos);
      } else if (curStrPos <= this.stopNum) {
        // if the stop number has been reached, increase
        // array position to next string
        this.arrayPos++;
        // When looping, begin at the beginning after backspace complete
        if (this.arrayPos === this.strings.length) {
          this.arrayPos = 0;
          this.options.onLastStringBackspaced();
          this.shuffleStringsIfNeeded();
          this.begin();
        } else {
          this.typewrite(this.strings[this.sequence[this.arrayPos]], curStrPos);
        }
      }
      // humanized value for typing
    }, humanize);
  }

  /**
   * Full animation is complete
   * @private
   */
  complete() {
    this.options.onComplete(this);
    if (this.loop) {
      this.curLoop++;
    } else {
      this.typingComplete = true;
    }
  }

  /**
   * Has the typing been stopped
   * @param {string} curString the current string in the strings array
   * @param {number} curStrPos the current position in the curString
   * @param {boolean} isTyping
   * @private
   */
  setPauseStatus(curString, curStrPos, isTyping) {
    this.pause.typewrite = isTyping;
    this.pause.curString = curString;
    this.pause.curStrPos = curStrPos;
  }

  /**
   * Toggle the blinking cursor
   * @param {boolean} isBlinking
   * @private
   */
  toggleBlinking(isBlinking) {
    if (!this.cursor) return;
    // if in paused state, don't toggle blinking a 2nd time
    if (this.pause.status) return;
    if (this.cursorBlinking === isBlinking) return;
    this.cursorBlinking = isBlinking;
    if (isBlinking) {
      this.cursor.classList.add(this.cursorBlinkClass);
    } else {
      this.cursor.classList.remove(this.cursorBlinkClass);
    }
  }

  canRenderGlitchFrame(curString) {
    return (
      this.glitch &&
      this.contentType !== 'html' &&
      !this.isInput &&
      !this.attr &&
      typeof curString === 'string' &&
      curString.length > 0
    );
  }

  randomGlitchCharacter() {
    if (!this.glitchRandomChars || this.glitchRandomChars.length === 0) {
      return '';
    }
    const index = Math.floor(Math.random() * this.glitchRandomChars.length);
    return this.glitchRandomChars.charAt(index);
  }

  renderGlitchFrame(curString, visibleChars) {
    if (visibleChars >= curString.length) {
      return curString;
    }
    let output = '';
    for (let i = 0; i < curString.length; i += 1) {
      const char = curString.charAt(i);
      if (i < visibleChars || /\s/.test(char)) {
        output += char;
      } else {
        output += this.randomGlitchCharacter();
      }
    }
    return output;
  }

  applyGlitchClass(text) {
    if (!this.glitch || this.contentType === 'html' || this.isInput || this.attr) {
      return;
    }
    this.el.classList.add(this.glitchClass);
    this.el.setAttribute('data-text', text);
  }

  clearGlitchClass() {
    if (!this.el || !this.glitchClass || !this.el.classList) {
      return;
    }
    this.el.classList.remove(this.glitchClass);
    this.el.removeAttribute('data-text');
  }

  /**
   * Speed in MS to type
   * @param {number} speed
   * @private
   */
  humanizer(speed) {
    return Math.round((Math.random() * speed) / 2) + speed;
  }

  /**
   * Shuffle the sequence of the strings array
   * @private
   */
  shuffleStringsIfNeeded() {
    if (!this.shuffle) return;
    this.sequence = this.sequence.sort(() => Math.random() - 0.5);
  }

  /**
   * Adds a CSS class to fade out current string
   * @private
   */
  initFadeOut() {
    this.el.className += ` ${this.fadeOutClass}`;
    if (this.cursor) this.cursor.className += ` ${this.fadeOutClass}`;
    return setTimeout(() => {
      this.arrayPos++;
      this.replaceText('');

      // Resets current string if end of loop reached
      if (this.strings.length > this.arrayPos) {
        this.typewrite(this.strings[this.sequence[this.arrayPos]], 0);
      } else {
        this.typewrite(this.strings[0], 0);
        this.arrayPos = 0;
      }
    }, this.fadeOutDelay);
  }

  /**
   * Replaces current text in the HTML element
   * depending on element type
   * @param {string} str
   * @private
   */
  replaceText(str) {
    if (this.attr) {
      this.el.setAttribute(this.attr, str);
    } else {
      if (this.isInput) {
        this.el.value = str;
      } else if (this.contentType === 'html') {
        this.el.innerHTML = str;
      } else {
        this.el.textContent = str;
      }
    }
  }

  /**
   * If using input elements, bind focus in order to
   * start and stop the animation
   * @private
   */
  bindFocusEvents() {
    if (!this.isInput) return;
    this.el.addEventListener('focus', (e) => {
      this.stop();
    });
    this.el.addEventListener('blur', (e) => {
      if (this.el.value && this.el.value.length !== 0) {
        return;
      }
      this.start();
    });
  }

  /**
   * On init, insert the cursor element
   * @private
   */
  insertCursor() {
    if (!this.showCursor) return;
    if (this.cursor) return;
    this.cursor = document.createElement('span');
    this.cursor.className = this.cursorClass;
    this.cursor.setAttribute('aria-hidden', true);
    this.cursor.innerHTML = this.cursorChar;
    this.el.parentNode &&
      this.el.parentNode.insertBefore(this.cursor, this.el.nextSibling);
  }
}

  return Typed;
});
