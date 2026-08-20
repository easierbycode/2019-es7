// easierbycode.com/2019-es7/characters — importable game characters.
//
//   import { red_dress_killer } from "https://easierbycode.com/2019-es7/characters";
//
//   <Game width={480} height={640}>
//     <Scene key="main">
//       <red_dress_killer x={240} y={300} />
//     </Scene>
//   </Game>
//
// Built into ../index.js (bare `svelte`/`phaser` externals, for bundlers and
// import-map pages) and ../browser.js (svelte pinned to the esm.sh build the
// cmg scene-script runtime uses). See ../README.md.

// The full 5velte-ph4ser surface, so one import covers the whole scene tree:
// <Game>, <Scene>, <Sprite>, <Text>, ..., plus the compiler-free core hooks.
export * from "5velte-ph4ser";

export { default as Character } from "./Character.svelte";
export { default as Adopt } from "./Adopt.svelte";
export { character } from "./factory.js";

// One named export per character in the library at publish time.
export * from "./generated.js";

export {
  DEFAULT_DB,
  animSets,
  deleteCharacter,
  ensureCharacterAssets,
  fetchAtlas,
  fetchCharacter,
  listCharacters,
  saveCharacter,
} from "./runtime.js";

// ---- Character editor -------------------------------------------------------
// The editor is a self-contained custom element bundle served next to this
// module; load it lazily so game imports never pay for editor UI.

const editorUrl = () => new URL("./editor.js", import.meta.url).href;

/** Loads (and registers) the <character-editor> custom element; returns the class. */
export async function loadCharacterEditor() {
  const mod = await import(/* @vite-ignore */ editorUrl());
  return mod.default;
}

/**
 * Opens the character editor in a full-screen overlay. Returns { element, close }.
 * opts.character preselects a character by name.
 */
export async function openCharacterEditor(opts = {}) {
  await loadCharacterEditor();
  const overlay = document.createElement("div");
  overlay.style.cssText =
    "position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,.72);" +
    "display:flex;align-items:center;justify-content:center;padding:24px;";
  const element = document.createElement("character-editor");
  if (opts.character) element.setAttribute("character", opts.character);
  if (opts.db) element.setAttribute("db", opts.db);
  element.style.cssText = "width:min(1080px,100%);height:min(720px,100%);";
  overlay.appendChild(element);
  const close = () => overlay.remove();
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) close();
  });
  element.addEventListener("close", close);
  (opts.target || document.body).appendChild(overlay);
  return { element, close };
}
