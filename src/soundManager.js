import { gameState } from "./gameState.js";
import { globals } from "./globals.js";

const soundInstances = Object.create(null);

const VOLUMES = {
    voice_titlecall: 0.7,
    se_decision: 0.75,
    se_correct: 0.9,
    se_cursor_sub: 0.9,
    se_cursor: 0.9,
    se_over: 0.9,
    adventure_bgm: 0.2,
    g_adbenture_voice0: 0.5,
    voice_thankyou: 0.7,
    se_explosion: 0.35,
    se_shoot: 0.3,
    se_shoot_b: 0.3,
    se_sp: 0.8,
    se_ca: 0.8,
    se_sp_explosion: 0.9,
    se_ca_explosion: 0.9,
    se_damage: 0.15,
    se_guard: 0.2,
    se_finish_akebono: 0.9,
    se_barrier_start: 0.9,
    se_barrier_end: 0.9,
    voice_round0: 0.7,
    voice_round1: 0.7,
    voice_round2: 0.7,
    voice_round3: 0.7,
    voice_fight: 0.7,
    voice_ko: 0.7,
    voice_another_fighter: 0.7,
    g_stage_voice_0: 0.55,
    g_stage_voice_1: 0.7,
    g_stage_voice_2: 0.45,
    g_stage_voice_3: 0.45,
    g_stage_voice_4: 0.55,
    g_damage_voice: 0.7,
    g_powerup_voice: 0.55,
    g_sp_voice: 0.7,
    g_ca_voice: 0.7,
    boss_bison_bgm: 0.4,
    boss_bison_voice_add: 0.65,
    boss_bison_voice_ko: 0.9,
    boss_bison_voice_faint: 0.55,
    boss_bison_voice_faint_punch: 0.65,
    boss_bison_voice_punch: 0.65,
    boss_barlog_bgm: 0.4,
    boss_barlog_voice_add: 0.7,
    boss_barlog_voice_ko: 0.9,
    boss_barlog_voice_projectile: 0.6,
    boss_barlog_voice_tama: 0.6,
    boss_barlog_voice_barcelona: 0.7,
    boss_sagat_bgm: 0.4,
    boss_sagat_voice_add: 0.9,
    boss_sagat_voice_ko: 0.9,
    boss_sagat_voice_projectile0: 0.45,
    boss_sagat_voice_tama0: 0.45,
    boss_sagat_voice_projectile1: 0.65,
    boss_sagat_voice_tama1: 0.65,
    boss_sagat_voice_kick: 0.65,
    boss_vega_bgm: 0.3,
    boss_vega_voice_add: 0.7,
    boss_vega_voice_ko: 0.9,
    boss_vega_voice_crusher: 0.7,
    boss_vega_voice_warp: 0.7,
    boss_vega_voice_projectile: 0.7,
    boss_vega_voice_tama: 0.7,
    boss_vega_voice_shoot: 0.7,
    boss_goki_bgm: 0.4,
    boss_goki_voice_add: 0.7,
    boss_goki_voice_ko: 0.9,
    boss_goki_voice_projectile0: 0.7,
    boss_goki_voice_tama0: 0.7,
    boss_goki_voice_projectile1: 0.7,
    boss_goki_voice_tama1: 0.7,
    boss_goki_voice_ashura: 0.7,
    boss_goki_voice_syungokusatu0: 0.7,
    boss_goki_voice_syungokusatu1: 0.7,
    boss_fang_bgm: 0.4,
    boss_fang_voice_add: 0.6,
    boss_fang_voice_ko: 0.9,
    boss_fang_voice_beam0: 0.6,
    boss_fang_voice_beam1: 0.6,
    boss_fang_voice_projectile: 0.6,
    boss_fang_voice_tama: 0.6,
    bgm_continue: 0.25,
    bgm_gameover: 0.3,
    voice_countdown0: 0.7,
    voice_countdown1: 0.7,
    voice_countdown2: 0.7,
    voice_countdown3: 0.7,
    voice_countdown4: 0.7,
    voice_countdown5: 0.7,
    voice_countdown6: 0.7,
    voice_countdown7: 0.7,
    voice_countdown8: 0.7,
    voice_countdown9: 0.7,
    voice_gameover: 0.7,
    g_continue_yes_voice0: 0.7,
    g_continue_yes_voice1: 0.7,
    g_continue_yes_voice2: 0.7,
    g_continue_no_voice0: 0.7,
    g_continue_no_voice1: 0.7,
    voice_congra: 0.7,
};

