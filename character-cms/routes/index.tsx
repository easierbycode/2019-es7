import SvelteIsland from "../islands/SvelteIsland.tsx";

export default function Home() {
  return (
    <section class="editor-page">
      <h1>Characters</h1>
      <p class="hint">
        Live grid of <code>games/evil-invaders</code> — every player, enemy,
        and boss with auto-playing frame animations. Click a card to edit.
      </p>
      <SvelteIsland
        name="CharacterGrid"
        props={{ gameKey: "evil-invaders" }}
      />
    </section>
  );
}
