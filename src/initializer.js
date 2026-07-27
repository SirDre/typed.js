import defaults from './defaults.js';
/**
 * Initialize the Typed object
 */

export default class Initializer {
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

export let initializer = new Initializer();
