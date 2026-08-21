"use strict";

// An in-page stand-in for the compat Firebase SDK the editor loads from
// gstatic, so cloud-save specs run without a network or a real project.
//
// It is deliberately strict about the rules that actually shape a payload in
// the Realtime Database, because those are what a save has to survive:
//
//   * `undefined` anywhere in a value is an error (the real SDK throws
//     "contains undefined in property" unless ignoreUndefinedProperties is on)
//   * keys may not be empty or contain . # $ / [ ]
//   * non-finite numbers are an error
//   * `null` deletes rather than stores, so an array with holes comes back as
//     an object keyed by index instead of an array
//   * ServerValue.TIMESTAMP resolves to a number on write
//   * update() replaces each named child, leaving the rest of the node alone
//   * arrays are stored as index-keyed objects and rebuilt into arrays on
//     read, but only when the indices are dense enough (max < 2 * count) —
//     which is why a sparse song table comes back as an object and a dense
//     one comes back as an array
//
// The stored tree is exposed as window.__FAKE_RTDB__ so a spec can read back
// exactly what was written.
const STUB_SOURCE = `(function () {
    var store = {};
    window.__FAKE_RTDB__ = store;

    var BAD_KEY = /[.#$/\\[\\]]/;
    var TIMESTAMP = { ".sv": "timestamp" };

    function sanitize(value, path) {
        if (value === null) return null;
        if (value === TIMESTAMP) return Date.now();
        var type = typeof value;
        if (type === "undefined") {
            throw new Error("Firebase: undefined value at " + path);
        }
        if (type === "number") {
            if (!isFinite(value)) throw new Error("Firebase: non-finite number at " + path);
            return value;
        }
        if (type === "string" || type === "boolean") return value;
        if (type === "function") throw new Error("Firebase: function value at " + path);
        if (Array.isArray(value)) {
            var arr = value.map(function (v, i) { return sanitize(v, path + "/" + i); });
            // null is a delete, so a hole makes the node an object, not an array
            if (arr.some(function (v) { return v === null; })) {
                var obj = {};
                arr.forEach(function (v, i) { if (v !== null) obj[String(i)] = v; });
                return obj;
            }
            return arr;
        }
        var out = {};
        var empty = true;
        for (var k in value) {
            if (!Object.prototype.hasOwnProperty.call(value, k)) continue;
            if (k === "" || BAD_KEY.test(k)) {
                throw new Error("Firebase: invalid key \\"" + k + "\\" at " + path);
            }
            var child = sanitize(value[k], path + "/" + k);
            if (child === null) continue;   // a null child simply is not stored
            out[k] = child;
            empty = false;
        }
        return empty ? null : out;
    }

    function segments(path) {
        return String(path).split("/").filter(function (s) { return s.length; });
    }

    function readPath(path) {
        var node = store;
        var parts = segments(path);
        for (var i = 0; i < parts.length; i++) {
            if (node === null || typeof node !== "object") return null;
            node = node[parts[i]];
            if (node === undefined) return null;
        }
        return node === undefined ? null : node;
    }

    function ensurePath(path) {
        var node = store;
        var parts = segments(path);
        for (var i = 0; i < parts.length; i++) {
            if (node[parts[i]] === undefined || node[parts[i]] === null ||
                typeof node[parts[i]] !== "object") {
                node[parts[i]] = {};
            }
            node = node[parts[i]];
        }
        return node;
    }

    function writePath(path, value) {
        var parts = segments(path);
        if (!parts.length) { store = window.__FAKE_RTDB__ = value || {}; return; }
        var leaf = parts.pop();
        var node = ensurePath(parts.join("/"));
        if (value === null) delete node[leaf];
        else node[leaf] = value;
    }

    // On read the client rebuilds an index-keyed node into an array, but only
    // when the indices are dense enough to be worth it — the real rule is
    // "every key is a non-negative integer and the largest is < 2x the count".
    // A sparse table (a save that uses songs 0-11 and 13) therefore arrives as
    // an object while a dense one arrives as an array, and code that reads it
    // has to work either way.
    function coerce(value) {
        if (value === null || typeof value !== "object") return value;
        if (Array.isArray(value)) return value.map(coerce);
        var keys = Object.keys(value);
        var out = {};
        for (var i = 0; i < keys.length; i++) out[keys[i]] = coerce(value[keys[i]]);
        if (!keys.length) return out;
        var max = -1;
        for (var j = 0; j < keys.length; j++) {
            if (!/^(0|[1-9]\\d*)$/.test(keys[j])) return out;
            var n = Number(keys[j]);
            if (n > max) max = n;
        }
        if (max >= keys.length * 2) return out;
        var arr = [];
        for (var k = 0; k <= max; k++) arr.push(out[String(k)] === undefined ? null : out[String(k)]);
        return arr;
    }

    function Snapshot(value) { this._value = coerce(value); }
    Snapshot.prototype.val = function () { return this._value; };
    Snapshot.prototype.exists = function () { return this._value !== null && this._value !== undefined; };

    function Ref(path) { this._path = path; }
    Ref.prototype.child = function (p) { return new Ref(this._path + "/" + p); };
    Ref.prototype.once = function () {
        return Promise.resolve(new Snapshot(readPath(this._path)));
    };
    Ref.prototype.set = function (value) {
        writePath(this._path, sanitize(value, this._path));
        return Promise.resolve();
    };
    Ref.prototype.update = function (value) {
        if (!value || typeof value !== "object" || Array.isArray(value)) {
            throw new Error("Firebase: update() expects an object");
        }
        // Each named child is replaced wholesale; a null child is a delete.
        // Sanitize everything before touching the store so a rejected payload
        // leaves no half-write behind, the way a real update() would.
        var clean = {};
        for (var key in value) {
            if (!Object.prototype.hasOwnProperty.call(value, key)) continue;
            if (key === "" || BAD_KEY.test(key)) {
                throw new Error("Firebase: invalid key \\"" + key + "\\" at " + this._path);
            }
            clean[key] = sanitize(value[key], this._path + "/" + key);
        }
        var node = ensurePath(this._path);
        for (var k in clean) {
            if (clean[k] === null) delete node[k];
            else node[k] = clean[k];
        }
        return Promise.resolve();
    };

    function database() {
        return { ref: function (p) { return new Ref(p || ""); } };
    }
    database.ServerValue = { TIMESTAMP: TIMESTAMP };

    // No storage(): a .sav import carries no custom audio blobs, and
    // initFirebase() already treats a missing storage module as "not shared".
    window.firebase = {
        apps: [],
        initializeApp: function (config) {
            var app = { options: config, name: "[DEFAULT]" };
            window.firebase.apps = [app];
            return app;
        },
        database: database,
    };
})();`;

// Serve the stub in place of the gstatic compat bundles. The app bundle
// carries the whole stub; the database/storage bundles resolve to nothing,
// exactly as they would if the stub had already defined everything.
async function installFirebaseStub(page) {
    await page.route("https://www.gstatic.com/**", (route) => {
        const isApp = route.request().url().includes("firebase-app-compat");
        return route.fulfill({
            contentType: "application/javascript",
            body: isApp ? STUB_SOURCE : "",
        });
    });
}

module.exports = { installFirebaseStub, STUB_SOURCE };
