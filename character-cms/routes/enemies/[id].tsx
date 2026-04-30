import type { PageProps } from "fresh";
import SvelteIsland from "../../islands/SvelteIsland.tsx";

export default function EnemyEditPage({ params }: PageProps) {
  const id = String(params.id ?? "");
  return (
    <section class="editor-page">
      <h1>Enemy: {id}</h1>
      <p class="hint">
        Editing <code>games/evil-invaders/enemyData/{id}</code>.
      </p>
      <SvelteIsland
        name="CharacterEditor"
        props={{ kind: "enemy", gameKey: "evil-invaders", entryKey: id }}
      />
    </section>
  );
}
