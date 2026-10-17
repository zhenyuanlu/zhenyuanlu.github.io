# zhenyuanlu.com

The personal site of Zhenyuan Lu, at [zhenyuanlu.com](https://zhenyuanlu.com): five doors on one road (build, teach,
see, blog and race), the words drawn in pixel letters, and a fader that takes every page from day to dusk to night.

[![Deploy the site to GitHub Pages](https://github.com/zhenyuanlu/zhenyuanlu.github.io/actions/workflows/deploy.yml/badge.svg)](https://github.com/zhenyuanlu/zhenyuanlu.github.io/actions/workflows/deploy.yml)
[![astro 7.4](https://img.shields.io/badge/astro-7.4-1b1b1b?style=flat-square&labelColor=666666)](package.json)
[![node 24](https://img.shields.io/badge/node-24-1b1b1b?style=flat-square&labelColor=666666)](.nvmrc)
[![license MIT](https://img.shields.io/badge/license-MIT-1b1b1b?style=flat-square&labelColor=666666)](LICENSE)

![The home: the fader at the top right dragged from day through dusk to night, then the sun pressed for day again](.github/readme/fader.gif)

<p>
  <img src=".github/readme/build.png" width="48%" alt="build by day: the featured paper and the software shelf">
  <img src=".github/readme/blog.png" width="50%" alt="The blog's list by day, its topics over it">
  <br>
  <img src=".github/readme/article.png" width="64.5%" alt="An article at dusk: a formula, the contents beside the text, a citation's card under the pointer">
  <img src=".github/readme/see.webp" width="33.5%" alt="see's wall at dusk: the road trip photographs">
  <br>
  <img src=".github/readme/race.png" width="49%" alt="race at night: the season's races on a map of the highways">
  <img src=".github/readme/home-night.png" width="49%" alt="The home at night">
</p>

By day, build and the blog; at dusk, an article and see; at night, race and the home.

Half a second's rest on the name splits it into its syllables, the pinyin over each and the hanzi under.

![The name in hand: zhen, yuan and lu part, zhèn yuān lù over them and 振渊陆 under them](.github/readme/name.gif)

On race, a race pinned sends the little figure along the season's highways to it, and its scene and card come in.

![race: flushing pinned, the figure walks from Boston to it and its dragon boat comes in; boston pinned, he walks home](.github/readme/race-pin.gif)

## Run it

With Node 24, as in `.nvmrc`:

```sh
npm ci          # the first time
npm run dev     # localhost:4321
npm run check   # before a commit
```

`npm run dev` shows the drafts too and reloads as you save; `npm run check` runs astro check, a clean build, then the
checks of its links, HTML, CSP and speed budget.

## Write a post

```sh
npm run new:post "The post's title"
```

It writes `content/blog/<slug>/index.md` from `scripts/templates/post.md`, as a draft. The slug is the title in lower
case, its words joined by hyphens: it is the post's address, `/blog/<slug>/`, and it stays once the post is out. Put
the post's pictures beside it, run `npm run dev`, and set `draft: false` when it is ready.

## More

Everything else (where the content lives, pictures, citations, the old addresses, the speed budget, the deploy) is in
[DEVELOPMENT.md](DEVELOPMENT.md). The design, from the light to the pixel art, is in [DESIGN.md](DESIGN.md).

## License

[MIT](LICENSE).
