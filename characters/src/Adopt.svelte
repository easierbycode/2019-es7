<script>
  // Adopts an already-running Phaser game/scene as svelte-phaser context, so
  // character components can be used from cmg scene scripts (which receive a
  // `ctx` with the live scene) without creating a second <Game>:
  //
  //   <Adopt scene={ctx.scene}>
  //     <red_dress_killer x={240} y={300} />
  //   </Adopt>
  import { setContext } from "svelte";
  import { GAME_CONTEXT_KEY, SCENE_CONTEXT_KEY } from "5velte-ph4ser";

  let { scene, game = undefined, children } = $props();

  setContext(GAME_CONTEXT_KEY, game ?? scene?.game);
  setContext(SCENE_CONTEXT_KEY, scene);
</script>

{@render children?.()}
