<script lang="ts">
  // Home page grid — shows every character (player, enemies, bosses) as a
  // small animated thumbnail. Each thumbnail loops its `texture[]` frames at
  // ~8 fps with a staggered start delay so the grid pulses instead of
  // flashing in lockstep.
  //
  // Click a card to jump to its editor route.

  import { onDestroy, onMount } from "svelte";
  import { getDB, onValue, ref as fbRef } from "../lib/firebase.ts";
  import { type Atlas, loadAtlas } from "../lib/atlas.ts";
  import FrameLoop from "./FrameLoop.svelte";

  interface Props {
    gameKey: string;
    atlasKey?: string;
  }

  let { gameKey, atlasKey = "game_asset" }: Props = $props();

  type Kind = "player" | "enemy" | "boss";
  interface Card {
    id: string;
    kind: Kind;
    href: string;
    name: string;
    frames: string[];
    delayMs: number;
    // deno-lint-ignore no-explicit-any
    data: any;
  }

  let cards: Card[] = $state([]);
  let atlas: Atlas | null = $state(null);
  let atlasError: string | null = $state(null);
  let loading = $state(true);

  let unsubs: Array<() => void> = [];

  // deno-lint-ignore no-explicit-any
  function frameList(d: any): string[] {
    return Array.isArray(d?.texture) ? d.texture : [];
  }

  function rebuild(
    // deno-lint-ignore no-explicit-any
    player: any,
    // deno-lint-ignore no-explicit-any
    enemies: Record<string, any> | null,
    // deno-lint-ignore no-explicit-any
    bosses: Record<string, any> | null,
  ) {
    const out: Card[] = [];
    let i = 0;
    if (player) {
      out.push({
        id: "player",
        kind: "player",
        href: "/players",
        name: player.name ?? "Player",
        frames: frameList(player),
        delayMs: i++ * 140,
        data: player,
      });
    }
    if (enemies && typeof enemies === "object") {
      for (const [id, d] of Object.entries(enemies)) {
        out.push({
          id,
          kind: "enemy",
          href: `/enemies/${id}`,
          name: d?.name ?? id,
          frames: frameList(d),
          delayMs: i++ * 140,
          data: d,
        });
      }
    }
    if (bosses && typeof bosses === "object") {
      for (const [id, d] of Object.entries(bosses)) {
        out.push({
          id,
          kind: "boss",
          href: `/bosses/${id}`,
          name: d?.name ?? id,
          frames: frameList(d),
          delayMs: i++ * 140,
          data: d,
        });
      }
    }
    cards = out;
  }

  onMount(() => {
    const db = getDB();

    // deno-lint-ignore no-explicit-any
    let player: any = null;
    // deno-lint-ignore no-explicit-any
    let enemies: Record<string, any> | null = null;
    // deno-lint-ignore no-explicit-any
    let bosses: Record<string, any> | null = null;

    const refresh = () => rebuild(player, enemies, bosses);

    unsubs.push(onValue(fbRef(db, `games/${gameKey}/playerData`), (s) => {
      player = s.val();
      refresh();
      loading = false;
    }));
    unsubs.push(onValue(fbRef(db, `games/${gameKey}/enemyData`), (s) => {
      enemies = s.val();
      refresh();
    }));
    unsubs.push(onValue(fbRef(db, `games/${gameKey}/bossData`), (s) => {
      bosses = s.val();
      refresh();
    }));

    loadAtlas(atlasKey, gameKey)
      .then((a) => {
        if (a) atlas = a;
        else atlasError = `Atlas "${atlasKey}" not found.`;
      })
      .catch((e) => atlasError = String((e as Error).message ?? e));
  });

  onDestroy(() => { for (const u of unsubs) u(); });
</script>

<section class="grid-page">
  {#if atlasError}
    <div class="error-box">{atlasError}</div>
  {/if}
  {#if loading && !cards.length}
    <p class="hint">Loading characters from <code>games/{gameKey}</code>…</p>
  {:else if !cards.length}
    <p class="hint">
      No data at <code>games/{gameKey}</code>. Run
      <code>deno task seed</code> to import from <code>assets/game.json</code>.
    </p>
  {:else}
    <div class="char-grid">
      {#each cards as card (card.kind + ":" + card.id)}
        <a class="char-card kind-{card.kind}" href={card.href}>
          <FrameLoop {atlas} frames={card.frames} delayMs={card.delayMs} />
          <div class="card-meta">
            <div class="card-name">{card.name}</div>
            <div class="card-id">{card.kind} · {card.id}</div>
          </div>
        </a>
      {/each}
    </div>
  {/if}
</section>

<style>
  .grid-page { padding: 0; }
  .char-grid {
    display: grid; gap: 12px;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  }
  .char-card {
    display: flex; flex-direction: column; gap: 8px;
    padding: 12px;
    background: var(--bg-2, #15171c);
    border: 1px solid var(--line, #2a2e38);
    border-radius: 8px;
    color: inherit; text-decoration: none;
    transition: border-color 120ms, transform 120ms;
  }
  .char-card:hover { border-color: var(--accent, #6cf); transform: translateY(-1px); }
  .char-card.kind-player { border-left: 3px solid #6bd66b; }
  .char-card.kind-boss   { border-left: 3px solid #ff6b6b; }
  .card-meta { display: flex; flex-direction: column; gap: 2px; }
  .card-name { font-weight: 600; font-size: 13px; }
  .card-id { color: var(--muted, #8a8f9c); font-size: 11px; }
</style>

