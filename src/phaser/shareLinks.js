import { LANG } from "../constants.js";

// Score sharing for the Phaser game. The 2019 game (a ?level= name starting
// with "2019", e.g. ?level=2019 or ?level=2019-PS2) keeps the original
// April Fool 2019 share: Capcom's page, its hashtags and its tweet text.
// Every other game, PsyOps.ai included, shares easierbycode.com.

var ORIGINAL_2019 = {
    ja: {
        url: "https://game.capcom.com/cfn/sfv/aprilfool/2019/?lang=ja",
        hashtags: "シャド研,SFVAE,aprilfool,エイプリルフール",
        heading: "エイプリルフール 2019 世界大統領がSTGやってみた\n",
    },
    en: {
        url: "https://game.capcom.com/cfn/sfv/aprilfool/2019/?lang=en",
        hashtags: "ShadalooCRI, SFVAE, aprilfool",
        heading: "APRIL FOOL 2019 WORLD PRESIDENT CHALLENGES A STG\n",
    },
};

var PSYOPS = {
    ja: { url: "https://easierbycode.com", hashtags: "PsyOpsAI", heading: "PsyOps.ai\n" },
    en: { url: "https://easierbycode.com", hashtags: "PsyOpsAI", heading: "PSYOPS.AI\n" },
};

export function isPlaying2019() {
    if (typeof window === "undefined" || !window.location) {
        return false;
    }
    try {
        var level = new URLSearchParams(window.location.search).get("level") || "";
        return /^2019/i.test(level.trim());
    } catch (e) {
        return false;
    }
}

// { url, hashtags, heading } for the current game and language; heading is
// the tweet's first line, newline included.
export function shareStrings() {
    var set = isPlaying2019() ? ORIGINAL_2019 : PSYOPS;
    return LANG === "ja" ? set.ja : set.en;
}
