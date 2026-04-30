import type { PageProps } from "fresh";

export default function App({ Component, url }: PageProps) {
  const path = url.pathname;
  const navItem = (href: string, label: string) => (
    <a
      href={href}
      class={`nav-item ${path === href || path.startsWith(href + "/") ? "active" : ""}`}
    >
      {label}
    </a>
  );

  return (
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Evil Invaders — Character CMS</title>
        <link rel="stylesheet" href="/styles.css" />
      </head>
      <body>
        <header class="topbar">
          <div class="brand">
            <span class="brand-mark">EI</span>
            <span class="brand-name">Character CMS</span>
          </div>
          <nav class="nav">
            {navItem("/", "Overview")}
            {navItem("/players", "Players")}
            {navItem("/enemies", "Enemies")}
            {navItem("/bosses", "Bosses")}
            {navItem("/atlas", "Atlas")}
          </nav>
        </header>
        <main class="content">
          <Component />
        </main>
      </body>
    </html>
  );
}
