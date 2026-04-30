import type { PageProps } from "fresh";
import SvelteIsland from "../../islands/SvelteIsland.tsx";

export default function BossEditPage({ params }: PageProps) {
  const id = String(params.id ?? "");
  return (
    <section class="editor-page">
      <h1>Boss: {id}</h1>
      <p class="hint">
        Editing <code>games/evil-invaders/bossData/{id}</code>.
      </p>
      <SvelteIsland
        name="CharacterEditor"
        props={{
          kind: "boss",
          gameKey: "evil-invaders",
          entryKey: id,
          rootPath: "bossData",
        }}
      />
    </section>
  );
}
