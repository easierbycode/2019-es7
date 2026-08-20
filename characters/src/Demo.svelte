<script>
  // Demo for the characters module: import characters, drop them in a
  // 5velte-ph4ser scene. Compiled to ../demo.js, rendered by ../demo.html;
  // it imports the real published module (./browser.js) so the demo
  // exercises exactly what consumers use.
  //
  // Note: Svelte parses lowercase tags as HTML elements, so a lowercase
  // component like red_dress_killer is used via dot notation
  // (<chars.red_dress_killer/>) or a Capitalized alias.
  import * as chars from "./browser.js";
  const { Game, Scene, Text } = chars;

  let status = $state("loading characters from the library…");
  let ready = 0;
  const loaded = (name) => () => {
    ready++;
    status = `${ready}/3 loaded (${name} ready)`;
    if (ready === 3) status = "red_dress_killer, weirdo & dukeNukem — live from /characters";
  };
  const failed = (e) => (status = `load failed: ${e.message || e}`);
</script>

<Game width={480} height={640} parent="app" backgroundColor="#0b0b12">
  <Scene key="characters">
    <Text x={12} y={10} text={"import { red_dress_killer } from"} color="#9ca3af" fontSize={13} />
    <Text x={12} y={28} text="'https://easierbycode.com/2019-es7/characters'" color="#84cc16" fontSize={13} />
    <Text x={12} y={606} text={status} color="#e5e7eb" fontSize={12} />

    <chars.red_dress_killer x={130} y={300} onready={loaded("red_dress_killer")} onerror={failed} />
    <chars.weirdo x={350} y={300} onready={loaded("weirdo")} onerror={failed} />
    <chars.dukeNukem x={240} y={500} scale={2} onready={loaded("dukeNukem")} onerror={failed} />
  </Scene>
</Game>
