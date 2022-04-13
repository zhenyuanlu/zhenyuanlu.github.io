---
layout: course
permalink: /ie7275-bos-sm20/
title: <b>D</b>ata <b>M</b>ining in <b>E</b>ngineering
class: course
description: IE7275 • Summer 2020 • Northeastern University • Boston
logo: neu.png
nav: IE7275
---

This course covers the theory and applications of data mining in engineering. It reviews fundamentals and key concepts of data mining, discusses important data mining techniques, and presents algorithms for implementing these techniques. In specific, this course covers data mining techniques for data preprocessing, association rule extraction, classification, prediction, clustering, and complex data exploration. Data mining applications in several areas including manufacturing, healthcare, medicine, business, and other service sectors are discussed.

***

- **Class:** Thuesday 1:20pm – 03:00pm (EDT)
- **Office hour:** Monday 3:30pm to 4:30pm on zoom
- **Location:** Zoom
- **Dates:** 05/04/2020 – 06/25/2020
- **Administration:** Class/HW/project questions, or discussion will be only posted via Piazza.
- **Prerequisites**: IE6200 (familiar with R and necessary packages/libraries, e.g. tidyverse)
- **Preparation for the course**:
  - Linear Algebra: G. Strang. Introduction to Linear Algebra. Wellesley-Cambridge Press, 2009. Ch 1-4.
    - [<a href="https://studentlife.northeastern.edu/we-care/" target="_blank"> Video lectures</a>]
  - Calculus: G. Strang. Calculus. Wellesley-Cambridge Press, 2010. Old edition of the book (1991)
    - [<a href="https://ocw.mit.edu/ans7870/resources/Strang/Edited/Calculus/Calculus.pdf" target="_blank"> Materials </a>]
    - [<a href="https://ocw.mit.edu/resources/res-18-005-highlights-of-calculus-spring-2010/highlights_of_calculus/big-picture-of-calculus/" target="_blank"> Video lectures</a>]

***

<!-- Staff  -->
<div class="instructors clearfix">
  {% for instructor in site.data.staff_bos_sm20_ie7275.instructor %}
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
  <img src='/assets/img/ie7275/goal.png' alt='Course Goals' style="max-width:100%;">
</div>
Galit Shmueli, Peter C. Bruce, Inbal Yahav, Nitin R. Patel, Kenneth C. Lichtendahl Jr., Data Mining for Business Analytics: Concepts, Techniques, and Applications in R

***

### Textbooks

The required textbook:
- [**DMBA**] Galit Shmueli, Peter C. Bruce, Inbal Yahav, Nitin R. Patel, Kenneth C. Lichtendahl Jr., Data Mining for Business Analytics: Concepts, Techniques, and Applications in R, Wiley, 1st Edition，ISBN-10: 1118879368, ISBN-13: 978-1118879368.

Additional textbooks:

R: 
- [R For Data Science](https://r4ds.had.co.nz/){:target="\_blank"} (**R4DS**), Wickham, Hadley, and Garrett Grolemund
- [R Markdown](https://bookdown.org/yihui/rmarkdown/){:target="\_blank"} (**RMD**), Xie, Yihui, et al.

Data Mining: 
- Mohammed J. Zaki, Wagner Meira, Jr., Data Mining and Analysis: Fundamental Concepts and Algorithms (**DMA**), Cambridge University Press, May 2014 [(NEU Library Link)](https://onesearch.library.northeastern.edu/permalink/f/365rt0/NEU_ALMA51311637120001401){:target="\_blank"}
- Tan, Pang-Ning, et al. Introduction to Data Mining (**DM**). Pearson Education, 2006. [(Book website)](https://www-users.cs.umn.edu/~kumar001/dmbook/index.php){:target="\_blank"}

Statistical Modeling:
- [**ISLR**] James, Gareth, et al. An Introduction to Statistical Learning: with Applications in R. Springer, 2017. [Open License](https://static1.squarespace.com/static/5ff2adbe3fe4fe33db902812/t/6009dd9fa7bc363aa822d2c7/1611259312432/ISLR+Seventh+Printing.pdf){:target="\_blank"}, [Book Website](https://www.statlearning.com/){:target="\_blank"}
- [**ESL**]Hastie, T., Friedman, J., & Tisbshirani, R. (2017). The Elements of statistical learning: data mining, inference, and prediction. New York: Springer. [Open License](https://web.stanford.edu/~hastie/ElemStatLearn/){:target="\_blank"}

Machine learning and Deep learning:
- [**ML**] Machine Learning, Mitchell, Tom M. [Book Website](http://www.cs.cmu.edu/~tom/mlbook.html)
- [**DL**] Deep learning, Goodfellow, Ian, et al. [Open License](http://www.deeplearningbook.org/)

***

### Policies

Please post questions, and discussion only via Piazza. The visibility of questions and discussion are expected to set for public view (to the Entire class on Piazza). Please feel free to send instructor/TAs emails regarding any personal or other private issues/concerns.
All students are expected to attend the class through the entire semester. Please send me an email 24 hours before the coming class regarding the absence for any medical, or emergency reasons. You will be granted one homework extension of two calendar days, to be used at your discretion, without having to ask.
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

- Homework **35%**
-	Midterm Exam **20%**
- Final Exam **20%**
-	Project		**15%**
-	Class Participation	**10%**


***


### Schedule


(subject to change)

{% include schedule.html %}
