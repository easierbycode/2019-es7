// Who made PsyOps.ai. Read by every staff roll: the Phaser title's STAFF ROLL
// panel, the Phaser ending's roll and the PIXI title's panel, so a name is
// changed in one place. Same list, same wording, as codemonkey.games plays
// (shmupX's SHMUPX_STAFF_ROLL), so an installed copy of this page shows the
// roll the site does.
//
// It replaces staffrollName.gif, a plate with the original April Fool 2019
// team's credits drawn into it. The 2019 game itself (?level=2019...,
// shareLinks.js isPlaying2019) still shows that plate.
export var STAFF_ROLL = [
    [".: ART :.", "AGENT DOM POM, AGENT PRESLAR"],
    [".: GAME TESTING :.", "SEAMUS MCNAMARA"],
    [".: MAKER TESTING :.", "AGENT BASS, AGENT SMITH"],
    [".: PLAN :.", "JC BUSTILLOS"],
    [".: PROGRAM :.", "CODEMONKEY.GAMES"],
    [".: SOUND :.", "2-D, MYDIFFERENTBEATS"],
    [".: STORY :.", "BRANDON, AGENT BENAQUISTA"],
];

// athenaFont is pixel-exact at 8 px (one em = one 8 px cell), so both rows
// sit at that size with a 1 px drop shadow rather than an outline, which
// would fill a pixel face's counters in. Declared in phaser-game.html and
// index.html (assets/fonts/athenaFont.ttf); Arial stands in until it loads.
export var STAFF_FONT = "athenaFont, Arial";
export var STAFF_ROLE_COLOR = "#ffff00";
export var STAFF_NAME_COLOR = "#ffffff";
// Role line, then its names 14 px below; each pair is 40 px tall.
export var STAFF_NAME_OFFSET = 14;
export var STAFF_ROW_HEIGHT = 40;
