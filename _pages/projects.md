---
layout: page
permalink: /projects/
title: Projects and Educational Tutorials
class: projects
nav: Posts
---

{:.lead}
For work, school, or fun.

<div class="grid">
  {% for project in site.posts %}
    {% include project.html project=project %}
  {% endfor %}
</div>