function resolveSound(soundName) {
    const resources = globals.resources;
    if (!resources || !resources[soundName]) {
        return null;
    }

    return resources[soundName].sound || null;
}

function isPlaying(instance) {
    if (!instance) {
        return false;
    }

    return instance.isPlaying === undefined ? true : Boolean(instance.isPlaying);
}

export function play(soundName) {
    if (gameState.lowModeFlg) {
        return null;
    }

    const sound = resolveSound(soundName);
    if (!sound || typeof sound.play !== "function") {
        return null;
    }

    try {
        const instance = sound.play();
        soundInstances[soundName] = instance || null;
        return instance || null;
    } catch (error) {
        if (typeof console !== "undefined" && console.error) {
            console.error("Error playing sound " + soundName + ":", error);
        }
    }

    return null;
}

export function bgmPlay(soundName, startMs, endMs) {
    if (gameState.lowModeFlg) {
        return null;
    }

    const sound = resolveSound(soundName);
    if (!sound || typeof sound.play !== "function") {
        return null;
    }

    const startSec = Number(startMs || 0) / 1000;
    const endSec = Number(endMs || 0) / 1000;
    let firstPlay = true;

    const loop = () => {
        const previous = soundInstances[soundName];
        if (isPlaying(previous) && typeof previous.stop === "function") {
            try {
                previous.stop();
            } catch (error) {
                if (typeof console !== "undefined" && console.warn) {
                    console.warn("Could not stop previous loop for " + soundName + ":", error);
                }
            }
        }

        const options = {
            start: firstPlay ? 0 : startSec,
            loop: false,
        };

        if (endSec > 0) {
            options.end = endSec;
        }

        try {
            const instance = sound.play(options);
            if (instance && typeof instance.on === "function") {
                instance.on("end", loop);
            }
            soundInstances[soundName] = instance || null;
            firstPlay = false;
        } catch (error) {
            if (typeof console !== "undefined" && console.error) {
                console.error("Error playing BGM " + soundName + ":", error);
            }
        }
    };

    loop();
    return soundInstances[soundName] || null;
}

export function stop(soundName) {
    if (gameState.lowModeFlg) {
        return;
    }

    const instance = soundInstances[soundName];
    if (instance && typeof instance.stop === "function" && isPlaying(instance)) {
        try {
            instance.stop();
        } catch (error) {
            if (typeof console !== "undefined" && console.error) {
                console.error("Error stopping sound " + soundName + ":", error);
            }
        }
    }

    delete soundInstances[soundName];
}

export function stopAll() {
    if (gameState.lowModeFlg) {
        return;
    }

    if (PIXI.sound && typeof PIXI.sound.stopAll === "function") {
        PIXI.sound.stopAll();
    }

    const keys = Object.keys(soundInstances);
    for (let i = 0; i < keys.length; i += 1) {
        delete soundInstances[keys[i]];
    }
}

export function pauseAll() {
    if (gameState.lowModeFlg) {
        return;
    }

    if (PIXI.sound && typeof PIXI.sound.pauseAll === "function") {
        PIXI.sound.pauseAll();
    }
}

export function resumeAll() {
    if (gameState.lowModeFlg) {
        return;
    }

    if (PIXI.sound && typeof PIXI.sound.resumeAll === "function") {
        PIXI.sound.resumeAll();
    }
}

export function setInitialVolumes() {
    if (gameState.lowModeFlg) {
        return;
    }

    const resources = globals.resources;
    const names = Object.keys(VOLUMES);

    for (let i = 0; i < names.length; i += 1) {
        const soundName = names[i];
        const resource = resources[soundName];

        if (!resource || !resource.sound) {
            continue;
        }

        try {
            resource.sound.volume = VOLUMES[soundName];
        } catch (error) {
            if (typeof console !== "undefined" && console.warn) {
                console.warn("Could not set volume for " + soundName + ":", error);
            }
        }
    }
}
