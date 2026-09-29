const paths: Record<string, string> = {
  bolt: '<path d="m13 2-9 12h7l-1 8 10-13h-7l1-7Z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/>',
  drop: '<path d="M12 2S5 10 5 15a7 7 0 0 0 14 0c0-5-7-13-7-13Z"/><path d="M8 15a4 4 0 0 0 4 4"/>',
  skull: '<path d="M8 20v-4a7 7 0 1 1 8 0v4H8Z"/><circle cx="9" cy="10" r="1"/><circle cx="15" cy="10" r="1"/><path d="M12 17v3m-1-6h2"/>',
  flame: '<path d="M13 2c1 6-5 7-4 12-2-1-3-3-3-3-5 8 2 12 6 11 6 0 10-7 5-12 0 3-2 4-2 4 1-5-2-12-2-12Z"/>',
  leaf: '<path d="M20 3C9 2 3 7 4 14c1 6 7 8 11 4 4-4 4-9 5-15Z"/><path d="m3 22 12-13M8 17v-5m0 5h6"/>',
  diamond: '<path d="m12 2 10 10-10 10L2 12 10 2Z" transform="translate(1 0) scale(.92 1)"/>',
  land: '<path d="m2 19 7-12 5 8 3-5 5 9H2Z"/><path d="m7 11 2 2 2-2"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  undo: '<path d="M3 10h11a6 6 0 0 1 0 12" transform="translate(0 -3)"/><path d="m7 3-4 4 4 4"/>',
  arrow: '<path d="M4 12h16m-6-6 6 6-6 6"/>',
  clear: '<path d="M4 6h16M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7m4-7v7"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10v.1"/>',
  close: '<path d="m6 6 12 12M6 18 18 6"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  download: '<path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>',
  reset: '<path d="M3 11a9 9 0 1 1 2 7M3 4v7h7"/>',
};

export function icon(name: string, className = ''): string {
  return `<svg class="icon ${className}" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] ?? paths.diamond}</svg>`;
}
