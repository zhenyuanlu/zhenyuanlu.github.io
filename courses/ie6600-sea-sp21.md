---
layout: course
categories: courses
maintitle: <b>C</b>omputation and <b>V</b>isualization for <b>A</b>nalytics
class: course
title: IE6600 • Spring 2021 • Northeastern University • Seattle
image: neu.png
nav: IE6600
description: IE6600 covers basic of the R, and R Shiny for data preprocessing, and visualization. It introduces students to static and interactive visualization, dashboard, and platform that reveal information, patterns, interactions, and comparisons by paying attention to details such as color encoding, a shape selection, spatial layout, and annotation.
---

This course covers basic of the R, and R Shiny for data preprocessing, and visualization. It introduces students to static and interactive visualization, dashboard, and platform that reveal information, patterns, interactions, and comparisons by paying attention to details such as color encoding, a shape selection, spatial layout, and annotation. Based on these fundamentals of analytical and creative thinking, the course then focuses on data visualization techniques and the use of the most current popular software tools that support data exploration, analytics-based storytelling and knowledge discovery, and decision-making in engineering, healthcare operations, manufacturing, and related applications.

***

- **Class:** Tuesday 11:00 – 14:00 (PT)
- **Office hour:** Monday 9:00 - 10:00 (PT)
- **Location:**  Room 409, 225 Terry Ave, or Zoom
- **Dates:** 01/19/2021 – 04/27/2021
- **Administration:** Class/HW/project questions, discussion or assignments will be only posted via Piazza (On Canvas).
- **HW submission:** [Canvas](https://canvas.northeastern.edu/){:target="\_blank"}


***

<!-- Staff  -->
<div class="instructors clearfix">
  {% for instructor in site.data.staff_sea_sp21.instructor %}
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

We understand that there will be difficulties or emergencies happened in your daily life. Therefore, each student has a 3-day extension applying on your HW. This extension can only be used once and cannot be separated in usage. If you have decided to use this extension on your current or the future HW, please send an email to our TA, and CC me before the deadline. We are able to mark it on your grade sheet. This won't affect your grade, no worries.

Plagiarism, cheating, and any form of unauthorized collaboration will not be tolerated and will be handled in accordance with University policies described in the Student Handbook. For additional information on Northeastern University’s [Academic Integrity Policy](http://www.northeastern.edu/osccr/academic-integrity-policy/){:target="\_blank"}

***

### Accommodations for Students with Disabilities

If you have a disability, I encourage you to contact [Disability Resource Center](http://www.northeastern.edu/drc/about-the-drc/){:target="\_blank"} to register and request the accommodations. Also please discuss your needs with me as early in the semester as possible.

***

### Take care of yourself

Eating healthy food, having regular exercises, avoiding alcohol and drugs, getting adequate sleep and taking time to relax. This will help you achieve your goals and tame stress.

If you have difficulty to keep up with any materials or homework for personal reasons please let me know early. If you or your friends/classmates who appears to be struggling, or having trouble coping with stress. We strongly encourage you to seek support at the [We Care](https://studentlife.northeastern.edu/we-care/){:target="\_blank"} program at NEU. At Northeastern, a student is never alone when struggling with a demanding situation.


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
