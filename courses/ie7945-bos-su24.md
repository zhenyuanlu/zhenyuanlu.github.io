---
layout: course
categories: courses
maintitle: <b>A</b>rtificial <b>I</b>ntellegence / <b>M</b>achine <b>L</b>earning <b>M</b>aster's <b>P</b>roject
class: course
title: IE7945 • Summer 2024 • Northeastern University • Boston
image: neu.png
nav: IE7945
description: 
---

IE7945 offers theoretical or experimental work under individual faculty supervision.

***

<!-- Staff  -->
<div class="instructors clearfix">
  {% for instructor in site.data.staff_van_su23.instructor %}
  <div class="instructor-profile-two-col">
    <a href="{{ instructor.url }}" target="_blank"><img src="{{ instructor.image | prepend: '/assets/img/' | relative_url }}" /></a>
    <ul class="instructor-info">
      <li><span>{{ instructor.title }}:</span> <a href="{{ instructor.url }}" target="_blank">{{ instructor.name }}</a></li>
      <li><span>Email:</span>
        <a href="mailto:{{ instructor.email | encode_email }}" target="_blank">
        <i class="far fa-envelope" aria-hidden="true"></i>
        </a></li>
        <li><span>Office hours:</span> {{ instructor.office-hours }}</li>
    </ul>
  </div>
  {% endfor %}
</div>


- **Office hour:** [Schedule online](https://outlook.office365.com/owa/calendar/IE7945AIMLMastersProject@northeastern.onmicrosoft.com/bookings/){:target="\_blank"}.
- **Location:** Online
- **Dates:** 
  - 05/13/2024 – 06/24/2024 (Summer I)
  - 05/13/2024 – 08/27/2024 (Summer Full)
- **Teaching style:** [There's no speed limit](https://sive.rs/kimo){:target="\_blank"}.
- **Guidelines**: 
  - Please see the post [How to ask a good question](https://stackoverflow.com/help/how-to-ask) before posting any questions or discussions.
  - How to properly cite references in you HWs [Purdue OWL Research and Citation Resources](https://owl.purdue.edu/owl/research_and_citation/resources.html).




<!-- 
***

<b>Table of contents</b>

* (The list will be replaced with the table of contents.)
{:toc}

***



***
### Schedule
(subject to change)

{% include schedule.html %}

*** -->


<!-- *This course does not have any quizzes, and exams.* -->
