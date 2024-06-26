---
layout: course
categories: courses
maintitle: <b>C</b>omputation and <b>V</b>isualization for <b>A</b>nalytics
class: course
title: IE6600 • Fall 2020 • Northeastern University • Boston
description: IE6600 covers basic of the R, and R Shiny for data preprocessing, and visualization. It introduces students to static and interactive visualization, dashboard, and platform that reveal information, patterns, interactions, and comparisons by paying attention to details such as color encoding, a shape selection, spatial layout, and annotation.
image: neu.png
nav: IE6600
---

This course covers basic of the R, and R Shiny for data preprocessing, and visualization. It introduces students to static and interactive visualization, dashboard, and platform that reveal information, patterns, interactions, and comparisons by paying attention to details such as color encoding, a shape selection, spatial layout, and annotation. Based on these fundamentals of analytical and creative thinking, the course then focuses on data visualization techniques and the use of the most current popular software tools that support data exploration, analytics-based storytelling and knowledge discovery, and decision-making in engineering, healthcare operations, manufacturing, and related applications.

***

- **Class:** Tue, Fri 08:30am – 10:10am (ET)
- **Location:** Online via Zoom
- **Dates:** 09/11/2020 – 12/11/2020
- **Administration:** Class/HW/project questions, discussion or assignments will be only posted via Piazza (sign up link see slides or directly through Canvas).
- **HW submission:** [Canvas](https://canvas.northeastern.edu/){:target="\_blank"}
- **Online lectures:** The lectures will be live-streamed through Zoom.
- **Teaching style:** [There’s no speed limit](https://sive.rs/kimo){:target="\_blank"}.

***

<!-- Staff  -->
<div class="instructors clearfix">
  {% for instructor in site.data.staff_bos_fa20.instructor %}
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

<!-- Guest  -->
<div class="instructors clearfix">
  {% for instructor in site.data.staff_bos_fa20.guest %}
  <div class="instructor-profile-two-col">
    <a href="{{ instructor.url }}" target="_blank"><img src="{{ instructor.image | prepend: '/assets/img/' | relative_url }}" /></a>
    <ul class="instructor-info">
      <li><span>{{ instructor.title }}</span> </li>
      <li><a href="{{ instructor.url }}" target="_blank">{{ instructor.name }}</a></li>
      <li><span>Title:</span> {{ instructor.title2 }}</li>
      <li><span>Expertise:</span> {{ instructor.expertise }}</li>
    </ul>
  </div>
  {% endfor %}
</div>

***

#### Table of contents
* (The list will be replaced with the table of contents.)
{:toc}

***
### Course goals
<div>
  <img src='/assets/img/ie6600/goal.png' alt='Course Goals' style="max-width:100%;">
</div>
R For Data Science, Wickham, Hadley, and Garrett Grolemund

***

### Textbooks

The required textbook:
- [R For Data Science](https://r4ds.had.co.nz/){:target="\_blank"} (**R4DS**), Wickham, Hadley, and Garrett Grolemund

The required tutorials:
- [Shiny tutorial](https://shiny.rstudio.com/tutorial/){:target="\_blank"}, R Shiny
- [Tableau Public Knowledge Base](http://kb.tableau.com/){:target="\_blank"}, Tableau
- [Tableau Public training videos](http://www.tableausoftware.com/public/training), Tableau.

Additional textbooks:
- [R For Everyone](https://onesearch.library.northeastern.edu/permalink/f/365rt0/NEU_ALMA51284955070001401){:target="\_blank"} (**R4E**), Lander, Jared P.
- [R Markdown](https://bookdown.org/yihui/rmarkdown/){:target="\_blank"} (**RMD**), Xie, Yihui, et al.

***

### R-related Materials

- [R Graphics Cookbook](https://r-graphics.org/){:target="\_blank"} (**RGC**), Chang, Winston.
- [Advanced R](http://adv-r.had.co.nz/){:target="\_blank"} (**ADR**), Wickham, Hadley.
- [R Packages](http://r-pkgs.had.co.nz/){:target="\_blank"}  (**RPK**), Wickham, Hadley.
- [Text Mining with R](https://www.tidytextmining.com/){:target="\_blank"} (**TM**), Silge, Julia, and David Robinson.

***

### Policies

Please post questions, or discussion only via Piazza. The visibility of questions and discussion are expected to set for public view (**to the Entire class on Piazza**). Please feel free to send instructor/TAs emails regarding any personal or other private issues/concerns.

Plagiarism, cheating, and any form of unauthorized collaboration will not be tolerated and will be handled in accordance with University policies described in the Student Handbook. For additional information on Northeastern University’s [Academic Integrity Policy](http://www.northeastern.edu/osccr/academic-integrity-policy/){:target="\_blank"}

***

### Accommodations for Students with Disabilities

If you have a disability, I encourage you to contact [Disability Resource Center](http://www.northeastern.edu/drc/about-the-drc/){:target="\_blank"} to register and request the accommodations. Also please discuss your needs with me as early in the semester as possible.

***

### Take care of yourself

Eating healthy food, having regular exercises, avoiding alcohol and drugs, getting adequate sleep and taking time to relax. This will help you achieve your goals and tame stress.

If you have difficulty to keep up with any materials or homework for personal reasons please let me know early. If you or your friends/classmates who appears to be struggling, or having trouble coping with stress. We strongly encourage you to seek support at the [We Care](https://studentlife.northeastern.edu/we-care/){:target="\_blank"} program at NEU. At Northeastern, a student is never alone when struggling with a demanding situation.

***
### homework
There are 6 individual homework assignments. Due day will be posted with the homework. Late submission would not be accepted. Please let me know 72 hours in advance before the due day if you need extensions with a reasonable justification.
Requests for regrades in writing will only be accepted no less than 10 days after receiving grade. Please send the instructor your NUID, and name with title “Request for regrade: HW+number” via email. The new grade may be lower than the original one.

Please feel free to refer to any materials from my slides. You may discuss homework with your classmates, but all the assignments are supposed to completed by your own. Sharing of completed solutions will not be tolerated. Plagiarism will be considered, if solutions and project documentations with a very high degree of similarity with other student’s or materials online. Such academic dishonesty will be handled in accordance with university policies.

***
### Projects
More details will be posted later in the semester.



***

### Course Evaluation

- Homework **42%**
-	Final Project **50%**
    - Proposal	10%
    - Presentation	40%
-	Class Participation	**8%**

*This course does not have any quizzes or exams.*

***



### Schedule


(subject to change)

{% include schedule.html %}
