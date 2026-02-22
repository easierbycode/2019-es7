import { SCENE_IDS } from "./enums/scene-ids.js";

export const LANG = (() => {
    if (typeof document !== "undefined" && document.documentElement) {
        switch (document.documentElement.lang) {
        case "ja":
            return "ja";
        default:
            return "en";
        }
    }
    return "en";
})();

export const BASE_PATH = (() => {
    const base = typeof window !== "undefined" && typeof window.baseUrl === "string" ? window.baseUrl : "http://localhost/";
    return base.replace(/^https?\:\/\/[^\/]+/, "").replace(/\/api\/$/, "");
})();

export const BGM_INFO = {
    boss_bison_bgm: {
        name: "boss_bison_bgm",
        start: 914888,
        end: 6111881,
    },
    boss_barlog_bgm: {
        name: "boss_barlog_bgm",
        start: 782400,
        end: 4315201,
    },
    boss_sagat_bgm: {
        name: "boss_sagat_bgm",
        start: 1635142,
        end: 6883739,
    },
    boss_vega_bgm: {
        name: "boss_vega_bgm",
        start: 513529,
        end: 4325295,
    },
    boss_goki_bgm: {
        name: "boss_goki_bgm",
        start: 864e3,
        end: 6130287,
    },
    boss_fang_bgm: {
        name: "boss_fang_bgm",
        start: 888672,
        end: 5802799,
    },
};

