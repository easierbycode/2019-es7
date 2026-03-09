import { gameState } from "./gameState.js";

var HAPTIC_PRESETS = {
    ui: {
        cooldown: 60,
        duration: 12,
        vibration: 10,
        weakMagnitude: 0.2,
        strongMagnitude: 0.08,
        tapticKind: "selection",
        tapticImpact: "light",
    },
    ready: {
        cooldown: 400,
        duration: 18,
        vibration: 16,
        weakMagnitude: 0.32,
        strongMagnitude: 0.12,
        tapticImpact: "light",
    },
    pickup: {
        cooldown: 120,
        duration: 22,
        vibration: 18,
        weakMagnitude: 0.45,
        strongMagnitude: 0.18,
        tapticImpact: "light",
    },
    damage: {
        cooldown: 180,
        duration: 34,
        vibration: 28,
        weakMagnitude: 0.55,
        strongMagnitude: 0.4,
        tapticImpact: "medium",
    },
    warning: {
        cooldown: 800,
        duration: 30,
        vibration: [14, 28, 14],
        weakMagnitude: 0.6,
        strongMagnitude: 0.35,
        tapticNotification: "warning",
        tapticImpact: "medium",
    },
    special: {
        cooldown: 500,
        duration: 44,
        vibration: [18, 24, 40],
        weakMagnitude: 0.9,
        strongMagnitude: 0.85,
        tapticImpact: "heavy",
    },
    bossEnter: {
        cooldown: 1200,
        duration: 40,
        vibration: 36,
        weakMagnitude: 0.8,
        strongMagnitude: 0.65,
        tapticImpact: "heavy",
    },
    bossDefeat: {
        cooldown: 1500,
        duration: 52,
        vibration: [24, 36, 48],
        weakMagnitude: 1,
        strongMagnitude: 1,
        tapticNotification: "success",
        tapticImpact: "heavy",
    },
    stageClear: {
        cooldown: 1500,
        duration: 36,
        vibration: [18, 28, 24],
        weakMagnitude: 0.72,
        strongMagnitude: 0.45,
        tapticNotification: "success",
        tapticImpact: "medium",
    },
};

var lastHapticByPreset = Object.create(null);
var lastHapticAt = 0;

function nowMs() {
    if (typeof performance !== "undefined" && typeof performance.now === "function") {
        return performance.now();
    }

    return Date.now();
}

