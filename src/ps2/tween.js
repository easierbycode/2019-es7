// src/ps2/tween.js — Simple tween system for PS2 AthenaEnv
// Replaces Phaser tweens with a frame-based interpolation system

var tweens = [];
var tweenIdCounter = 0;

function easeLinear(t) { return t; }
function easeQuintOut(t) { return 1 - Math.pow(1 - t, 5); }
function easeQuintIn(t) { return t * t * t * t * t; }
function easeExpoIn(t) { return t === 0 ? 0 : Math.pow(2, 10 * (t - 1)); }
function easeExpoOut(t) { return t === 1 ? 1 : 1 - Math.pow(2, -10 * t); }
function easeBackOut(t) { var s = 1.70158; return (t -= 1) * t * ((s + 1) * t + s) + 1; }
function easeElasticOut(t) {
    if (t === 0 || t === 1) return t;
    return Math.pow(2, -10 * t) * Math.sin((t - 0.075) * (2 * Math.PI) / 0.3) + 1;
}

var EASE_FUNCS = {
    "Linear": easeLinear,
    "Quint.easeOut": easeQuintOut,
    "Quint.easeIn": easeQuintIn,
    "Expo.easeIn": easeExpoIn,
    "Expo.easeOut": easeExpoOut,
    "Back.easeOut": easeBackOut,
    "Elastic.easeOut": easeElasticOut,
};

function getEase(name) {
    return EASE_FUNCS[name] || easeLinear;
}

// Create a tween
// opts: { target, props: {key: endVal}, duration, delay, ease, yoyo, repeat, onComplete, onUpdate }
function addTween(opts) {
    var id = tweenIdCounter++;
    var tw = {
        id: id,
        target: opts.target,
        props: {},
        duration: opts.duration || 300,
        delay: opts.delay || 0,
        elapsed: 0,
        ease: getEase(opts.ease || "Linear"),
        yoyo: opts.yoyo || 0,
        repeat: opts.repeat || 0,
        repeatCount: 0,
        forward: 1,
        onComplete: opts.onComplete || null,
        onUpdate: opts.onUpdate || null,
        active: 1,
        hold: opts.hold || 0,
        holdElapsed: 0,
    };

    // Store start/end values for each property
    var propKeys = Object.keys(opts.props || {});
    for (var i = 0; i < propKeys.length; i++) {
        var key = propKeys[i];
        tw.props[key] = {
            start: opts.target[key] !== undefined ? opts.target[key] : 0,
            end: opts.props[key],
        };
    }

    tweens.push(tw);
    return id;
}

function updateTweens(dt) {
    for (var i = tweens.length - 1; i >= 0; i--) {
        var tw = tweens[i];
        if (!tw.active) {
            tweens.splice(i, 1);
            continue;
        }

        // Handle delay
        if (tw.delay > 0) {
            tw.delay -= dt;
            if (tw.delay > 0) continue;
            dt = -tw.delay;
            tw.delay = 0;
        }

        tw.elapsed += dt;

        var progress = Math.min(tw.elapsed / tw.duration, 1.0);
        var easedProgress = tw.ease(tw.forward ? progress : 1 - progress);

        // Apply properties
        var propKeys = Object.keys(tw.props);
        for (var p = 0; p < propKeys.length; p++) {
            var key = propKeys[p];
            var prop = tw.props[key];
            tw.target[key] = prop.start + (prop.end - prop.start) * easedProgress;
        }

        if (tw.onUpdate) tw.onUpdate(tw.target, progress);

        if (progress >= 1.0) {
            if (tw.yoyo && tw.forward) {
                // Hold before reversing
                if (tw.hold > 0 && tw.holdElapsed < tw.hold) {
                    tw.holdElapsed += dt;
                    continue;
                }
                tw.forward = 0;
                tw.elapsed = 0;
                tw.holdElapsed = 0;
            } else if (tw.repeat !== 0) {
                tw.repeatCount++;
                if (tw.repeat === -1 || tw.repeatCount <= tw.repeat) {
                    tw.forward = 1;
                    tw.elapsed = 0;
                    tw.holdElapsed = 0;
                } else {
                    tw.active = 0;
                    if (tw.onComplete) tw.onComplete(tw.target);
                }
            } else {
                tw.active = 0;
                if (tw.onComplete) tw.onComplete(tw.target);
            }
        }
    }
}

function killTween(id) {
    for (var i = 0; i < tweens.length; i++) {
        if (tweens[i].id === id) {
            tweens[i].active = 0;
            break;
        }
    }
}

function killAllTweens() {
    tweens.length = 0;
}
