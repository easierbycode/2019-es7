import SvelteIsland from "../../islands/SvelteIsland.tsx";

export default function EnemiesPage() {
  return (
    <section class="editor-page">
      <h1>Enemies</h1>
      <p class="hint">
        Live list of <code>games/evil-invaders/enemyData</code>. Click an
        enemy to edit it.
      </p>
      <SvelteIsland
        name="EnemyList"
        props={{ gameKey: "evil-invaders" }}
      />
    </section>
  );
}
