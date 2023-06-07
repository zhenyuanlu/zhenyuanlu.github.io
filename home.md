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

Hi! I am a data science instructor and PhD candidate at [Northeastern University](https://www.northeastern.edu/) work with Prof. [Sagar Kamarthi](https://coe.northeastern.edu/people/kamarthi-sagar/). My research interests are deep learning, representation learning, self-supervised learning, biomedical sensory data, healthcare data and sequential Data. My PhD story is featured on the [University PhD Network](https://phd.northeastern.edu/profile/zhenyuan-lu/). I also have been spotlighted by the College of Engineering department for the [Student Success Story](https://coe.northeastern.edu/news/ready-for-the-high-demand-field-of-data-analytics/).

<!-- In order to prepare graduate students for their work on research projects, and future careers, I also develop and instruct graduate-level courses in [IE7275 data mining]({{ "/courses/ie7275-bos-sm20/" | relative_url }}) and [IE6600 Computation and Visualization for Analytics]({{ "/courses/ie6600-bos-fa20/" | relative_url }}). -->
<!-- Research interests: Deep Learning, Representation Learning, Physiological Signals. -->

<!-- Using background and experience working in Biomedical sciences and data science fields over the last 10 years. I weave healthcare and machine learning concepts together. Prior to NEU, I worked as a research scientist with biotech and personal care companies and helped holds patents on disease diagnosis and healthcare inventions funded by the government and institutions.

I also actively contribute to open-source projects, focusing on R/Python tutorials, data viz, and machine learning. Outside of work, I am a passionate photographer with my own studio, capturing a diverse range of subjects including portrait, scenic road trips, etc. -->

<p>
<span class="social-buttons">
  <span class="item">
    <a href="https://github.com/zhenyuanlu" target="_blank">
      <i class="fab fa-github"></i>
    </a>
    <a href="https://www.linkedin.com/in/zhenyuanlu/" target="_blank">
      <i class="fab fa-linkedin-in"></i>
    </a>
    <a href="mailto:{{ site.email }}" target="_blank">
      <i class="fas fa-envelope"></i>
    </a>
    <a href="https://twitter.com/zyl_zhen" target="_blank">
      <i class="fab fa-twitter"></i>
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
  <img src='/assets/img/staff/z.png'
    alt='Zhenyuan Lu'/>
</picture>
</div>

</div>



## Teachings/Tutorials 

For sharing the joy of what I have learnt.

<div class="columns" markdown="1">
<div class="intro" markdown="1">

- Tutorials/Books
<!-- - (WIP) Pytorch Cookbook for Deep learning --> 
  - (WIP) <a href = "https://zhenyuanlu.com/python-notebook/"> Python Notebook from Zero to Advanced </a>
<img src='https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/PyCharm_Icon.svg/512px-PyCharm_Icon.svg.png?20200803065702' align="center" height="20"/>
<img src='https://raw.githubusercontent.com/numpy/numpy/17bae7c3f53d757144403ae09897e32f91a31d74/branding/logo/logomark/numpylogoicon.svg' align="center" height="20"/>
  - <a href="https://zhenyuanlu.com/r-comput-viz/" target="_blank">Data Visualization/Transformation Tutorial in R </a> 
  <img src='https://raw.githubusercontent.com/tidyverse/tidyverse/main/man/figures/logo.png' align="center" height="20"/>
  <img src='https://raw.githubusercontent.com/rstudio/shiny/main/man/figures/logo.png' align="center" height="20"/>
  <img src='https://raw.githubusercontent.com/rstudio/rmarkdown/main/man/figures/logo.png' align="center" height="20"/>
- Instructor, IE5976 Python for Object-Oriented Programming: [Summer 23]({{ "/courses/ie5976-van-su23/" | relative_url}})
- Instructor, IE6600 Computation and Visualization for Analytics
  - [Spring 23]({{ "/courses/ie6600-sea-sp23/" | relative_url}}), [Fall 22]({{ "/courses/ie6600-vbc-fa22/" | relative_url}}), [Summer 22]({{ "/courses/ie6600-bos-su22/" | relative_url}}), [Spring 22]({{ "/courses/ie6600-sea-sp22/" | relative_url}}), [Fall 21]({{ "/courses/ie6600-bos-fa21/" | relative_url}}), [Summer 21]({{ "/courses/ie6600-bos-sm21/" | relative_url}}), [Spring 21]({{ "/courses/ie6600-sea-sp21/" | relative_url}}), [Fall 20]({{ "/courses/ie6600-bos-fa20/" | relative_url}}), Spring 20, Spring 19
<!-- <img src='https://torch.mlverse.org/css/images/hex/torch.png' align="right" height="55.5"/>
<img src='https://torch.mlverse.org/css/images/hex/torchvision.png' align="right" height="55.5"/> -->
<!-- <img src='https://keras.io/img/logo.png' align="right" height="50.5"/> -->
- Instructor, IE7275 Data Mining in Engineering: [Summer 20]({{ "/courses/ie7275-bos-sm20/" | relative_url }})
- Graduate Instructor Assistant, BIO1421 Modern Biology
  - Fall 2014-Spring 2017, Course Supervisor <a href="https://www.bio.txst.edu/faculty-staff/david-lemke.html" target="_blank">Prof. David E. Lemke</a>

<!-- - <b>I received numerous emails from my students asking about what constitutes a good graduate program. I'd like to share with you some insightful words from [Dr. Yiqing Xu](https://yiqingxu.org/) of Stanford University:</b>
  - <i>"The criteria for evaluating a good graduate program is how much time is spent on the continuous accumulation of knowledge and skills (during which the learning curve can be linear or even exponential) and how much time is spent on simple repetitive tasks that do not lead to the improvement of knowledge and skills."</i> -->

</div>
</div>

<p style="line-height:25px;margin:0px;"><br></p>

## Selected Publications
For understanding the difficulty.

<div class="featured-projects">
{% assign pubyears = site.publications | group_by:"year" %}
{% assign sorted_pubyears = pubyears | sort: 'name' | reverse %}

{% for year_group in sorted_pubyears %}
  {% assign year = year_group.name %}
  {% assign publications = year_group.items %}
  
  {% assign display_year = false %}
  {% for pub in publications %}
    {% if pub.hide != true %}
      {% if display_year == false %}
        <h3>{{ year }}</h3>
        {% assign display_year = true %}
      {% endif %}
      {% include publications.html pub=pub %}
    {% endif %}
  {% endfor %}
{% endfor %}


</div>

<p style="line-height:25px;margin:0px;"><br></p>


## Featured Projects/Blogs
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

<p style="line-height:25px;margin:0px;"><br></p>


## Field Researches and Teachings at Texas <img src='/assets/img/tx.png' width="20" height="20" alt='TXmap'/>
For involving the world.

<p style="line-height:20px;margin:0px;"><br></p>


<div class="columns">
    <div class="intro" style="text-align:center;">
    <picture class="life">
    <img src='/assets/img/TXState.webp' width="500" alt='@TXState'/>
    <p><b>
    Special thanks to my teaching advisor <a href="https://www.bio.txst.edu/faculty-staff/david-lemke.html" target="_blank">Dr. David E Lemke</a> <i class="fa-solid fa-dna"></i>; and <a href="https://www.bio.txst.edu/faculty-staff/timothy-bonner.html" target="_blank">Dr. Tim Bonner</a> who taught the BEST <a href="https://www.bio.txst.edu/faculty-staff/timothy-bonner/bonner-lab.html#&gid=1&pid=4" target="_blank">Ichthyology</a> <i class="fa-solid fa-fish"></i>.</b>
    </p>
    </picture>
    </div>
</div>

