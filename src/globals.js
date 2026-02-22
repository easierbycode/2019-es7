function ensureResources() {
    if (!globalThis.__GAME_RESOURCES__ || typeof globalThis.__GAME_RESOURCES__ !== "object") {
        globalThis.__GAME_RESOURCES__ = {};
    }
    return globalThis.__GAME_RESOURCES__;
}

function resolveInteractionManager() {
    const game = globalThis.__PHASER_GAME__;

    if (!game || !game.renderer || !game.renderer.plugins) {
        return null;
    }

    return game.renderer.plugins.interaction || null;
}

export const globals = {};

Object.defineProperty(globals, "resources", {
    configurable: false,
    enumerable: true,
    get() {
        return ensureResources();
    },
    set(value) {
        globalThis.__GAME_RESOURCES__ = value && typeof value === "object" ? value : {};
    },
});

Object.defineProperty(globals, "interactionManager", {
    configurable: false,
    enumerable: true,
    get() {
        return resolveInteractionManager();
    },
});

export default globals;
