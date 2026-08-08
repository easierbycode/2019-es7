// How many stages a recipe has, and how per-stage assets are found for them.
//
// The game shipped with five stages, and everything indexed by stage id — the
// scrolling background, the end-of-stage art, the round voice, the boss name,
// the story scenario — has exactly five entries. A Dezaemon 2 import brings up
// to ten stages, so those lookups need a rule for stage 5 and up rather than a
// hard clamp that quietly plays a nine-stage game as a five-stage one.
//
// The rule is: stage COUNT comes from the recipe, and per-stage ASSETS wrap
// around the five that exist. Wrapping keeps every lookup valid without
// inventing art, and it puts a recognisably different backdrop behind each
// consecutive stage.

export const MAX_STAGE_ID = 9;   // Dezaemon 2's own maximum
export const ASSET_STAGES = 5;   // stage_loop0..4, boss names, scenario entries

// Clamp a stage id into the playable range.
export function clampStageId(value) {
    var id = Number(value);
    if (!Number.isFinite(id)) return 0;
    return Math.max(0, Math.min(MAX_STAGE_ID, Math.floor(id)));
}

// The asset slot a stage borrows: stage 5 reuses stage 0's, and so on.
export function assetStageId(stageId) {
    return clampStageId(stageId) % ASSET_STAGES;
}

// Stage ids a recipe actually defines, ascending.
export function recipeStageIds(recipe) {
    if (!recipe) return [0];
    var ids = [];
    for (var key in recipe) {
        var m = /^stage(\d+)$/.exec(key);
        if (!m) continue;
        var id = Number(m[1]);
        if (id >= 0 && id <= MAX_STAGE_ID) ids.push(id);
    }
    ids.sort(function (a, b) { return a - b; });
    return ids.length ? ids : [0];
}

// The last stage a recipe defines — reaching it means the game is over.
export function lastStageId(recipe) {
    var ids = recipeStageIds(recipe);
    return ids[ids.length - 1];
}

// Grid width of a stage, read off its own rows. Levels authored before widths
// varied are 8 wide; a Dezaemon import is 14 (the Saturn playfield's columns).
export function stageGridCols(enemylist, fallback) {
    if (Array.isArray(enemylist) && Array.isArray(enemylist[0]) && enemylist[0].length) {
        return enemylist[0].length;
    }
    return fallback || 8;
}
