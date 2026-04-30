<script lang="ts">
  // Live list of enemyData / bossData entries from RTDB.
  // Each entry links to the editor route.
  import { onMount, onDestroy } from "svelte";
  import { getDB, ref, onValue } from "../lib/firebase.ts";

  interface Props {
    gameKey: string;
    rootPath?: "enemyData" | "bossData";
  }

  let { gameKey, rootPath = "enemyData" }: Props = $props();

  // deno-lint-ignore no-explicit-any
  let entries: Array<[string, any]> = $state([]);
  let loading = $state(true);
  let error: string | null = $state(null);
  let unsub: (() => void) | null = null;

  onMount(() => {
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
    {#each entries as [id, data] (id)}
      <a class="list-item" href={detailRoute(id)}>
        <div class="title">{id}</div>
        <div class="meta">
          {data?.name ?? "—"}
          {#if typeof data?.hp === "number"} · hp {data.hp}{/if}
          {#if typeof data?.score === "number"} · {data.score}pt{/if}
        </div>
      </a>
    {/each}
  </div>
{/if}
