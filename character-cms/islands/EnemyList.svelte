<script lang="ts">
  // Live list of enemyData / bossData entries from RTDB.
  // Each entry links to the editor route.
  import { onMount, onDestroy } from "svelte";
  import { getDB, ref, onValue } from "../lib/firebase.ts";
  import { type Atlas, loadAtlas } from "../lib/atlas.ts";
  import { spriteFrames } from "../lib/character.ts";
  import FrameLoop from "./FrameLoop.svelte";

  interface Props {
    gameKey: string;
    rootPath?: "enemyData" | "bossData";
    atlasKey?: string;
  }

  let { gameKey, rootPath = "enemyData", atlasKey = "game_asset" }: Props =
    $props();

  let atlas: Atlas | null = $state(null);

  // deno-lint-ignore no-explicit-any
  let entries: Array<[string, any]> = $state([]);
  let loading = $state(true);
  let error: string | null = $state(null);
  let unsub: (() => void) | null = null;

  onMount(() => {
    // A missing atlas only costs the thumbnails, so failure stays silent here —
    // the editor pages report it properly.
    loadAtlas(atlasKey, gameKey).then((a) => { atlas = a; }).catch(() => {});
    try {
      const db = getDB();
      const r = ref(db, `games/${gameKey}/${rootPath}`);
      unsub = onValue(
        r,
        (snap) => {
          loading = false;
          const v = snap.val();
          entries = v && typeof v === "object" ? Object.entries(v) : [];
        },
        (err) => {
          loading = false;
          error = String((err as Error).message ?? err);
        },
      );
    } catch (e) {
      loading = false;
      error = String((e as Error).message ?? e);
    }
  });

  onDestroy(() => { if (unsub) unsub(); });

  const detailRoute = (id: string) =>
    rootPath === "bossData" ? `/bosses/${id}` : `/enemies/${id}`;
</script>

{#if error}
  <div class="error-box">Error loading {rootPath}: {error}</div>
{:else if loading}
  <p class="hint">Loading…</p>
{:else if entries.length === 0}
  <p class="hint">
    No entries at <code>games/{gameKey}/{rootPath}</code>. Use the seed
    script to import from <code>assets/game.json</code>.
  </p>
{:else}
  <div class="list-grid">
    {#each entries as [id, data], i (id)}
      <a class="list-item" href={detailRoute(id)}>
        <FrameLoop
          {atlas}
          frames={spriteFrames(data)}
          delayMs={i * 140}
          size={72}
        />
        <div>
          <div class="title">{id}</div>
          <div class="meta">
            {data?.name ?? "—"}
            {#if typeof data?.hp === "number"} · hp {data.hp}{/if}
            {#if typeof data?.score === "number"} · {data.score}pt{/if}
          </div>
        </div>
      </a>
    {/each}
  </div>
{/if}

<style>
  /* Thumbnail beside the label; the shared .list-item only sets the frame. */
  .list-grid :global(.list-item) {
    display: flex; align-items: center; gap: 12px;
  }
</style>