function isIOSDevice() {
    if (typeof navigator === "undefined") {
        return false;
    }

    var ua = navigator.userAgent || "";
    return /iPad|iPhone|iPod/.test(ua)
        || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

function pulseDurationFromPattern(pattern) {
    if (!Array.isArray(pattern)) {
        return typeof pattern === "number" ? pattern : 0;
    }

    var total = 0;
    for (var i = 0; i < pattern.length; i += 2) {
        total += Number(pattern[i]) || 0;
    }
    return total;
}

function resolveBrowserVibration(preset) {
    if (Array.isArray(preset.vibration) && !isIOSDevice()) {
        return preset.vibration.slice();
    }

    if (typeof preset.vibration === "number") {
        return preset.vibration;
    }

    return pulseDurationFromPattern(preset.vibration || preset.duration);
}

function resolvePreset(name) {
    return HAPTIC_PRESETS[name] || HAPTIC_PRESETS.ui;
}

function isHapticsEnabled() {
    return gameState.vibrateFlg !== false;
}

function shouldTriggerPreset(name, preset) {
    if (!isHapticsEnabled()) {
        return false;
    }

    var now = nowMs();
    if (now - lastHapticAt < 16) {
        return false;
    }

    var cooldown = preset.cooldown || 0;
    var lastPresetAt = lastHapticByPreset[name] || 0;
    if (cooldown > 0 && now - lastPresetAt < cooldown) {
        return false;
    }

    lastHapticByPreset[name] = now;
    lastHapticAt = now;
    return true;
}

function tryInvoke(target, methodName, argSets) {
    if (!target || typeof target[methodName] !== "function") {
        return false;
    }

    for (var i = 0; i < argSets.length; i++) {
        try {
            target[methodName].apply(target, argSets[i]);
            return true;
        } catch (error) {}
    }

    return false;
}

function resolveCordovaHapticEngine() {
    if (typeof window === "undefined") {
        return null;
    }

    if (window.TapticEngine) {
        return window.TapticEngine;
    }

    if (window.plugins) {
        return window.plugins.tapticEngine
            || window.plugins.hapticFeedback
            || window.plugins.hapticfeedback
            || null;
    }

    return null;
}

function tryCordovaEngine(preset) {
    var engine = resolveCordovaHapticEngine();
    if (!engine) {
        return false;
    }

    if (preset.tapticNotification) {
        if (tryInvoke(engine, "notification", [
            [{ type: preset.tapticNotification }],
            [preset.tapticNotification],
        ])) {
            return true;
        }

        if (tryInvoke(engine, "notificationOccurred", [
            [String(preset.tapticNotification).toUpperCase()],
            [preset.tapticNotification],
        ])) {
            return true;
        }
    }

    if (preset.tapticKind === "selection") {
        if (tryInvoke(engine, "selection", [[]])
            || tryInvoke(engine, "selectionChanged", [[]])) {
            return true;
        }
    }

    if (preset.tapticImpact) {
        if (tryInvoke(engine, "impact", [
            [{ style: preset.tapticImpact }],
            [preset.tapticImpact],
            [],
        ])) {
            return true;
        }

        if (tryInvoke(engine, "impactOccurred", [
            [String(preset.tapticImpact).toUpperCase()],
            [preset.tapticImpact],
            [],
        ])) {
            return true;
        }
    }

    return tryInvoke(engine, "vibrate", [[]]);
}

function tryCordovaNotificationVibrate(preset) {
    if (typeof window === "undefined" || !window.cordova || typeof navigator === "undefined") {
        return false;
    }

    var notification = navigator.notification;
    if (!notification || typeof notification.vibrate !== "function") {
        return false;
    }

    var payload = resolveBrowserVibration(preset);
    return tryInvoke(notification, "vibrate", [[payload], [preset.duration]]);
}

function tryNavigatorVibrate(preset) {
    if (typeof navigator === "undefined") {
        return false;
    }

    var vibrate = navigator.vibrate
        || navigator.webkitVibrate
        || navigator.mozVibrate
        || navigator.msVibrate;

    if (typeof vibrate !== "function") {
        return false;
    }

    try {
        return !!vibrate.call(navigator, resolveBrowserVibration(preset));
    } catch (error) {
        return false;
    }
}

function getGamepadActuators(gamepad) {
    var actuators = [];

    if (!gamepad) {
        return actuators;
    }

    if (gamepad.vibrationActuator) {
        actuators.push(gamepad.vibrationActuator);
    }

    if (gamepad.hapticActuators && gamepad.hapticActuators.length) {
        for (var i = 0; i < gamepad.hapticActuators.length; i++) {
            actuators.push(gamepad.hapticActuators[i]);
        }
    }

    return actuators;
}

function buildGamepadEffect(effectType, preset) {
    var effect = {
        startDelay: 0,
        duration: preset.duration,
        weakMagnitude: preset.weakMagnitude,
        strongMagnitude: preset.strongMagnitude,
    };

    if (effectType === "trigger-rumble") {
        effect.leftTrigger = preset.strongMagnitude;
        effect.rightTrigger = preset.weakMagnitude;
    }

    return effect;
}

function triggerActuator(actuator, preset) {
    if (!actuator) {
        return false;
    }

    if (typeof actuator.playEffect === "function") {
        var effectType = "dual-rumble";

        if (Array.isArray(actuator.effects) && actuator.effects.length > 0) {
            effectType = actuator.effects.indexOf("dual-rumble") >= 0 ? "dual-rumble" : actuator.effects[0];
        } else if (typeof actuator.type === "string" && actuator.type) {
            effectType = actuator.type;
        }

        try {
            var result = actuator.playEffect(effectType, buildGamepadEffect(effectType, preset));
            if (result && typeof result.catch === "function") {
                result.catch(function () {});
            }
            return true;
        } catch (error) {}
    }

    if (typeof actuator.pulse === "function") {
        try {
            actuator.pulse(Math.max(preset.weakMagnitude, preset.strongMagnitude), preset.duration);
            return true;
        } catch (error) {}
    }

    return false;
}

function tryGamepadHaptics(preset) {
    if (typeof navigator === "undefined" || typeof navigator.getGamepads !== "function") {
        return false;
    }

    var pads;
    try {
        pads = navigator.getGamepads();
    } catch (error) {
        return false;
    }

    if (!pads || !pads.length) {
        return false;
    }

    var triggered = false;
    for (var i = 0; i < pads.length; i++) {
        var actuators = getGamepadActuators(pads[i]);
        for (var j = 0; j < actuators.length; j++) {
            triggered = triggerActuator(actuators[j], preset) || triggered;
        }
    }

    return triggered;
}

export function setHapticsEnabled(enabled) {
    gameState.vibrateFlg = enabled !== false;
}

export function triggerHaptic(name) {
    var presetName = name || "ui";
    var preset = resolvePreset(presetName);

    if (!shouldTriggerPreset(presetName, preset)) {
        return false;
    }

    var triggered = false;
    var usedCordovaDevice = tryCordovaEngine(preset) || tryCordovaNotificationVibrate(preset);

    triggered = usedCordovaDevice || triggered;

    if (!usedCordovaDevice) {
        triggered = tryNavigatorVibrate(preset) || triggered;
    }

    triggered = tryGamepadHaptics(preset) || triggered;

    return triggered;
}

export { isHapticsEnabled };
