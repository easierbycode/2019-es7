"use strict";

function slugify(name) {
    return String(name || "").toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 30) || "level";
}

function packageIdFor(name) {
    return "com.easierbycode." + slugify(name);
}

module.exports = { slugify, packageIdFor };
