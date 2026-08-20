// character('red_dress_killer') -> a Svelte 5 component bound to that library
// character. The named exports in generated.js are built with this.
import Character from "./Character.svelte";

function boundProps(props, name, defaults) {
  // Preserve the reactivity of the caller's props object (it may be a runes
  // proxy) while pinning `name` and filling defaults for absent keys.
  return new Proxy(props, {
    get(target, key, receiver) {
      if (key === "name") return name;
      const value = Reflect.get(target, key, receiver);
      return value === undefined && key in defaults ? defaults[key] : value;
    },
    has(target, key) {
      return key === "name" || key in defaults || Reflect.has(target, key);
    },
  });
}

/**
 * Returns a component for one character in the library. Works for characters
 * created after this module was published — the lookup happens at mount time.
 */
export function character(name, defaults = {}) {
  return ($$anchor, $$props = {}) =>
    Character($$anchor, boundProps($$props, name, defaults));
}
