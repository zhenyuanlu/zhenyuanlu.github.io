---
layout: course
categories: courses
maintitle: <b>C</b>omputation and <b>V</b>isualization for <b>A</b>nalytics
class: course
title: IE6600 • Spring 2023 • Northeastern University • Seattle
image: neu.png
nav: IE6600
description: IE6600 covers basic of the R, and R Shiny for data preprocessing, and visualization. It introduces students to static and interactive visualization, dashboard, and platform that reveal information, patterns, interactions, and comparisons by paying attention to details such as color encoding, a shape selection, spatial layout, and annotation.
---

IE6600 covers basic of the R, and R Shiny for data preprocessing, and visualization. It introduces students to static and interactive visualization, dashboard, and platform that reveal information, patterns, interactions, and comparisons by paying attention to details such as color encoding, a shape selection, spatial layout, and annotation. Based on these fundamentals of analytical and creative thinking, the course then focuses on data visualization techniques and the use of the most current popular software tools that support data exploration, analytics-based storytelling and knowledge discovery, and decision-making in engineering, healthcare operations, manufacturing, and related applications.

***

- **Class:** Tuesday, Friday 09:50 - 11:30 AM (PT)
- **Office hour:** Wed 9:00 AM - 10:00 AM (PT) on Zoom
- **Location:**  TBA
- **Dates:** 01/09/2022 – 04/14/2022
- **Administration platform:** All questions, discussion or notes will be only posted via [Campuswire](https://campuswire.com/){:target="\_blank"}. See sign up link on Canvas.
- **Guideline**: Please see the post [How to ask a good question](https://stackoverflow.com/help/how-to-ask) before posting any questions or discussions.
- **HW submission:** [Canvas](https://canvas.northeastern.edu/){:target="\_blank"}
- **Course notes:** [Notes](https://zhenyuanlu.com/r-comput-viz/){:target="\_blank"}
- **Teaching style:** [There’s no speed limit](https://sive.rs/kimo){:target="\_blank"}.


***

<!-- Staff  -->
<div class="instructors clearfix">
  {% for instructor in site.data.staff_sea_sp23.instructor %}
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

### Table of contents
* (The list will be replaced with the table of contents.)
{:toc}

***
### Course goals

This section of IE6600 follows the [flipped classroom model](https://en.wikipedia.org/wiki/Flipped_classroom){:target="\_blank"}, and delivers all course materials online. The schedule below shows the due dates for all modules.

<figure>
  <img src='/assets/img/ie6600/goal.png' alt='Course Goals' style="max-width:100%;">
<figcaption>
<strong> R For Data Science, Wickham, Hadley, and Garrett Grolemund</strong>.
</figcaption>
</figure>

***

### Textbooks

The required textbook:
- [R For Data Science](https://r4ds.had.co.nz/){:target="\_blank"} (**R4DS**), Wickham, Hadley, and Garrett Grolemund

The required tutorials:
- [Shiny tutorial](https://shiny.rstudio.com/tutorial/){:target="\_blank"}, R Shiny


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
### Schedule
(subject to change)

{% include schedule.html %}

***



### Administration

Please post questions, or discussion only via Canvas. The visibility of questions and discussion are expected to set for public view (**to the Entire class on Canvas**). Please feel free to send instructor/TAs emails regarding any personal or other private issues/concerns.

***

### Homework

There are 6 individual homework assignments. Due day will be posted with the homework. Late submission would not be accepted. Each student has one time 3-day extension per semester only applied on homework. This extension will be applied automatically. Please let me know 24 hours in advance before the due day if any emergencies or difficulties occur.

Requests for regrades in writing will only be accepted no less than 10 days after receiving grade. Please send the instructor your NUID, and name with title “Request for regrade: HW+number” via email. The new grade may be lower than the original one.

Please properly cite any references used in your homework. An overview and summary of how to reference sources can be found at [Purdue OWL Research and Citation Resources](https://owl.purdue.edu/owl/research_and_citation/resources.html).You may discuss homework with your peers, but you must complete all assignments on your own. You can also utilize chatGPT or some other AI systems as a partial reference in your assignment, but you should optimize and enhance your answers rather than simply copying and pasting.


***

### Honor Code

**Plagiarism, cheating, and any form of unauthorized collaboration will not be tolerated, certain work will be marked as zero and will be handled in accordance with university policies described in the Student Handbook.** Sharing of completed solutions will not be tolerated. Plagiarism will be considered, if solutions and project documentations with a very high degree of similarity with other student’s or materials online. Such academic dishonesty will be handled in accordance with university policies. We will report violations to the Office of Student Conduct and Conflict Resolution (OSCCR). For additional information on Northeastern University’s [Academic Integrity Policy](http://www.northeastern.edu/osccr/academic-integrity-policy/){:target="\_blank"}.

***

### Title IX

Northeastern University strictly prohibits discrimination or harassment on the basis of race, color, religion, religious creed, genetic information, sex, gender identity, sexual orientation, age, national origin, ancestry, veteran, or disability status. Please review [Northeastern’s Title IX policy](https://www.northeastern.edu/ouec/){:target="\_blank"}, which protects individuals from sex or gender-based discrimination, including discrimination based on gender-identity. Faculty members are required to report all allegations of sex/gender-based discrimination to the Title IX coordinator.

***

### Accommodations for Students with Disabilities

If you have a disability, I encourage you to contact [Disability Resource Center](http://www.northeastern.edu/drc/about-the-drc/){:target="\_blank"} to register and request the accommodations. Also please discuss your needs with me as early in the semester as possible.

***

### Take care of yourself

Eating healthy food, having regular exercises, avoiding alcohol and drugs, getting adequate sleep and taking time to relax. This will help you achieve your goals and tame stress.

If you have difficulty to keep up with any materials or homework for personal reasons please let me know early. If you or your friends/classmates who appears to be struggling, or having trouble coping with stress. We strongly encourage you to seek support at the [We Care](https://studentlife.northeastern.edu/we-care/){:target="\_blank"} program at NEU. At Northeastern, a student is never alone when struggling with a demanding situation.


***

### Projects
More details will be posted later in the semester.
- <b>Project Example</b>: 
- <a href="https://yuchengqiu96.shinyapps.io/koifish/" target="_blank">Video Game Sales Visualization</a> by Qiu Yucheng, Yu Wei
- <a href="https://jfonli.shinyapps.io/COVID-19_Analysis/" target="_blank">COVID-19 Summary</a> by I-Hsuan Huang, Yiming Wang, Yen-Fong Li, Wenzheng Liao


***

### Course Evaluation

- Homework **42%**
    - Each HW	7%
-	Final Project **50%**
    - Proposal	10%
    - Presentation, Project and Documentation 38%
    - Peer Review	2%
-	Class Participation	**8%**
    - Intra-Group Evaluation 1%
    - Q&A during the class and on Campuswire 7%

*This course does not have any quizzes or exams.*

***

## <b>Hall of Fame</b>


### Top Projects
<b>Fall2022</b>\
:trophy:: *Best Project* :medal_sports:: *Honorable Mention*

:trophy:: <b><a>COVID-19 Analysis</a></b>\
Bananas: I-Hsuan Huang, Yiming Wang, Yen-Fong Li, Wenzheng Liao\
:medal_sports:: <b><a>Academic success visualization and analysis</a></b>\
TaylorExpansion: Farnaz Mohseni, Maryam Kian, David Suero Cobos, Sashankh Addanki, Yu Swe Zin Aung\
:medal_sports:: <b><a>Washington Electric Vehicle Data Visualization and Analysis</a></b>\
KohenKappa: Gen Li, Zhichun Li, Fante Meng, Lingyun Ding

### Top Contributors 
<b>Fall2022</b>\
:1st_place_medal:: Yiming Wang \
:1st_place_medal:: Farnaz Mohseni \
:1st_place_medal:: Gen Li; Zhichun Li; Fante Meng
