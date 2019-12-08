(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
module.exports = function(options) {
  return function(deck) {
    var activeSlideIndex,
      activeBulletIndex,

      bullets = deck.slides.map(function(slide) {
        return [].slice.call(slide.querySelectorAll((typeof options === 'string' ? options : '[data-bespoke-bullet]')), 0);
      }),

      next = function() {
        var nextSlideIndex = activeSlideIndex + 1;

        if (activeSlideHasBulletByOffset(1)) {
          activateBullet(activeSlideIndex, activeBulletIndex + 1);
          return false;
        } else if (bullets[nextSlideIndex]) {
          activateBullet(nextSlideIndex, 0);
        }
      },

      prev = function() {
        var prevSlideIndex = activeSlideIndex - 1;

        if (activeSlideHasBulletByOffset(-1)) {
          activateBullet(activeSlideIndex, activeBulletIndex - 1);
          return false;
        } else if (bullets[prevSlideIndex]) {
          activateBullet(prevSlideIndex, bullets[prevSlideIndex].length - 1);
        }
      },

      activateBullet = function(slideIndex, bulletIndex) {
        activeSlideIndex = slideIndex;
        activeBulletIndex = bulletIndex;

        bullets.forEach(function(slide, s) {
          slide.forEach(function(bullet, b) {
            bullet.classList.add('bespoke-bullet');

            if (s < slideIndex || s === slideIndex && b <= bulletIndex) {
              bullet.classList.add('bespoke-bullet-active');
              bullet.classList.remove('bespoke-bullet-inactive');
            } else {
              bullet.classList.add('bespoke-bullet-inactive');
              bullet.classList.remove('bespoke-bullet-active');
            }

            if (s === slideIndex && b === bulletIndex) {
              bullet.classList.add('bespoke-bullet-current');
            } else {
              bullet.classList.remove('bespoke-bullet-current');
            }
          });
        });
      },

      activeSlideHasBulletByOffset = function(offset) {
        return bullets[activeSlideIndex][activeBulletIndex + offset] !== undefined;
      };

    deck.on('next', next);
    deck.on('prev', prev);

    deck.on('slide', function(e) {
      activateBullet(e.index, 0);
    });

    activateBullet(0, 0);
  };
};

},{}],2:[function(require,module,exports){
module.exports = function() {
  return function(deck) {
    var addClass = function(el, cls) {
        el.classList.add('bespoke-' + cls);
      },

      removeClass = function(el, cls) {
        el.className = el.className
          .replace(new RegExp('bespoke-' + cls +'(\\s|$)', 'g'), ' ')
          .trim();
      },

      deactivate = function(el, index) {
        var activeSlide = deck.slides[deck.slide()],
          offset = index - deck.slide(),
          offsetClass = offset > 0 ? 'after' : 'before';

        ['before(-\\d+)?', 'after(-\\d+)?', 'active', 'inactive'].map(removeClass.bind(null, el));

        if (el !== activeSlide) {
          ['inactive', offsetClass, offsetClass + '-' + Math.abs(offset)].map(addClass.bind(null, el));
        }
      };

    addClass(deck.parent, 'parent');
    deck.slides.map(function(el) { addClass(el, 'slide'); });

    deck.on('activate', function(e) {
      deck.slides.map(deactivate);
      addClass(e.slide, 'active');
      removeClass(e.slide, 'inactive');
    });
  };
};

},{}],3:[function(require,module,exports){
module.exports = function(opts) {
  return function(deck) {
    opts = opts && (opts.object || opts.name || opts.scope) ? opts : { object: opts };
    var bespoke = opts.object, name = opts.name || 'bespoke', scope = opts.scope || window;
    if (bespoke) scope[name] = bespoke;
    else if (scope[name]) bespoke = scope[name];
    else bespoke = (scope[name] = {});
    (Array.isArray(bespoke.decks) ? bespoke.decks : (bespoke.decks = [])).push(bespoke.deck = deck);
    deck.on('destroy', function() {
      var idx = bespoke.decks.indexOf(deck);
      if (idx >= 0) bespoke.decks.splice(idx, 1);
      delete bespoke.deck;
    });
  };
};

},{}],4:[function(require,module,exports){
module.exports = function() {
  return function(deck) {
    var activateSlide = function(index) {
      var indexToActivate = -1 < index && index < deck.slides.length ? index : 0;
      if (indexToActivate !== deck.slide()) {
        deck.slide(indexToActivate);
      }
    };

    var parseHash = function() {
      var hash = window.location.hash.slice(1),
        slideNumberOrName = parseInt(hash, 10);

      if (hash) {
        if (slideNumberOrName) {
          activateSlide(slideNumberOrName - 1);
        } else {
          deck.slides.forEach(function(slide, i) {
            if (slide.getAttribute('data-bespoke-hash') === hash || slide.id === hash) {
              activateSlide(i);
            }
          });
        }
      }
    };

    setTimeout(function() {
      parseHash();

      deck.on('activate', function(e) {
        var slideName = e.slide.getAttribute('data-bespoke-hash') || e.slide.id;
        window.location.hash = slideName || e.index + 1;
      });

      window.addEventListener('hashchange', parseHash);
    }, 0);
  };
};

},{}],5:[function(require,module,exports){
module.exports = function() {
  return function(deck) {
    var VIMEO_RE = /\/\/player\.vimeo\.com\//, YOUTUBE_RE = /\/\/www\.youtube\.com\/embed\//, CMD = 'command', loc = location.protocol === 'file:',
      apply = function(sel, from, fn, mod) { for (var i = -1, r = from.querySelectorAll(sel+(mod||'')), l = r.length; ++i < l; fn(r[i])) {} },
      post = function(obj, msg) { obj.contentWindow.postMessage(JSON.stringify(msg), '*'); },
      play = function(obj) {
        var rew = obj.hasAttribute('data-rewind'), vol = Math.min(Math.max(parseFloat(obj.getAttribute('data-volume')), 0), 10);
        if (obj.play) {
          if (rew && obj.readyState) obj.currentTime = 0;
          if (vol >= 0) obj.volume = vol/10;
          obj.play();
        }
        else if (YOUTUBE_RE.test(obj.src)) {
          if (rew) post(obj, {event:CMD, func:'seekTo', args:[0]});
          if (vol >= 0) post(obj, {event:CMD, func:'setVolume', args:[vol*10]});
          post(obj, {event:CMD, func:'playVideo'});
        }
        else if (VIMEO_RE.test(obj.src)) {
          if (loc) return console.warn('WARNING: Cannot play Vimeo video when deck is loaded via file://.');
          if (rew) post(obj, {method:'seekTo', value:0});
          if (vol >= 0) post(obj, {method:'setVolume', value:vol/10});
          post(obj, {method:'play'});
        }
      },
      pause = function(obj) {
        if (obj.pause) obj.pause();
        else if (YOUTUBE_RE.test(obj.src)) post(obj, {event:CMD, func:'pauseVideo'});
        else if (!loc && VIMEO_RE.test(obj.src)) post(obj, {method:'pause'});
      },
      reload = function(obj, name) { obj[name||'src'] = obj.getAttribute(name||'src'); },
      svg = function(obj) { try { return obj.contentDocument.rootElement; } catch(e) {} },
      toggle = function(obj, cmd) { (svg(obj)||obj).classList[cmd||'add']('active'); },
      activateSvg = function(obj) {
        if (obj.hasAttribute('data-reload')) reload(obj, 'data');
        else if (svg(obj)) toggle(obj);
        else obj.onload = function() { if (deck.slides[deck.slide()].contains(obj)) toggle(obj); };
      },
      deactivateSvg = function(obj) { toggle(obj, 'remove'); },
      eachMedia = apply.bind(null, 'audio,video,iframe'),
      eachSvg = apply.bind(null, 'object[type="image/svg+xml"]'),
      playMedia = function(slide) { eachMedia(slide, play); },
      pauseMedia = function(slide) { eachMedia(slide, pause); },
      activateSvgs = function(slide) { eachSvg(slide, activateSvg); },
      deactivateSvgs = function(slide) { eachSvg(slide, deactivateSvg, ':not([data-reload])'); },
      activate = function(e) {
        if (e.preview) return pauseMedia(e.slide);
        playMedia(e.slide);
        activateSvgs(e.slide);
        apply('img[data-reload][src$=".gif"]', e.slide, reload);
      },
      deactivate = function(e) {
        pauseMedia(e.slide);
        deactivateSvgs(e.slide);
      };
    deck.on('activate', activate);
    deck.on('deactivate', deactivate);
  };
};

},{}],6:[function(require,module,exports){
module.exports = function() {
  return function(deck) {
    var KEY_SP = 32, KEY_PGUP = 33, KEY_PGDN = 34, KEY_END = 35, KEY_HME = 36,
        KEY_LT = 37, KEY_RT = 39, KEY_H = 72, KEY_L = 76, KD = 'keydown',
      modified = function(e, k) {
        return e.ctrlKey || (e.shiftKey && (k === KEY_HME || k === KEY_END)) || e.altKey || e.metaKey;
      },
      onKey = function(e) {
        if (!modified(e, e.which)) {
          switch(e.which) {
            case KEY_SP: return (e.shiftKey ? deck.prev : deck.next)();
            case KEY_RT: case KEY_PGDN: case KEY_L: return deck.next();
            case KEY_LT: case KEY_PGUP: case KEY_H: return deck.prev();
            case KEY_HME: return deck.slide(0);
            case KEY_END: return deck.slide(deck.slides.length - 1);
          }
        }
      };
    deck.on('destroy', function() { document.removeEventListener(KD, onKey); });
    document.addEventListener(KD, onKey);
  };
};

},{}],7:[function(require,module,exports){
module.exports = function(options) {
  return function(deck) {
    var opts = (options || {}), TS = 'touchstart', TM = 'touchmove', ADD = 'addEventListener', RM = 'removeEventListener',
      src = deck.parent, start = null, delta = null, axis = 'page' + (opts.axis === 'y' ? 'Y' : 'X'),
      gap = typeof opts.threshold === 'number' ? opts.threshold : 50 / window.devicePixelRatio,
      onStart = function(e) { start = e.touches.length === 1 ? e.touches[0][axis] : null; },
      onMove = function(e) {
        if (start === null) return; // not ours
        if (start === undefined) return e.preventDefault(); // action already taken
        if (Math.abs(delta = e.touches[0][axis] - start) > gap) {
          (delta > 0 ? deck.prev : deck.next)();
          start = e.preventDefault(); // mark action taken
        }
      };
    deck.on('destroy', function() { src[RM](TS, onStart); src[RM](TM, onMove); });
    src[ADD](TS, onStart); src[ADD](TM, onMove);
  };
};

},{}],8:[function(require,module,exports){
module.exports = function(opts) {
  opts = opts || {};
  var kbd = require('bespoke-nav-kbd')(opts.kbd);
  var touch = require('bespoke-nav-touch')(opts.touch);
  return function(deck) {
    kbd(deck);
    touch(deck);
  };
};

},{"bespoke-nav-kbd":6,"bespoke-nav-touch":7}],9:[function(require,module,exports){
module.exports = function(options) {
  return function(deck) {
    var parent = deck.parent,
      firstSlide = deck.slides[0],
      slideHeight = firstSlide.offsetHeight,
      slideWidth = firstSlide.offsetWidth,
      useZoom = options === 'zoom' || ('zoom' in parent.style && options !== 'transform'),

      wrap = function(element) {
        var wrapper = document.createElement('div');
        wrapper.className = 'bespoke-scale-parent';
        element.parentNode.insertBefore(wrapper, element);
        wrapper.appendChild(element);
        return wrapper;
      },

      elements = useZoom ? deck.slides : deck.slides.map(wrap),

      transformProperty = (function(property) {
        var prefixes = 'Moz Webkit O ms'.split(' ');
        return prefixes.reduce(function(currentProperty, prefix) {
            return prefix + property in parent.style ? prefix + property : currentProperty;
          }, property.toLowerCase());
      }('Transform')),

      scale = useZoom ?
        function(ratio, element) {
          element.style.zoom = ratio;
        } :
        function(ratio, element) {
          element.style[transformProperty] = 'scale(' + ratio + ')';
        },

      scaleAll = function() {
        var xScale = parent.offsetWidth / slideWidth,
          yScale = parent.offsetHeight / slideHeight;

        elements.forEach(scale.bind(null, Math.min(xScale, yScale)));
      };

    window.addEventListener('resize', scaleAll);
    scaleAll();
  };

};

},{}],10:[function(require,module,exports){
var from = function(opts, plugins) {
  var parent = (opts.parent || opts).nodeType === 1 ? (opts.parent || opts) : document.querySelector(opts.parent || opts),
    slides = [].filter.call(typeof opts.slides === 'string' ? parent.querySelectorAll(opts.slides) : (opts.slides || parent.children), function(el) { return el.nodeName !== 'SCRIPT'; }),
    activeSlide = slides[0],
    listeners = {},

    activate = function(index, customData) {
      if (!slides[index]) {
        return;
      }

      fire('deactivate', createEventData(activeSlide, customData));
      activeSlide = slides[index];
      fire('activate', createEventData(activeSlide, customData));
    },

    slide = function(index, customData) {
      if (arguments.length) {
        fire('slide', createEventData(slides[index], customData)) && activate(index, customData);
      } else {
        return slides.indexOf(activeSlide);
      }
    },

    step = function(offset, customData) {
      var slideIndex = slides.indexOf(activeSlide) + offset;

      fire(offset > 0 ? 'next' : 'prev', createEventData(activeSlide, customData)) && activate(slideIndex, customData);
    },

    on = function(eventName, callback) {
      (listeners[eventName] || (listeners[eventName] = [])).push(callback);
      return off.bind(null, eventName, callback);
    },

    off = function(eventName, callback) {
      listeners[eventName] = (listeners[eventName] || []).filter(function(listener) { return listener !== callback; });
    },

    fire = function(eventName, eventData) {
      return (listeners[eventName] || [])
        .reduce(function(notCancelled, callback) {
          return notCancelled && callback(eventData) !== false;
        }, true);
    },

    createEventData = function(el, eventData) {
      eventData = eventData || {};
      eventData.index = slides.indexOf(el);
      eventData.slide = el;
      return eventData;
    },

    deck = {
      on: on,
      off: off,
      fire: fire,
      slide: slide,
      next: step.bind(null, 1),
      prev: step.bind(null, -1),
      parent: parent,
      slides: slides
    };

  (plugins || []).forEach(function(plugin) {
    plugin(deck);
  });

  activate(0);

  return deck;
};

module.exports = {
  from: from
};

},{}],11:[function(require,module,exports){
// Require Node modules in the browser thanks to Browserify: http://browserify.org
var bespoke = require('bespoke');
var classes = require('bespoke-classes');
var nav = require('bespoke-nav');
var scale = require('bespoke-scale');
var bullets = require('bespoke-bullets');
var hash = require('bespoke-hash');
var multimedia = require('bespoke-multimedia');
var extern = require('bespoke-extern');

// Bespoke.js
bespoke.from({ parent: 'article.deck', slides: 'section' }, [
  classes(),
  nav(),
  scale(),
  bullets('.build, .build-items > *:not(.build-items)'),
  hash(),
  multimedia(),
  extern(bespoke)
]);
/* Toggle between adding and removing the "responsive" class to topnav when the user clicks on the icon */
function myFunction() {
  var x = document.getElementById("myTopnav");
  if (x.className === "topnav") {
    x.className += " responsive";
  } else {
    x.className = "topnav";
  }
} 

},{"bespoke":10,"bespoke-bullets":1,"bespoke-classes":2,"bespoke-extern":3,"bespoke-hash":4,"bespoke-multimedia":5,"bespoke-nav":8,"bespoke-scale":9}]},{},[11]);
