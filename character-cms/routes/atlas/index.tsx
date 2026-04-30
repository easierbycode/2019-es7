import SvelteIsland from "../../islands/SvelteIsland.tsx";

export default function AtlasPage() {
  return (
    <section class="editor-page">
      <h1>Atlas Builder</h1>
      <p class="hint">
        Drop a sprite sheet, auto-detect frames, name them, push into an atlas.
        This is a trimmed-down version of{" "}
        <a href="https://easierbycode.com/spriteX/" target="_blank">spriteX</a>
        {" "}
        — the heavy lifting comes from the same library imported via web URL.
      </p>
      <SvelteIsland name="AtlasBuilder" />
    </section>
  );
}
