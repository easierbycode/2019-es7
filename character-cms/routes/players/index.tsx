import SvelteIsland from "../../islands/SvelteIsland.tsx";

export default function PlayersPage() {
  return (
    <section class="editor-page">
      <h1>Player</h1>
      <p class="hint">
        Editing <code>games/evil-invaders/playerData</code>. Saves are
        debounced and pushed to RTDB; the preview hot-reloads on every
        keystroke.
      </p>
      <SvelteIsland
        name="CharacterEditor"
        props={{ kind: "player", gameKey: "evil-invaders" }}
      />
    </section>
  );
}
