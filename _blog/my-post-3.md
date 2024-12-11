---
layout: blog
title: "testtest"
description: "A comprehensive guide on self-supervised learning for medical imaging."
author: "Zhenyuan Lu"
date: 2024-01-15
hide: false
highlight: 1
tags:
  - "Deep Learning"
  - "Medical Imaging"
  - "Self-supervised Learning"
links:
  pdf: "#"
  github: "#"
  slides: "#"
  demo: "#"
image: "/api/placeholder/800/400"
type: "blog"

toc: true
---


Self-supervised learning (SSL) has emerged as a powerful paradigm in medical image analysis, offering a solution to one of the field's biggest challenges: the scarcity of labeled data. This comprehensive guide explores the latest developments in SSL for medical imaging.

Below is a single Markdown file example that demonstrates all the discussed features in one place. You can copy this into a `.md` file in your Jekyll site. Be sure you have:

- Tailwind CSS + typography plugin configured
- MathJax or KaTeX enabled in `head.html`
- D3.js for the interactive animation
- A layout that includes the dark mode toggle and `dark:prose-invert` classes

This example assumes:

- A `layout: blog` which uses the HTML structure discussed before.
- `jekyll-last-modified-at` plugin for `last_modified_at`.
- `site.icon_set` and `site.data.resource_icons` configured as previously described.
- Tailwind typography for styling and dark mode support.

Feel free to adjust URLs, image paths, and code as needed.


# Introduction

In this post, we demonstrate a variety of advanced content and styling techniques that integrate seamlessly with our Tailwind + Alpine.js + Jekyll setup:

- **Math Equations** via MathJax
- **Code Blocks** with syntax highlighting
- **Tables** styled with Tailwind typography
- **Full-bleed images** like in Distill
- **Interactive D3.js visualizations**, including hover effects and animations

All features are possible without Distill, leveraging Tailwind's powerful utility classes and the typography plugin.

## Equations

We can write inline math like \\( f(x) = x^2 \\), and block equations:

$$
E = mc^2
$$

MathJax (or KaTeX) automatically renders these equations nicely in both light and dark modes.

## Tables

Let's show a results table:

| Model               | Accuracy | Notes                |
|---------------------|----------|----------------------|
| Baseline CNN         | 85%      | Trained on small data|
| SSL-Enhanced CNN     | 92%      | Uses self-supervised |
| Transformer-based    | 95%      | Larger model, more data|

This table integrates seamlessly with the Tailwind typography styles, ensuring consistent spacing, borders, and text styling.

## Code Blocks

Below is a Python code snippet demonstrating preprocessing steps for medical images:

```python
import numpy as np

data = np.load('images.npy')
processed = (data - data.mean()) / data.std()
print("Data preprocessed:", processed.shape)
```

## Full-Bleed Image

Sometimes you want an image to exceed the normal content width, creating a "full-bleed" effect similar to Distill. We can achieve this using negative margins:

<div class="full-bleed my-8">
  <img 
    src="/assets/images/z.png"
    alt="Full bleed"
    class="w-full h-auto"
  />
</div>


<div class="relative my-8 w-[200vw] left-1/2 ml-[-50vw]">
  <img 
    src="/assets/images/z.png" 
    alt="A full-bleed diagram"
    class="w-full h-auto"
  />
</div>

*Figure: A full-bleed diagram extending beyond the main text column.*

This leverages the site’s responsive padding and expands the image edge-to-edge.

## Interactive Animated Visualization (D3.js)

Below is a D3.js-based visualization. It displays circles that respond to hover and click. On hover, circles grow and change color; on click, they move to a new random position with a smooth animated transition.

<div id="interactiveViz" class="my-8" style="width:100%; max-width:600px; height:300px; margin:0 auto;"></div>

<script src="https://d3js.org/d3.v7.min.js"></script>
<script>
document.addEventListener('DOMContentLoaded', function() {
  const width = 600;
  const height = 300;
  
  const svg = d3.select('#interactiveViz')
    .append('svg')
    .attr('width', width)
    .attr('height', height)
    .style('background', '#f9fafb'); // light background

  const data = d3.range(5).map(d => ({
    x: Math.random() * (width - 100) + 50,
    y: Math.random() * (height - 100) + 50,
    r: 20
  }));

  const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

  const circles = svg.selectAll('circle')
    .data(data)
    .enter().append('circle')
    .attr('cx', d => d.x)
    .attr('cy', d => d.y)
    .attr('r', d => d.r)
    .style('fill', (d,i) => colorScale(i))
    .style('cursor', 'pointer');

  // Hover interaction
  circles.on('mouseover', function(event, d) {
      d3.select(this)
        .transition()
        .duration(200)
        .attr('r', d.r * 1.5)
        .style('fill', '#3b82f6');
    })
    .on('mouseout', function(event, d) {
      d3.select(this)
        .transition()
        .duration(200)
        .attr('r', d.r)
        .style('fill', (d, i) => colorScale(i));
    });

  // Click interaction to move circle
  circles.on('click', function(event, d) {
    const newX = Math.random() * (width - 100) + 50;
    const newY = Math.random() * (height - 100) + 50;

    d3.select(this)
      .transition()
      .duration(1000)
      .ease(d3.easeCubicOut)
      .attr('cx', newX)
      .attr('cy', newY);
  });
});
</script>

Try hovering and clicking the circles to see the interaction and animation in action!

## Conclusion

We have:

- Rendered math equations inline and in block form.
- Displayed code blocks, tables, and images (including a full-bleed image).
- Integrated a fully interactive, animated D3.js visualization.

All of this is done using the same Tailwind-based approach, enhanced with the typography plugin, Alpine.js for dark mode and interactive UI elements, and Jekyll’s extensible architecture.

By combining these techniques, you can create compelling, interactive, and beautifully styled technical blog posts, research notes, or tutorials—all without needing Distill or similar templates.
```

---

**What This Template Demonstrates:**

- **Front Matter:** Provides metadata and links that will be rendered as resource buttons (pdf, code, slides, demo).
- **Inline and Block Equations:** Using MathJax or KaTeX included in `head.html`.
- **A Table and a Code Block:** Showcased with standard Markdown.
- **Full-Bleed Image:** Using negative margins and Tailwind classes.
- **Interactive D3 Visualization:** Animations, hover effects, and transitions on circles.
- **Dark Mode Compatibility:** The layout handles this, and `:class="darkMode ? ... : ..."` logic will be in the layout’s HTML, not in this Markdown. The typography plugin applies styling automatically.

You can take this entire Markdown file, place it in your `_posts` or `blog/` directory (depending on your setup), and when built by Jekyll, it will produce a page showcasing all the features described.