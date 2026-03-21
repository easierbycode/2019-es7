// src/ps2/timer.js — Delayed call / timer system for PS2 AthenaEnv
// Replaces Phaser scene.time.delayedCall() and scene.time.addEvent()

var timers = [];
var timerIdCounter = 0;

function delayedCall(delayMs, callback) {
    var id = timerIdCounter++;
    timers.push({
        id: id,
        delay: delayMs,
        elapsed: 0,
        callback: callback,
        repeat: 0,
        repeatCount: 0,
        interval: 0,
        active: 1,
    });
    return id;
}

function addTimerEvent(delayMs, repeatCount, callback) {
    var id = timerIdCounter++;
    timers.push({
        id: id,
        delay: delayMs,
        elapsed: 0,
        callback: callback,
        repeat: repeatCount,
        repeatCount: 0,
        interval: delayMs,
        active: 1,
    });
    return id;
}

function addLoopTimer(delayMs, callback) {
    return addTimerEvent(delayMs, -1, callback);
}

function removeTimer(id) {
    for (var i = 0; i < timers.length; i++) {
        if (timers[i].id === id) {
            timers[i].active = 0;
            break;
        }
    }
}

function updateTimers(dt) {
    for (var i = timers.length - 1; i >= 0; i--) {
        var t = timers[i];
        if (!t.active) {
            timers.splice(i, 1);
            continue;
        }

        t.elapsed += dt;
        if (t.elapsed >= t.delay) {
            t.callback();
            t.repeatCount++;

            if (t.repeat === 0) {
                // One-shot
                t.active = 0;
                timers.splice(i, 1);
            } else if (t.repeat === -1 || t.repeatCount <= t.repeat) {
                // Repeating
                t.elapsed -= t.delay;
            } else {
                // Done repeating
                t.active = 0;
                timers.splice(i, 1);
            }
        }
    }
}

function clearAllTimers() {
    timers.length = 0;
}
