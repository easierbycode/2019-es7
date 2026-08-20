<script>
  // The 2028.Ai title screen with red_dress_killer standing in it — the
  // characters-module version of the scene-script demo, as a public page
  // (../demo-title.html). Recreates PhaserTitleScene's final layout
  // (src/phaser/TitleScene.js) from the game's own deployed assets, with the
  // character imported from the library. START opens the real game.
  import * as chars from "./browser.js";
  const { Game, Scene, Sprite, TileSprite, Rectangle, Text } = chars;

  const W = 256, H = 480;

  function preload(scene) {
    // The exact art the cmg 2028-ai build titles with: its level's custom
    // title background plus frames from the /atlases/2028_game_ui override,
    // packed into ./assets/ (see the meta block in title_ui_2028.json).
    scene.load.image("title_bg", "./assets/title_bg_2028.png");
    scene.load.atlas("title_ui", "./assets/title_ui_2028.png", "./assets/title_ui_2028.json");
  }

  // START text flashing, like the real title's startFlashing().
  let startVisible = $state(true);
  $effect(() => {
    const t = setInterval(() => (startVisible = !startVisible), 500);
    return () => clearInterval(t);
  });

  const startGame = () => {
    location.href = "../phaser-game.html?lowmode=1";
  };
</script>

<Game width={W} height={H} parent="app" backgroundColor="#000000" pixelArt={true}>
  <Scene key="title" {preload}>
    {#snippet loading(progress)}
      <Text x={128} y={240} originX={0.5} originY={0.5} color="#9ca3af" fontSize={12}
        text={`loading ${Math.round(progress * 100)}%`} />
    {/snippet}

    <Sprite texture="title_bg" x={0} y={0} originX={0} originY={0} scale={256 / 768} />
    <Sprite texture="title_ui" frame="titleG" x={5} y={20} originX={0} originY={0} />

    <chars.red_dress_killer x={120} y={220} scale={0.6} />

    <Sprite texture="title_ui" frame="logo" x={128} y={75} />
    <Sprite texture="title_ui" frame="subTitleEn" x={128} y={130} />

    <Rectangle x={0} y={360} originX={0} originY={0} width={W} height={120} fillColor={0x000000} />

    <Sprite texture="title_ui" frame="titleStartText" x={128} y={330}
      visible={startVisible} interactive={true} onpointerup={startGame} />

    <Text x={32} y={366} text="WORLD BEST" color="#ffffff" stroke="#000000"
      strokeThickness={2} fontFamily="Arial" fontSize={11} fontStyle="bold" />
    <Sprite texture="title_ui" frame="hiScoreTxt" x={32} y={382} originX={0} originY={0} />
    <Text x={110} y={389} originY={0.5} text="0" color="#ffffff" stroke="#000000"
      strokeThickness={2} fontFamily="Arial" fontSize={16} fontStyle="bold" />
    <Text x={32} y={404} text="WORLD BEST STANDBY" color="#9be37f" stroke="#000000"
      strokeThickness={2} fontFamily="Arial" fontSize={8} fontStyle="bold" />

    <Sprite texture="title_ui" frame="twitterBtn0" x={128} y={428} />
    <Sprite texture="title_ui" frame="titleCopyright" x={0} y={440} originX={0} originY={0} />

    <Sprite texture="title_ui" frame="howtoBtn0" x={15} y={10} originX={0} originY={0} />
    <Sprite texture="title_ui" frame="staffrollBtn0" x={241} y={10} originX={1} originY={0} />
  </Scene>
</Game>
