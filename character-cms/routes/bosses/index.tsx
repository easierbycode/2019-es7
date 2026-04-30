import SvelteIsland from "../../islands/SvelteIsland.tsx";

export default function BossesPage() {
  return (
    <section class="editor-page">
      <h1>Bosses</h1>
      <p class="hint">
        Live list of <code>games/evil-invaders/bossData</code>. Bosses use
        tween-based attack patterns — preview them on the edit page.
      </p>
      <SvelteIsland
        name="EnemyList"
        props={{ gameKey: "evil-invaders", rootPath: "bossData" }}
      />
    </section>
  );
}
