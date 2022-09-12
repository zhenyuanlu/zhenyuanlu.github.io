---
layout: page
permalink: /
title: "Zhenyuan Lu"
class: home
---

<div class="columns" markdown="1">
<div class="intro" markdown="1">
## Zhenyuan Lu

Hi! I'm a PhD candidate and research fellow at [Northeastern University](https://www.northeastern.edu/). In order to prepare graduate students for their work on research projects, and future careers, I also create and instruct graduate-level courses in [IE7275 data mining]({{ "/ie7275-bos-sm20/" | relative_url }}) and [IE6600 Computation and Visualization for Analytics]({{ "/ie6600-bos-fa20/" | relative_url }}).


<!-- Using background and experience working in Biomedical sciences and data science fields over the last 10 years. I weave healthcare and machine learning concepts together. Prior to NEU, I worked as a research scientist with biotech and personal care companies and helped holds patents on disease diagnosis and healthcare inventions funded by the government and institutions.

I am actively contributing to open source projects on creating user-friendly R-shiny app and machine learning implementations. When I am not at work, I am a photographer with my own studio taking photos included but not limited to human-beings, driver-only road trips, etc. -->

<p>
<span class="social-buttons">
  <span class="item">
    <!-- <a href="mailto:{{ site.email }}" target="_blank">
      <i class="fas fa-envelope"></i>
    </a> -->
    <a href="https://github.com/zhenyuanlu" target="_blank">
      <i class="fab fa-github"></i>
    </a>
    <a href="https://www.linkedin.com/in/zhenyuanlu/" target="_blank">
      <i class="fab fa-linkedin-in"></i>
    </a>
  </span>
</span>

<!--
<span style="float: right">
  <a href="{{ '/cv/' | relative_url }}" target="_blank">
    <i class="far fa-file-pdf"></i>
    <b>CV</b>
  </a>
</span>-->

</p>
</div>

<div class="me" markdown="1">
<picture>
  <img src='/assets/img/staff/z.jpg'
    alt='Zhenyuan Lu'/>
</picture>
</div>
</div>


## Teaching

- <a href="https://zhenyuanlu.com/r-comput-viz-notes/" target="_blank">Instructor Notes</a> for IE6600 Computation and Visualization for Analytics


<!-- <img src='https://raw.githubusercontent.com/tidyverse/tidyverse/main/man/figures/logo.png' align="right" height="55.5"/>
<img src='https://raw.githubusercontent.com/rstudio/shiny/main/man/figures/logo.png' align="right" height="55.5"/>
<img src='https://raw.githubusercontent.com/rstudio/rmarkdown/main/man/figures/logo.png' align="right" height="55.5"/> -->

- Instructor, IE6600 Computation and Visualization for Analytics
  - [Fall 22]({{ "/ie6600-vbc-fa22/" | relative_url}}), [Summer 22]({{ "/ie6600-bos-su22/" | relative_url}}), [Spring 22]({{ "/ie6600-sea-sp22/" | relative_url}}), [Fall 21]({{ "/ie6600-bos-fa21/" | relative_url}}), [Summer 21]({{ "/ie6600-bos-sm21/" | relative_url}}), [Spring 21]({{ "/ie6600-sea-sp21/" | relative_url}}), [Fall 20]({{ "/ie6600-bos-fa20/" | relative_url}}), Spring 20, Spring 19

<!-- <img src='https://torch.mlverse.org/css/images/hex/torch.png' align="right" height="55.5"/>
<img src='https://torch.mlverse.org/css/images/hex/torchvision.png' align="right" height="55.5"/> -->
<!-- <img src='https://keras.io/img/logo.png' align="right" height="50.5"/> -->

- Instructor, IE7275 Data Mining in Engineering
  - [Summer 20]({{ "/ie7275-bos-sm20/" | relative_url }})


- Graduate Instructor Assistant, BIO1421 Modern Biology
  - Fall 2014-Spring 2017, Superviosr <a href="https://www.bio.txstate.edu/about/Faculty---Staff/faculty/David-Lemke/Lemke-lab.html" target="_blank">Prof. David E. Lemke</a>


<br>



## Projects
For work, research, or fun.

<div class="featured-projects">

<!-- sort highlight descending and date ascending -->
  {% assign projects = site.posts | sort: 'highlight' | sort: 'date' | reverse %}
  {% for project in projects %}
    {% if project.highlight and project.categories contains "projects" %}
      {% include project.html project=project %}
    {% endif %}
  {% endfor %}
</div>
<br>

<!-- <a href="{{ "/projects/" | relative_url }}" class="button">
  <i class="fas fa-chevron-circle-right"></i>
  Show More Projects
</a> -->



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



<br>
