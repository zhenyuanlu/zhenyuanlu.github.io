---
layout: blog

title: "Test Test"
type: "talk"
description: "A comprehensive guide on self-supervised learning for medical imaging."

author: "Zhenyuan Lu"
date: 2024-01-15

tags:
  - "Deep Learning"
  - "Medical Imaging"
  - "Self-supervised Learning"
highlight: 1

hide: false
toc: true

image: "/assets/images/publications/clVR/cover.webp"
links:
  - type: github
    href: "https://github.com/zhenyuanlu/pyKCN"
  - type: pdf
    href: "#"
  - type: journal
    href: "#"
  - type: arxiv
    href: "#"
---

# Introduction

Welcome to this comprehensive guide. Here we will show how to incorporate various Distill-inspired components into a Jekyll-based blog layout enhanced with Tailwind CSS.

We have a variety of elements to showcase:

- **`d-title`**: Title is set via front matter and injected into `<d-title>` by our layout JavaScript.
- **`d-abstract`**: Abstract is taken from front matter and displayed below the title.
- **`d-article`**: Wraps the main article body (this entire content).
- **`d-math`**: Display mathematical formulas using MathJax.
- **`d-code`**: Code blocks with syntax highlighting.
- **`d-figure`**: Figures with captions.
- **`d-cite`**: Citation references that link to entries in the bibliography.
- **`d-bibliography`**: Displays a reference list at the end of the article.
- **`d-footnote` and d-footnote-list**: Footnotes that appear in the text and collected at the end.
- **`d-citation-list`**: A listing of cited references.
- **`d-byline`**: Author and affiliation information.
- **Animated JS elements**: Embedding JavaScript for interactive/animated content.

<d-math block>
\[
f(x) = \int_0^1 x^2 dx = \frac{1}{3}
\]
</d-math>

Here we used `<d-math>` to display a block equation. Inline math can also be written as \( e^{i\pi} = -1 \).

## Code Example

We can embed code using `<d-code>` tags to highlight specific code snippets. For example, here’s some Python code:

<d-code language="python">
def greet(name: str) -> str:
    return f"Hello, {name}!"

print(greet("World"))
</d-code>

## Figure Example

Images or figures are placed inside `<d-figure>` tags:


  <img src="/assets/images/sample_figure.jpg" alt="Sample Figure">
  <figcaption>
  A sample figure displayed using `<d-figure>`.
  </figcaption>


## Footnotes

You can add footnotes with `<d-footnote>` anywhere. For instance, consider this statement:

Deep learning models often require large amounts of labeled data<d-footnote>This is a common challenge in many real-world machine learning applications.</d-footnote>.

## Citations

We can cite references easily inline. For example, according to <d-cite key="smith2019"></d-cite>, self-supervised learning can reduce labeling requirements. Another reference is <d-cite key="johnson2021"></d-cite>.

Later, we will provide a `<d-bibliography>` section that contains the actual references. The bibliography source can be included as inline BibTeX or loaded from a file. Here we include them inline for demonstration.

## Interactive / Animated JS

We can also include interactive visualizations. For example, let’s say we embed a simple canvas animation:

<d-figure>
  <canvas id="myCanvas" width="600" height="200" class="border border-gray-300"></canvas>
  <figcaption>An animated canvas driven by JavaScript.</figcaption>
</d-figure>

<script>
document.addEventListener("DOMContentLoaded", function() {
  const canvas = document.getElementById('myCanvas');
  const ctx = canvas.getContext('2d');
  let x = 0;
  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'blue';
    ctx.beginPath();
    ctx.arc(x, canvas.height/2, 20, 0, 2*Math.PI);
    ctx.fill();
    x += 2;
    if (x > canvas.width) x = 0;
    requestAnimationFrame(animate);
  }
  animate();
});
</script>

This script will animate a blue circle moving across the canvas. The `<script>` block can be placed directly in the Markdown.

## References and Footnote Lists

At the end of the article, we can provide a full bibliography and footnote lists:

<d-footnote-list></d-footnote-list>

<d-bibliography>
<script type="text/bibtex">
@article{smith2019,
  title={Self-supervised Learning for Medical Imaging},
  author={Smith, John and Doe, Jane},
  journal={Journal of Machine Learning in Health},
  year={2019}
}

@inproceedings{johnson2021,
  title={Reducing Annotations with Contrastive Learning},
  author={Johnson, Chris and Rodriguez, Maria},
  booktitle={NeurIPS},
  year={2021}
}
</script>
</d-bibliography>

<d-citation-list></d-citation-list>

This `<d-bibliography>` block contains the BibTeX references for the citations used above (`smith2019` and `johnson2021`). `<d-citation-list>` may be used to display a processed citation list, depending on your Distill-based integration.
