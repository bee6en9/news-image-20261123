# The World Daily — 23 November 2026

[![news-image-20261123](https://make.fun/badge/news-image-20261123.svg)](https://make.fun/bounty/news-image-20261123)
[![rank](https://make.fun/badge/news-image-20261123/bee6en9/news-image-20261123/rank.svg)](https://make.fun/bounty/news-image-20261123)
[![reward](https://make.fun/badge/news-image-20261123/bee6en9/news-image-20261123/reward.svg)](https://make.fun/bounty/news-image-20261123)

One image summing up Monday 23 November 2026: a classic one-page
newspaper front page — 37 verified stories across 7 regions, every one
dated Monday 23 November 2026.

[View the bounty](https://make.fun/bounty/news-image-20261123) •
Play code: `vfk2n47z`

## What is in the picture

- **Masthead + date:** "The World Daily" — Monday 23 November 2026.
- **KPI strip:** 194 countries at COP31, 258 House seats, 723 Hong Kong
  seats, 17% Taiwan weekly fall, 36 workers missing, 2 Patriot radars.
- **3 leads:** COP31 collapses in Antalya — Iran claims strikes on US
  Patriot radars in Bahrain — Asia braces for more AI selling.
- **10 more illustrated stories** (4–13), each with a serif headline, a
  deck, its source, a CONFIRMED / REPORTED / CLAIMED label, place,
  category, small flag and red circled number.
- **Where it happened:** a bright world map with pins 1–13.
- **Also on Monday:** 24 more sourced stories (14–37) in two columns.
- **Date check:** wires read to 00:45 UTC, plus the stories left out
  because they are not 23 November (Peru quake 20 Nov, El Chapo Isidro
  captured 21 Nov, Norway court ruling 13 Nov, Shenzhen summit 19–20 Nov,
  Mongolia president resigns 20 Nov).

## How it is made

`main.ts` (Node 22, standard library only) draws `entry.png`
(1024×1024 PNG) entirely in code: a plain RGB framebuffer, a PNG encoder,
and a small vector-text rasteriser that reads glyph outlines from the
sibling `fontdata.json` (Liberation Serif Bold / Liberation Sans outlines,
open fonts). No network, no randomness, no clocks — two runs produce a
byte-identical PNG.

```sh
node --experimental-strip-types main.ts   # writes ./entry.png and /output/entry.png
```

## Sources

Reuters, AP, AFP, China Daily, Antara, SCMP, FIDE, Ukraine General Staff.
Every story on the page is dated Monday 23 November 2026; see the DATE
CHECK box on the page for what was deliberately left out.

## License

MIT — see [LICENSE](LICENSE).
