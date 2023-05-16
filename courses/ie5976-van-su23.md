---
layout: course
categories: courses
maintitle: <b>P</b>ython for <b>OO</b>P and <b>A</b>pplied <b>M</b>achine <b>L</b>earning
class: course
title: IE5976 • Summer 2023 • Northeastern University • Vancouver
image: neu.png
nav: IE5976
description: IE5976 is designed for those with little or no Python programming experience, and it is filled with concise, easy-to-understand examples that will help you learn quickly and effectively. Throughout this comprehensive guide, we'll cover a wide range of topics, including data types, control structures, functions, and more. 
---

IE5976 is an individual instruction designed for those with little or no Python programming experience, and it is filled with concise, easy-to-understand examples that will help you learn quickly and effectively. Throughout this comprehensive guide, we'll cover a wide range of topics, including data types, control structures, functions, and more. 

***


- **Class:** Wednesday, 09:00 AM - 12:00 PM (PT) 
- **Office hour:** During the class meeting time
- **Location:** RM 1425, West Georgia or via Zoom
- **Dates:** 05/08/2023 – 06/21/2023
- **Course notes:** [Python Notebook from Zero to Advanced](https://zhenyuanlu.com/python-notebook/){:target="\_blank"}
- **Teaching style:** [There's no speed limit](https://sive.rs/kimo){:target="\_blank"}.
- **Guidelines**: 
  - Please see the post [How to ask a good question](https://stackoverflow.com/help/how-to-ask) before posting any questions or discussions.
  - How to properly cite references in you HWs [Purdue OWL Research and Citation Resources](https://owl.purdue.edu/owl/research_and_citation/resources.html).

***

<!-- Staff  -->
<div class="instructors clearfix">
  {% for instructor in site.data.staff_van_su23.instructor %}
  <div class="instructor-profile-two-col">
    <a href="{{ instructor.url }}" target="_blank"><img src="{{ instructor.image | prepend: '/assets/img/' | relative_url }}" /></a>
    <ul class="instructor-info">
      <li><span>{{ instructor.title }}</span> <a href="{{ instructor.url }}" target="_blank">{{ instructor.name }}</a></li>
      <li><span>Email:</span>
        <a href="mailto:{{ instructor.email | encode_email }}" target="_blank">
        <i class="far fa-envelope" aria-hidden="true"></i>
        </a></li>
        <li><span>Office hours:</span> {{ instructor.office-hours }}</li>
    </ul>
  </div>
  {% endfor %}
</div>





***

<b>Table of contents</b>

* (The list will be replaced with the table of contents.)
{:toc}

***


### Textbooks

The course notebook is based on the following textbooks:
- (WIP) [Python Notebook from Zero to Advanced](https://zhenyuanlu.com/python-notebook/){:target="\_blank"} (**PyNote**) by Zhenyuan Lu.
- [Official Python documentation](https://docs.python.org/3/tutorial/)



***
### Schedule
(subject to change)

{% include schedule.html %}

***


*This course does not have any quizzes, and exams.*
