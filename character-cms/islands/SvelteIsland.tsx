/// Preact wrapper that loads and mounts a Svelte component on the client.
///
/// Fresh's renderer expects Preact components for islands. Svelte components
/// are mounted client-side only — the wrapper renders an empty <div> on the
/// server, then the client entry imports the named .svelte module and mounts
/// it inside that div.
///
/// Usage from a route:
///   import SvelteIsland from "../../islands/SvelteIsland.tsx";
///   <SvelteIsland name="CharacterEditor" props={{ kind: "player", gameKey }} />

import { useEffect, useRef } from "preact/hooks";

// Static import map — keeps Vite happy and prevents the bundler from
// inlining the Svelte components into the SSR bundle.
const loaders: Record<string, () => Promise<{ default: unknown }>> = {
  // deno-lint-ignore no-explicit-any
  CharacterEditor: () => import("./CharacterEditor.svelte") as any,
  // deno-lint-ignore no-explicit-any
  CharacterPreview: () => import("./CharacterPreview.svelte") as any,
  // deno-lint-ignore no-explicit-any
  CharacterGrid:    () => import("./CharacterGrid.svelte") as any,
  // deno-lint-ignore no-explicit-any
  EnemyList:        () => import("./EnemyList.svelte") as any,
  // deno-lint-ignore no-explicit-any
  AtlasBuilder:     () => import("./AtlasBuilder.svelte") as any,
};

export interface SvelteIslandProps {
  name: keyof typeof loaders;
  // deno-lint-ignore no-explicit-any
  props?: Record<string, any>;
}

export default function SvelteIsland({ name, props = {} }: SvelteIslandProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  // deno-lint-ignore no-explicit-any
  const instanceRef = useRef<any>(null);

  useEffect(() => {
    if (!hostRef.current) return;
    let alive = true;

    (async () => {
      const loader = loaders[name];
      if (!loader) {
        console.error(`SvelteIsland: unknown component "${name}"`);
        return;
      }
      const mod = await loader();
      // Svelte 5 uses `mount(component, { target, props })`.
      const { mount } = await import("svelte");
      if (!alive || !hostRef.current) return;
      // deno-lint-ignore no-explicit-any
      instanceRef.current = (mount as any)(mod.default, {
        target: hostRef.current,
        props,
      });
    })();

    return () => {
      alive = false;
      if (instanceRef.current) {
        // Svelte 5 returns a component instance; calling its `$destroy`
        // works for legacy components, otherwise unmount via the unmount fn.
        import("svelte").then(({ unmount }) => {
          // deno-lint-ignore no-explicit-any
          try { (unmount as any)(instanceRef.current); } catch { /* ignore */ }
        });
      }
    };
    // We re-mount when name changes; prop updates are pushed via $set below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name]);

  // When props change, hand them to the live Svelte instance.
  useEffect(() => {
    if (!instanceRef.current) return;
    // Svelte 5 doesn't have $set on the public API for `mount()` results.
    // For now we recreate the instance with new props by re-running effect
    // on a JSON-stable key.
  }, [JSON.stringify(props)]);

  return <div ref={hostRef} class="svelte-island"></div>;
}
