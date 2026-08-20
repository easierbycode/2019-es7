<script>
  // Generic character component: <Character name="red_dress_killer" x={240} y={300} />
  //
  // Must be mounted inside a scene context — either 5velte-ph4ser's <Scene>,
  // or an adopted running scene (see Adopt.svelte). Fetches its record + atlas
  // from the characters database, installs the texture/animations once per
  // game, then keeps the sprite in sync with props.
  import { onDestroy } from "svelte";
  import { getScene } from "5velte-ph4ser";
  import { ensureCharacterAssets, whenSceneReady } from "./runtime.js";

  let {
    name,
    x = 0,
    y = 0,
    animation = "idle",
    play = true,
    scale = undefined,
    scaleX = undefined,
    scaleY = undefined,
    depth = undefined,
    alpha = undefined,
    angle = undefined,
    flipX = false,
    flipY = false,
    tint = undefined,
    visible = true,
    originX = undefined,
    originY = undefined,
    onready = undefined,
    onerror = undefined,
  } = $props();

  const scene = getScene();
  if (!scene) {
    throw new Error(
      `<${name || "Character"}> needs a Phaser scene context — mount it inside ` +
        `<Game><Scene> (5velte-ph4ser) or <Adopt scene={...}>`,
    );
  }

  let sprite = $state(null);
  let assets = $state(null);
  let destroyed = false;

  whenSceneReady(scene)
    .then(() => ensureCharacterAssets(scene, name))
    .then((a) => {
      if (destroyed) return;
      assets = a;
      sprite = scene.add.sprite(x, y, a.textureKey, a.firstFrame);
      onready?.({ sprite, data: a.data, animations: a.animKeys });
    })
    .catch((e) => {
      console.error(`[characters] <${name}> failed to load:`, e);
      onerror?.(e);
    });

  $effect(() => {
    if (!sprite) return;
    sprite.x = x;
    sprite.y = y;
  });
  $effect(() => {
    if (!sprite) return;
    if (scale !== undefined) sprite.setScale(scale);
    else if (scaleX !== undefined || scaleY !== undefined) {
      sprite.setScale(scaleX ?? 1, scaleY ?? 1);
    }
  });
  $effect(() => {
    if (!sprite) return;
    sprite.setFlip(flipX, flipY);
    sprite.setVisible(visible);
    if (depth !== undefined) sprite.setDepth(depth);
    if (alpha !== undefined) sprite.setAlpha(alpha);
    if (angle !== undefined) sprite.setAngle(angle);
    if (tint !== undefined) sprite.setTint(tint);
    else sprite.clearTint();
    if (originX !== undefined || originY !== undefined) {
      sprite.setOrigin(originX ?? 0.5, originY ?? 0.5);
    }
  });
  $effect(() => {
    if (!sprite || !assets) return;
    const key = assets.animKeys[animation] || assets.animKeys.idle;
    if (play && key) sprite.play(key, true);
    else if (!play && sprite.anims) sprite.stop();
  });

  onDestroy(() => {
    destroyed = true;
    sprite?.destroy();
  });
</script>
