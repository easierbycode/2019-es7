// Seed RTDB from the existing assets/game.json.
//
// Usage:
//   cd character-cms
//   deno run -A scripts/seed-from-game-json.ts \
//     --game evil-invaders \
//     --src ../assets/game.json
//
// Pushes:
//   /games/<game>/playerData
//   /games/<game>/enemyData
//   /games/<game>/bossData

import { firebaseConfig } from "../lib/firebase.ts";

interface Args {
  game: string;
  src: string;
}

function parseArgs(): Args {
  const out: Partial<Args> = { game: "evil-invaders", src: "../assets/game.json" };
  for (let i = 0; i < Deno.args.length; i++) {
    const a = Deno.args[i];
    if (a === "--game") out.game = Deno.args[++i];
    else if (a === "--src") out.src = Deno.args[++i];
  }
  return out as Args;
}

async function putRTDB(path: string, value: unknown) {
  const url = `${firebaseConfig.databaseURL}/${path}.json`;
  const res = await fetch(url, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(value),
  });
  if (!res.ok) {
    throw new Error(`PUT ${path} -> ${res.status} ${await res.text()}`);
  }
}

async function main() {
  const { game, src } = parseArgs();
  const text = await Deno.readTextFile(src);
  const gameJson = JSON.parse(text);
  const tasks: Array<[string, unknown]> = [];
  if (gameJson.playerData) tasks.push([`games/${game}/playerData`, gameJson.playerData]);
  if (gameJson.enemyData)  tasks.push([`games/${game}/enemyData`, gameJson.enemyData]);
  if (gameJson.bossData)   tasks.push([`games/${game}/bossData`, gameJson.bossData]);

  console.log(`Seeding ${tasks.length} paths into ${firebaseConfig.databaseURL}…`);
  for (const [path, val] of tasks) {
    await putRTDB(path, val);
    console.log(`  ✓ ${path}`);
  }
  console.log("done.");
}

await main();
