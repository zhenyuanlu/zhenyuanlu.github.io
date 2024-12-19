---
layout: blog_page
type: blog
title: "Complete Blog Post Template with All Features"
description: "A comprehensive template showing all available features including Distill components, citations, math equations, and interactive elements"

author: "Author Name"
date: 2024-01-01
last_modified_at: 2024-01-15

tags:
  - "Template"
  - "Documentation"
  - "Features"
highlight: 1

hide: false
toc: true

thumbnail: "/assets/images/thumbnails/template.png"
image: "/assets/images/blog/template/cover.webp"
links:
  - type: pdf
    href: "https://example.com/paper.pdf"
  - type: arxiv
    href: "https://arxiv.org/abs/xxxx.xxxxx"
  - type: github
    href: "https://github.com/username/repo"
  - type: bibtex
    href: |
      @article{example2024,
        title={Example Paper Title},
        author={Author, A. and Author, B.},
        journal={Journal Name},
        year={2024}
      }
      
bibliography: 2022-10-06-clVR.bib
---

# Introduction

This template demonstrates all available features for blog posts. Let's start with some basic text and formatting.

## Text Formatting

You can use standard markdown formatting like **bold**, *italic*, and `code`. You can also use [links](https://example.com).

## Mathematical Equations

Inline equations use single dollar signs: $e^{i\pi} + 1 = 0$

Display equations use double dollar signs:

$$
\frac{\partial f}{\partial x} = \lim_{h \to 0} \frac{f(x + h) - f(x)}{h}
$$

## Citations and References

You can cite papers using Distill's citation format<d-cite key="example2024"></d-cite>. Multiple citations work too<d-cite key="paper1,paper2"></d-cite>.

## Footnotes

You can add footnotes to provide additional context<d-footnote>This is a footnote with more detailed information.</d-footnote>.

## Interactive Definitions

Technical terms can have hover definitions using span elements:

<span 
  class="border-b border-dotted border-gray-400 cursor-help"
  @mouseenter="activeDefinition = 'technical-term'"
  @mouseleave="activeDefinition = null"
>
technical term
</span>

## Code Blocks

```python
def example_function():
    """Example function with syntax highlighting"""
    return "Hello World"
```

## Figures and Images

<div class="w-full">
  <figure>
    <img src="{{ '/assets/images/example.png' | relative_url }}" alt="Example figure" />
    <figcaption>
      Example figure with caption and citation<d-cite key="figure-paper"></d-cite>
    </figcaption>
  </figure>
</div>

## Custom Components

### Sidenotes

<div class="relative">
  This text has a sidenote attached to it
  <span class="absolute -right-64 top-0 w-48 pl-4 text-sm text-gray-500 border-l border-gray-200">
    This is a sidenote providing additional context
  </span>
</div>

### Info Boxes

<div class="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg my-4">
  <div class="flex items-start gap-3">
    <i data-lucide="info" class="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5"></i>
    <div class="text-sm text-blue-900 dark:text-blue-100">
      This is an info box for important information or tips.
    </div>
  </div>
</div>

## Tables

| Column 1 | Column 2 | Column 3 |
|----------|----------|----------|
| Value 1  | Value 2  | Value 3  |
| Value 4  | Value 5  | Value 6  |

## Interactive Elements

<div x-data="{ showMore: false }" class="my-4">
  <button
    @click="showMore = !showMore"
    class="px-4 py-2 rounded-lg text-sm transition-colors"
    :class="darkMode ? 'bg-gray-800 hover:bg-gray-700 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-900'"
  >
    <span x-text="showMore ? 'Show Less' : 'Show More'"></span>
  </button>
  
  <div
    x-show="showMore"
    x-transition
    class="mt-4 p-4 rounded-lg"
    :class="darkMode ? 'bg-gray-800' : 'bg-gray-50'"
  >
    Additional content that can be toggled.
  </div>
</div>

# References

The bibliography will be automatically generated here.
# Introduction {#introduction}

This introduction discusses <span class="definition" data-term="self-supervised">self-supervised</span> learning and <span class="definition" data-term="contrastive">contrastive</span> learning.  
We have a citation here: <sup class="citation" data-ref="1">[1]</sup>  
A footnote here: <sup class="footnote" data-fn="1">[1]</sup>

A sidenote example:  
<span class="sidenote-trigger relative">This sentence has a sidenote.
  <span class="sidenote absolute -right-64 top-0 w-48 pl-4 text-sm text-gray-500 border-l border-gray-200">
    This is a sidenote content.
  </span>
</span>
