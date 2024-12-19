---
layout: blog_page
type: blog
title: "Exploring Self-Supervised Learning Techniques"
description: "A deep dive into definitions, citations, footnotes, tooltips, sidenotes, and code samples."
author: "Zhenyuan Lu"
date: 2024-01-01
tags:
  - "Deep Learning"
  - "Self-supervised Learning"
toc: true
image: "/assets/images/blog/posts/example/cover.webp"
links:
  - type: pdf
    href: "https://arxiv.org/pdf/2210.03163.pdf"
  - type: bibtex
    href: "@article{example2024, title={An Example Reference}, author={Doe, Jane}, year={2024}}"

bibliography: example.bib
---

# Introduction {#introduction}

Self-supervised learning is a paradigm where <z-tooltip data-text="A method for learning from unlabeled data.">self-supervised</z-tooltip> models learn from unlabeled data. We have seen <z-cite key="exampleRef">[Ref]</z-cite> used extensively in many fields.

Here is a sidenote: <z-sidenote key="sn1">This is additional context shown as a sidenote on hover.</z-sidenote>

A footnote example: <z-fn key="fn1">This is a footnote explaining something in detail.</z-fn>

## Methodology {#methodology}

Some code usage:
<z-code language="python">
model = SelfSupervisedModel(backbone='resnet50', proj_dim=128)
</z-code>

Another citation with multiple references <z-cite key="exampleRef,anotherRef">[Refs]</z-cite> shows that these methods are robust.

## Results {#results}

In conclusion, these methods improve performance <z-fn key="fn2">Results from extensive experiments on ImageNet.</z-fn>.

## Additional Notes

<z-tooltip data-text="A complex concept in ML">Contrastive</z-tooltip> learning is also crucial.

<!-- Footnotes at the bottom -->
<p id="footnote-fn1" class="hidden">Detailed footnote text for fn1.</p>
<p id="footnote-fn2" class="hidden">Detailed footnote text for fn2.</p>
