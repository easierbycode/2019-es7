<script lang="ts">
  // Live JSON editor + preview for a single character entry in RTDB.
  //
  // The character data path is derived from props:
  //   kind="player"  -> games/<gameKey>/playerData
  //   kind="enemy"   -> games/<gameKey>/enemyData/<entryKey>
  //   kind="boss"    -> games/<gameKey>/bossData/<entryKey>
  //
  // RTDB is the source of truth. Edits are debounced (~600ms) before save,
  // but the preview re-renders synchronously on every keystroke against the
  // local parsed JSON. Remote changes (other tabs, other devices) hot-reload
  // here too via onValue.

  import { onMount, onDestroy } from "svelte";
  import { getDB, ref, onValue, set as fbSet } from "../lib/firebase.ts";
  import CharacterPreview from "./CharacterPreview.svelte";

  interface Props {
    kind: "player" | "enemy" | "boss";
    gameKey: string;
    entryKey?: string;
    rootPath?: string; // override path segment (e.g. "bossData")
  }

  let { kind, gameKey, entryKey, rootPath }: Props = $props();

  function dbPath(): string {
    const root = rootPath ?? (
      kind === "player" ? "playerData"
      : kind === "boss" ? "bossData"
      : "enemyData"
    );
    if (kind === "player") return `games/${gameKey}/${root}`;
    return `games/${gameKey}/${root}/${entryKey}`;
  }

  // deno-lint-ignore no-explicit-any
  let remoteData: any = $state(null);
  let textValue = $state("");
  // deno-lint-ignore no-explicit-any
  let parsedValue: any = $state(null);
  let parseError: string | null = $state(null);
  let saveStatus: "idle" | "dirty" | "saving" | "saved" | "error" = $state("idle");
  let saveError: string | null = $state(null);

  let editorEl: HTMLDivElement | null = $state(null);
  // deno-lint-ignore no-explicit-any
  let cmView: any = null;
  // Used to suppress reflowing the editor with our own outgoing change.
  let suppressRemoteApply = false;
  let unsubFB: (() => void) | null = null;
  let saveTimer: number | null = null;

  function setSafe(text: string, fromRemote = false) {
    textValue = text;
    try {
      parsedValue = text.trim() ? JSON.parse(text) : null;
      parseError = null;
    } catch (e) {
      parseError = (e as Error).message;
    }
    if (!fromRemote) saveStatus = "dirty";
  }

  // --- CodeMirror setup ----------------------------------------------------
  async function buildEditor() {
    const [
      { EditorState },
      { EditorView, lineNumbers, keymap, highlightActiveLine },
      { defaultKeymap, history, historyKeymap },
      { json },
      { oneDark },
      { syntaxHighlighting, defaultHighlightStyle, bracketMatching, indentOnInput },
    ] = await Promise.all([
      import("@codemirror/state"),
      import("@codemirror/view"),
      import("@codemirror/commands"),
      import("@codemirror/lang-json"),
      import("@codemirror/theme-one-dark"),
      import("@codemirror/language"),
    ]);

    const updateListener = EditorView.updateListener.of((u) => {
      if (!u.docChanged) return;
      if (suppressRemoteApply) return;
      setSafe(u.state.doc.toString());
      scheduleSave();
    });

    cmView = new EditorView({
      parent: editorEl,
      state: EditorState.create({
        doc: textValue,
        extensions: [
          lineNumbers(),
          highlightActiveLine(),
          history(),
          json(),
          bracketMatching(),
          indentOnInput(),
          syntaxHighlighting(defaultHighlightStyle),
          keymap.of([...defaultKeymap, ...historyKeymap]),
          oneDark,
          updateListener,
          EditorView.theme({
            "&": { fontSize: "13px" },
            ".cm-scroller": { fontFamily: "var(--mono)" },
          }),
        ],
      }),
    });
  }

  function applyRemoteToEditor(text: string) {
    if (!cmView) return;
    if (cmView.state.doc.toString() === text) return;
    suppressRemoteApply = true;
    cmView.dispatch({
      changes: { from: 0, to: cmView.state.doc.length, insert: text },
    });
    suppressRemoteApply = false;
  }

  // --- Save / Load ---------------------------------------------------------
  function scheduleSave() {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(saveNow, 600) as unknown as number;
  }

  async function saveNow() {
    if (parseError) return; // never push invalid JSON
    if (parsedValue == null) return;
    try {
      saveStatus = "saving";
      const db = getDB();
      await fbSet(ref(db, dbPath()), parsedValue);
      saveStatus = "saved";
      saveError = null;
    } catch (e) {
      saveStatus = "error";
      saveError = String((e as Error).message ?? e);
    }
  }

  async function reloadFromRemote() {
    saveStatus = "idle";
    if (cmView && remoteData != null) {
      const text = JSON.stringify(remoteData, null, 2);
      setSafe(text, true);
      applyRemoteToEditor(text);
    }
  }

  function formatJson() {
    try {
      const obj = JSON.parse(textValue);
      const text = JSON.stringify(obj, null, 2);
      setSafe(text);
      applyRemoteToEditor(text);
      scheduleSave();
    } catch {
      // ignore - parseError already shown
    }
  }

  onMount(() => {
    const db = getDB();
    const r = ref(db, dbPath());
    unsubFB = onValue(r, (snap) => {
      const v = snap.val();
      remoteData = v;
      // Only apply remotely if user isn't dirty (prevents overwriting in-flight edits)
      if (saveStatus === "idle" || saveStatus === "saved") {
        const text = v == null ? "" : JSON.stringify(v, null, 2);
        setSafe(text, true);
        applyRemoteToEditor(text);
      }
    });
    buildEditor();
  });

  onDestroy(() => {
    if (saveTimer) clearTimeout(saveTimer);
    if (unsubFB) unsubFB();
    if (cmView) cmView.destroy();
  });
</script>

<div class="split">
  <div class="panel">
    <div class="panel-head">
      <span>JSON · <code>{dbPath()}</code></span>
      <span class="pill {saveStatus === 'saved' ? 'saved' : ''} {saveStatus === 'dirty' || saveStatus === 'saving' ? 'dirty' : ''} {saveStatus === 'error' || parseError ? 'error' : ''}">
        <span class="dot"></span>
        {#if parseError}
          parse error
        {:else if saveStatus === 'saving'}
          saving…
        {:else if saveStatus === 'dirty'}
          unsaved
        {:else if saveStatus === 'saved'}
          saved
        {:else if saveStatus === 'error'}
          save failed
        {:else}
          live
        {/if}
      </span>
    </div>
    <div class="toolbar">
      <button class="btn" onclick={formatJson}>Format</button>
      <button class="btn" onclick={reloadFromRemote}>Revert</button>
      <button class="btn primary" onclick={saveNow} disabled={!!parseError}>Save now</button>
    </div>
    {#if parseError}
      <div class="error-box">Invalid JSON: {parseError}</div>
    {/if}
    {#if saveError}
      <div class="error-box">Save failed: {saveError}</div>
    {/if}
    <div class="panel-body cm-host" bind:this={editorEl}></div>
  </div>

  <div class="panel">
    <div class="panel-head">
      <span>Preview</span>
      <span class="pill"><span class="dot"></span> {kind}{entryKey ? ` · ${entryKey}` : ''}</span>
    </div>
    <div class="panel-body">
      <CharacterPreview
        kind={kind}
        gameKey={gameKey}
        data={parsedValue}
      />
    </div>
  </div>
</div>