export const RESOURCE_PATHS = {
    recipe: "assets/game.json",
    game_ui: "assets/game_ui.json",
    game_asset: "assets/game_asset.json",
    voice_titlecall: "assets/sounds/scene_title/voice_titlecall.mp3",
    se_decision: "assets/sounds/ui/se_decision.mp3",
    se_correct: "assets/sounds/ui/se_correct.mp3",
    se_cursor_sub: "assets/sounds/ui/se_cursor_sub.mp3",
    se_cursor: "assets/sounds/ui/se_cursor.mp3",
    se_over: "assets/sounds/ui/se_over.mp3",
    adventure_bgm: "assets/sounds/scene_adventure/adventure_bgm.mp3",
    g_adbenture_voice0: "assets/sounds/scene_adventure/g_adbenture_voice0.mp3",
    voice_thankyou: "assets/sounds/voice_thankyou.mp3",
    se_explosion: "assets/sounds/se_explosion.mp3",
    se_shoot: "assets/sounds/se_shoot.mp3",
    se_shoot_b: "assets/sounds/se_shoot_b.mp3",
    se_sp: "assets/sounds/se_sp.mp3",
    se_sp_explosion: "assets/sounds/se_sp_explosion.mp3",
    se_damage: "assets/sounds/se_damage.mp3",
    se_guard: "assets/sounds/se_guard.mp3",
    se_finish_akebono: "assets/sounds/se_finish_akebono.mp3",
    se_barrier_start: "assets/sounds/se_barrier_start.mp3",
    se_barrier_end: "assets/sounds/se_barrier_end.mp3",
    voice_round0: "assets/sounds/voice_round0.mp3",
    voice_round1: "assets/sounds/voice_round1.mp3",
    voice_round2: "assets/sounds/voice_round2.mp3",
    voice_round3: "assets/sounds/voice_round3.mp3",
    voice_fight: "assets/sounds/voice_fight.mp3",
    voice_ko: "assets/sounds/voice_ko.mp3",
    voice_another_fighter: "assets/sounds/voice_another_fighter.mp3",
    g_stage_voice_0: "assets/sounds/scene_game/g_stage_voice_0.mp3",
    g_stage_voice_1: "assets/sounds/scene_game/g_stage_voice_1.mp3",
    g_stage_voice_2: "assets/sounds/scene_game/g_stage_voice_2.mp3",
    g_stage_voice_3: "assets/sounds/scene_game/g_stage_voice_3.mp3",
    g_stage_voice_4: "assets/sounds/scene_game/g_stage_voice_4.mp3",
    g_damage_voice: "assets/sounds/g_damage_voice.mp3",
    g_powerup_voice: "assets/sounds/g_powerup_voice.mp3",
    g_sp_voice: "assets/sounds/g_sp_voice.mp3",
    boss_bison_bgm: "assets/sounds/boss_bison_bgm.mp3",
    boss_bison_voice_add: "assets/sounds/boss_bison_voice_add.mp3",
    boss_bison_voice_ko: "assets/sounds/boss_bison_voice_ko.mp3",
    boss_bison_voice_faint: "assets/sounds/boss_bison_voice_faint.mp3",
    boss_bison_voice_faint_punch: "assets/sounds/boss_bison_voice_faint_punch.mp3",
    boss_bison_voice_punch: "assets/sounds/boss_bison_voice_punch.mp3",
    boss_barlog_bgm: "assets/sounds/boss_barlog_bgm.mp3",
    boss_barlog_voice_add: "assets/sounds/boss_barlog_voice_add.mp3",
    boss_barlog_voice_ko: "assets/sounds/boss_barlog_voice_ko.mp3",
    boss_barlog_voice_projectile: "assets/sounds/boss_barlog_voice_projectile.mp3",
    boss_barlog_voice_barcelona: "assets/sounds/boss_barlog_voice_barcelona.mp3",
    boss_sagat_bgm: "assets/sounds/boss_sagat_bgm.mp3",
    boss_sagat_voice_add: "assets/sounds/boss_sagat_voice_add.mp3",
    boss_sagat_voice_ko: "assets/sounds/boss_sagat_voice_ko.mp3",
    boss_sagat_voice_projectile0: "assets/sounds/boss_sagat_voice_projectile0.mp3",
    boss_sagat_voice_projectile1: "assets/sounds/boss_sagat_voice_projectile1.mp3",
    boss_sagat_voice_kick: "assets/sounds/boss_sagat_voice_kick.mp3",
    boss_vega_bgm: "assets/sounds/boss_vega_bgm.mp3",
    boss_vega_voice_add: "assets/sounds/boss_vega_voice_add.mp3",
    boss_vega_voice_ko: "assets/sounds/boss_vega_voice_ko.mp3",
    boss_vega_voice_crusher: "assets/sounds/boss_vega_voice_crusher.mp3",
    boss_vega_voice_warp: "assets/sounds/boss_vega_voice_warp.mp3",
    boss_vega_voice_projectile: "assets/sounds/boss_vega_voice_projectile.mp3",
    boss_vega_voice_shoot: "assets/sounds/boss_vega_voice_shoot.mp3",
    boss_goki_bgm: "assets/sounds/boss_goki_bgm.mp3",
    boss_goki_voice_add: "assets/sounds/boss_goki_voice_add.mp3",
    boss_goki_voice_ko: "assets/sounds/boss_goki_voice_ko.mp3",
    boss_goki_voice_projectile0: "assets/sounds/boss_goki_voice_projectile0.mp3",
    boss_goki_voice_projectile1: "assets/sounds/boss_goki_voice_projectile1.mp3",
    boss_goki_voice_ashura: "assets/sounds/boss_goki_voice_ashura.mp3",
    boss_goki_voice_syungokusatu0: "assets/sounds/boss_goki_voice_syungokusatu0.mp3",
    boss_goki_voice_syungokusatu1: "assets/sounds/boss_goki_voice_syungokusatu1.mp3",
    boss_fang_bgm: "assets/sounds/boss_fang_bgm.mp3",
    boss_fang_voice_add: "assets/sounds/boss_fang_voice_add.mp3",
    boss_fang_voice_ko: "assets/sounds/boss_fang_voice_ko.mp3",
    boss_fang_voice_beam0: "assets/sounds/boss_fang_voice_beam0.mp3",
    boss_fang_voice_beam1: "assets/sounds/boss_fang_voice_beam1.mp3",
    boss_fang_voice_projectile: "assets/sounds/boss_fang_voice_projectile.mp3",
    bgm_continue: "assets/sounds/scene_continue/bgm_continue.mp3",
    bgm_gameover: "assets/sounds/scene_continue/bgm_gameover.mp3",
    voice_countdown0: "assets/sounds/scene_continue/voice_countdown0.mp3",
    voice_countdown1: "assets/sounds/scene_continue/voice_countdown1.mp3",
    voice_countdown2: "assets/sounds/scene_continue/voice_countdown2.mp3",
    voice_countdown3: "assets/sounds/scene_continue/voice_countdown3.mp3",
    voice_countdown4: "assets/sounds/scene_continue/voice_countdown4.mp3",
    voice_countdown5: "assets/sounds/scene_continue/voice_countdown5.mp3",
    voice_countdown6: "assets/sounds/scene_continue/voice_countdown6.mp3",
    voice_countdown7: "assets/sounds/scene_continue/voice_countdown7.mp3",
    voice_countdown8: "assets/sounds/scene_continue/voice_countdown8.mp3",
    voice_countdown9: "assets/sounds/scene_continue/voice_countdown9.mp3",
    voice_gameover: "assets/sounds/scene_continue/voice_gameover.mp3",
    g_continue_yes_voice0: "assets/sounds/scene_continue/g_continue_yes_voice0.mp3",
    g_continue_yes_voice1: "assets/sounds/scene_continue/g_continue_yes_voice1.mp3",
    g_continue_yes_voice2: "assets/sounds/scene_continue/g_continue_yes_voice2.mp3",
    g_continue_no_voice0: "assets/sounds/scene_continue/g_continue_no_voice0.mp3",
    g_continue_no_voice1: "assets/sounds/scene_continue/g_continue_no_voice1.mp3",
    voice_congra: "assets/sounds/scene_clear/voice_congra.mp3",
    title_bg: "assets/img/title_bg.jpg",
    stage_loop0: "assets/img/stage/stage_loop0.png",
    stage_loop1: "assets/img/stage/stage_loop1.png",
    stage_loop2: "assets/img/stage/stage_loop2.png",
    stage_loop3: "assets/img/stage/stage_loop3.png",
    stage_loop4: "assets/img/stage/stage_loop4.png",
    stage_end0: "assets/img/stage/stage_end0.png",
    stage_end1: "assets/img/stage/stage_end1.png",
    stage_end2: "assets/img/stage/stage_end2.png",
    stage_end3: "assets/img/stage/stage_end3.png",
    stage_end4: "assets/img/stage/stage_end4.png",
};

export const SCENE_NAMES = SCENE_IDS;

export const STAGE_IDS = {
    PROLOGUE: 0,
    ENDING: 4,
    SPENDING: 5,
};

export const GAME_DIMENSIONS = {
    WIDTH: 256,
    HEIGHT: 480,
    CENTER_X: 128,
    CENTER_Y: 240,
};

export const STAGE_DIMENSIONS = {
    WIDTH: typeof window !== "undefined" ? window.innerWidth : GAME_DIMENSIONS.WIDTH,
    HEIGHT: typeof window !== "undefined" ? window.innerHeight : GAME_DIMENSIONS.HEIGHT,
    CENTER_X: typeof window !== "undefined" ? window.innerWidth / 2 : GAME_DIMENSIONS.CENTER_X,
    CENTER_Y: typeof window !== "undefined" ? window.innerHeight / 2 : GAME_DIMENSIONS.CENTER_Y,
};

export const ANIMATION = {
    BASE_SPEED: 0.33,
};

export const FPS = 30;
