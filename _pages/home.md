---
layout: page
permalink: /
title: "Hi, I'm Zhenyuan Lu"
class: home
---

<div class="columns" markdown="1">

<div class="intro" markdown="1">
I am a data science instructor and PhD student in the [Department of Mechanical & Industrial Engineering](https://mie.northeastern.edu/) of the [College of Engineering](https://coe.northeastern.edu/) at [Northeastern University](https://www.northeastern.edu/), where I am working with [Prof. Sagar Kamarthi](https://coe.northeastern.edu/people/kamarthi-sagar/) on machine learning in healthcare and disease diagnostics. I also design and teach the graduate course [IE6600 Computation and Visualization for Analytics]({{ "/ie6600/" | relative_url }}) to prepare graduate students doing research, team projects and future career.

I am actively contributing to open source projects on creating user-friendly R-shiny app and machine learning implementations. When I am not at work, I am a photographer with my own studio taking photos included but not limited to human-beings, driver-only road trips, etc.

<p>
<span class="social-buttons">
  <span class="item">
    <a href="mailto:{{ site.email }}" target="_blank">
      <i class="fas fa-envelope"></i>
    </a>
    <a href="https://github.com/zhenyuanlu" target="_blank">
      <i class="fab fa-github"></i>
    </a>
    <a href="https://www.linkedin.com/in/zhenyuanlu/" target="_blank">
      <i class="fab fa-linkedin-in"></i>
    </a>
  </span>
</span>

<span style="float: right">
  <a href="{{ '/cv/' | relative_url }}" target="_blank">
    <i class="far fa-file-pdf"></i>
    <b>CV</b>
  </a>
</span>
</p>

<img src="/assets/img/home.png" style="visibility:hidden;" />

</div>

<div class="me" markdown="1">
<picture>

  <img src='/assets/img/staff/z.jpg'
    alt='Zhenyuan Lu'/>
</picture>



</div>

</div>



## Projects

<div class="featured-projects">

  {% assign sorted_projects = site.posts | sort: 'highlight' %}
  {% for project in sorted_projects%}
    {% if project.highlight and project.categories contains "projects" %}
      {% include project.html project=project %}
    {% endif %}
  {% endfor %}
</div>
<a href="{{ "/projects/" | relative_url }}" class="button">
  <i class="fas fa-chevron-circle-right"></i>
  Show More Projects
</a>

<!--## Tutorials

<div class="featured-tutorials">
  {% assign sorted_projects = site.posts | sort: 'highlight' %}
  {% for project in sorted_projects %}
    {% if project.highlight and project.categories contains "tutorials" %}
      {% include project.html project=project %}
    {% endif %}
  {% endfor %}
</div>
<a href="{{ "/projects/" | relative_url }}" class="button">
  <i class="fas fa-chevron-circle-right"></i>
  Show More Tutorials
</a>-->


<!--## Professional Experience
<div id="experience-section" class="tabbed-section">
  {% include experience.html %}
</div>-->


## Publications
<div class="pubs">
{% assign pubyears = site.publications | group_by:"year"  %}
{% assign sorted_pubyears = pubyears | reverse %}
{% for year in sorted_pubyears %}
{{ year.name }}

{% for pub in year.items %}
  {% include publication.html pub=pub %}
{% endfor %}
{% endfor %}
</div>
