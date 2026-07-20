# ps2-sp-demo

Browser demo of the `ps2-sp` vertical shooter (the 2019-es7 PS2 shooter ported
onto the AthenaEnv compatibility layer). It boots Phaser 4, preloads the game's
atlases + JSON, builds the runtime over a Phaser host, and runs the game.

The library is consumed **straight from the published JSR module**
[`@easierbycode/svelte-ps2`](https://jsr.io/@easierbycode/svelte-ps2) — there is
no dependency on a local `../src` or `C:/CODE/5velte-ps2` checkout. The JSR
package is wired in via the `npm:` alias in `package.json` and the `@jsr`
registry line in `.npmrc`.

## Run

```sh
npm install     # pulls @easierbycode/svelte-ps2 from JSR + Phaser 4
npm run dev     # http://localhost:5180
npm run build   # production bundle in dist/
```

Or via the repo's Claude launch config: **ps2-sp-demo** (runs
`vite --config ps2-sp-demo/vite.config.ts` on port 5180).

## URL params

- `?scene=game|adventure|continue|ending` — skip the title screen
- `?level=2028` — swap the Firebase level (default `foo`)

## Controls

`←`/`→` move · `Z` confirm/fire · `X` back · `C` SP attack ·
`Enter` START/pause · `Shift` SELECT (turbo) · `Q`/`E` = L1/R1
