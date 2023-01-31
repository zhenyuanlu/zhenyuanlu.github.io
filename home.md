---
layout: page
permalink: /
title: Zhenyuan Lu
class: home
description: Machine learning and PhD research fellow at Northeastern University. Using background and experience working in Biomedical sciences and data science fields over the last 10 years. I weave healthcare and machine learning concepts together.
image: staff/z.jpg
---

<div class="columns" markdown="1">
<div class="intro" markdown="1">
## Zhenyuan Lu

Hi! I am on the market with expected graduation in Summer 2023. I am broadly interested in machine learning, data science/mining, biostats and SDE positions. Currently, I am  a data science instructor and PhD candidate at [Northeastern University](https://www.northeastern.edu/) work with [Prof. Sagar Kamarthi](https://coe.northeastern.edu/people/kamarthi-sagar/).

<!-- In order to prepare graduate students for their work on research projects, and future careers, I also develop and instruct graduate-level courses in [IE7275 data mining]({{ "/courses/ie7275-bos-sm20/" | relative_url }}) and [IE6600 Computation and Visualization for Analytics]({{ "/courses/ie6600-bos-fa20/" | relative_url }}). -->

My PhD story is featured on the [University PhD Network](https://phd.northeastern.edu/profile/zhenyuan-lu/). I also have been spotlighted by the College of Engineering department for the [Student Success Story](https://coe.northeastern.edu/news/ready-for-the-high-demand-field-of-data-analytics/).


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


## Teachings

- (WIP) Python Notebook

<!-- - (WIP) Pytorch Cookbook for Deep learning -->

- <a href="https://zhenyuanlu.com/r-comput-viz/" target="_blank">Data Visualization/Transformation Tutorial in R </a> for IE6600 Computation and Visualization for Analytics


<!-- <img src='https://raw.githubusercontent.com/tidyverse/tidyverse/main/man/figures/logo.png' align="right" height="55.5"/>
<img src='https://raw.githubusercontent.com/rstudio/shiny/main/man/figures/logo.png' align="right" height="55.5"/>
<img src='https://raw.githubusercontent.com/rstudio/rmarkdown/main/man/figures/logo.png' align="right" height="55.5"/> -->

- Instructor, IE6600 Computation and Visualization for Analytics
  - [Spring 23]({{ "/courses/ie6600-sea-sp23/" | relative_url}}), [Fall 22]({{ "/courses/ie6600-vbc-fa22/" | relative_url}}), [Summer 22]({{ "/courses/ie6600-bos-su22/" | relative_url}}), [Spring 22]({{ "/courses/ie6600-sea-sp22/" | relative_url}}), [Fall 21]({{ "/courses/ie6600-bos-fa21/" | relative_url}}), [Summer 21]({{ "/courses/ie6600-bos-sm21/" | relative_url}}), [Spring 21]({{ "/courses/ie6600-sea-sp21/" | relative_url}}), [Fall 20]({{ "/courses/ie6600-bos-fa20/" | relative_url}}), Spring 20, Spring 19

<!-- <img src='https://torch.mlverse.org/css/images/hex/torch.png' align="right" height="55.5"/>
<img src='https://torch.mlverse.org/css/images/hex/torchvision.png' align="right" height="55.5"/> -->
<!-- <img src='https://keras.io/img/logo.png' align="right" height="50.5"/> -->

- Instructor, IE7275 Data Mining in Engineering
  - [Summer 20]({{ "/courses/ie7275-bos-sm20/" | relative_url }})


- Graduate Instructor Assistant, BIO1421 Modern Biology
  - Fall 2014-Spring 2017, Course Supervisor <a href="https://www.bio.txst.edu/faculty-staff/david-lemke.html" target="_blank">Prof. David E. Lemke</a>

<!-- https://www.bio.txstate.edu/about/Faculty---Staff/faculty/David-Lemke/Lemke-lab.html -->


<br>



## Featured Projects
For work, research, or fun.

<div class="featured-projects">

<!-- sort highlight descending and date ascending -->

{% assign posts_grouped = site.posts | group_by: "highlight" | sort: "name" %}
{% for group in posts_grouped %}
{% assign projects = group.items | sort: "date" | reverse %}
  {% for project in projects  %}
    {% if project.hide != true and project.categories contains "projects"  or "publication" %}
        {% include project.html project=project %}
    {% endif %}
  {% endfor %}
{% endfor %}
</div>
<br>
<br>



## Featured Publications
For understanding the difficulty.

<div class="featured-projects">

{% assign pubyears = site.publications | group_by:"year"  %}
{% assign sorted_pubyears = pubyears | reverse %}
{% for year in sorted_pubyears %}
<h3> {{ year.name }} </h3>
  {% for pub in year.items %}
    {% include publications.html pub=pub %}
  {% endfor %}
{% endfor %}
</div>
<br>

<br>

## Field Researches and Teachings at Texas
For involving the world.

<br>

<div class="columns">
    <div class="intro" style="text-align:center;">
    <picture class="life">
    <img src='/assets/img/TXState.png'
      alt='@TXState'/>
    <p><b>
    Special thanks to my teaching advisor <a href="https://www.bio.txst.edu/faculty-staff/david-lemke.html" target="_blank">Dr. David E Lemke</a> <i class="fa-solid fa-dna"></i>; and <a href="https://www.bio.txst.edu/faculty-staff/timothy-bonner.html" target="_blank">Dr. Tim Bonner</a> who taught the BEST <a href="https://www.bio.txst.edu/faculty-staff/timothy-bonner/bonner-lab.html#&gid=1&pid=4" target="_blank">Ichthyology</a> <i class="fa-solid fa-fish"></i>.</b>
    </p>
    </picture>
    </div>
</div>


