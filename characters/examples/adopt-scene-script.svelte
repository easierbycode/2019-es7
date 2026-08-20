<script>
  // cmg scene-script example: put a library character into the running game.
  //
  // Try it on any cmg game page:
  //   ?titleScript=https://easierbycode.com/2019-es7/characters/examples/adopt-scene-script.svelte
  //
  // The bare import below is rewritten by cmg's scene-script compiler to the
  // module's browser build. character("name") resolves at mount time, so it
  // works for characters created after the module was last built — no
  // rebuild or redeploy needed.
  import { Adopt, character } from "https://easierbycode.com/2019-es7/characters";

  const RedDress = character("red_dress_killer");
  let { ctx } = $props();
</script>

<Adopt scene={ctx.scene}>
  <RedDress x={120} y={220} scale={0.6} depth={9999} />
</Adopt>
