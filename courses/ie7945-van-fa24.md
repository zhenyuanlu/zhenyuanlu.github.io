---
layout: course
categories: courses
maintitle: <b>A</b>rtificial <b>I</b>ntellegence /<b>M</b>achine <b>L</b>earning <b>M</b>aster's <b>P</b>roject
title: IE7945 • Fall 2024 • Northeastern University • Vancouver
class: course
image: neu.png
nav: AI/ML Master's Capstone Project
description: 
---

This course offers students a culminating experience to demonstrate proficiency in key concepts learned throughout their programs in core and elective courses. Designed to reinforce concepts in ethics and basic research principles, beyond an emphasis on technical knowledge.


***

- **Term**: Fall 2024
- **Class:** Thursdays, 3:30 PM - 4:30 PM PT
- **Location:** TBD
- **Dates:** 09/04/2024 – 12/06/2024
- **HW Submission**: [Gradescope](https://www.gradescope.com/courses/876356){:target="\_blank"}
- **Q&A Platform:** [Piazza](https://piazza.com/class/m18cwbnltqn4tc){:target="\_blank"}, please sign up with your northeastern email.
- **Course Repository**: [IE7945 materials](https://github.com/zhenyuanlu/course-ie7945){:target="\_blank"} 

  
- $\LaTeX$: [Overleaf](https://www.overleaf.com/){:target="\_blank"} or [Visual Studio Code](https://code.visualstudio.com/){:target="\_blank"}, depending on your team preference.
- **Code Repository:** [Github](https://github.com/){:target="\_blank"}, please register your account, and share with the instructor.
- **Project Management:** [Jira](https://ie7945fa24.atlassian.net/jira/software/projects/VANFA24/boards/1/backlog?epics=visible&atlOrigin=eyJpIjoiMGRlNTBlN2E3ZGE3NDBiZTg2YmQzY2NiNDA2MDA1NjQiLCJwIjoiaiJ9){:target="\_blank"}, you will receive an invitation to join the project management tool.
- **Portfolio:** [Github Pages](https://pages.github.com/){:target="\_blank"}, optional but encouraged.

- **Teaching style:** [There’s no speed limit](https://sive.rs/kimo){:target="\_blank"}

---

*<b><center>Difficulty means we have not understood - Pierre Deligne, Mathematician</center></b>*



---

<!-- Staff  -->
<div class="instructors clearfix">
  {% for instructor in site.data.staff_van_fa24.instructor %}
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

---

<!-- Guest  -->
<div class="instructors clearfix">
  {% for instructor in site.data.staff_van_fa24.guest %}
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


<!-- #### Table of contents
* (The list will be replaced with the table of contents.)
{:toc} -->


---
### Tools & Resources

$\LaTeX$ **Editors**
- [**Overleaf**](https://www.overleaf.com/){:target="\_blank"} (Preferred for collaboration, you can log in with your northeastern email)
- [Visual Studio Code](https://code.visualstudio.com/){:target="\_blank"}
 
$\LaTeX$ **Template**
- We will use the [[**CVPR 2025**](https://github.com/cvpr-org/author-kit/archive/refs/tags/CVPR2025-v3(latex).zip){:target="_blank"}] templates for the paper, please download it to the local and then upload it to Overleaf.

**Git Repository**
- As this is a group project, we will use Github for version control. Please register your account on [[**Github**](https://github.com/){:target="\_blank"}]

**Project Management**
- To understand how to manage the project in industry, we will use We will use [[**Jira**](https://ie7945fa24.atlassian.net/jira/software/projects/VANFA24/boards/1/backlog?epics=visible&atlOrigin=eyJpIjoiMGRlNTBlN2E3ZGE3NDBiZTg2YmQzY2NiNDA2MDA1NjQiLCJwIjoiaiJ9){:target="\_blank"}] for sprint planning and tracking . You will receive an invitation to join the project management tool.

**Portfolio**
- If you are interested in creating a portfolio, you can use [[**Github Pages**](https://pages.github.com/){:target="\_blank"}], this is optional but encouraged. 


**Note: before posting any content on github, please consult with your instructor and industry mentor.**

---



### Team Projects (Industry Partner)

| Project                                                             | Team Members                                                   | Industry Partner       | Instructor              |
|----------------------------------------------------------------------|----------------------------------------------------------------|------------------------|-------------------------|
| **Clasibot 2.0: Towards Autonomous Bookkeeping**                     | Li Bao, Priya Hiteshkumar Daiya, Haritha Rathnam Kuppala, Suraju Ibiyemi | Classibot.com          | **Zhenyuan Lu**          |
| **Live Timeless: Health Dashboard & AI Coach**                      | Yuanyuan Chen (She/Her), Ravi Teja Chintalapudi, Maharshi Shukla, Mohammed Rayyan Sami | Live Timeless          | **Zhenyuan Lu**          |



<p style="line-height:25px;margin:0px;"><br></p>



---

### Grading (Subject to Change)

- **30% Project Check-ins** (Individual):
  - Good Execution - 3%, Average - 2%, Poor - 1%, None - 0%
- **30% Panel Review** (Group)
  - 15% Draft Paper (Introduction, Related Work, Methodology)
  - 15% Presentation
- **30% Final Deliverables** (Group):
  - 15% Full Paper
  - 15% Full Presentation
- **10% Exit Interview** (Individual)
- **Late Submissions**: 20% off per day, up to 100%.

---

###  Course Schedule

<!-- | Week       | Module                    | Assignment           | Materials                    |
|------------|---------------------------|----------------------|------------------------------|
| Week 1     | TBD                       | TBD                  | TBD                          |
| Week 2     | TBD                       | TBD                  | TBD                          |
| Week 3     | TBD                       | TBD                  | TBD                          |
| Week 4     | TBD                       | TBD                  | TBD                          |
| Week 5     | TBD                       | TBD                  | TBD                          |
| Week 6     | TBD                       | TBD                  | TBD                          |
| Week 7     | TBD                       | TBD                  | TBD                          |
| Week 8     | TBD                       | TBD                  | TBD                          |
| Week 9     | TBD                       | TBD                  | TBD                          |
| Week 10    | TBD                       | TBD                  | TBD                          |
| Week 11    | TBD                       | TBD                  | TBD                          |
| Week 12    | TBD                       | TBD                  | TBD                          |
| Week 13    | TBD                       | TBD                  | TBD                          |
| Week 14    | TBD                       | TBD                  | TBD                          |
| Week 15    | TBD                       | TBD                  | TBD                          |

--- -->


(subject to change)

{% include schedule.html %}

---

### Expectations

- **General**: Respectful communication with faculty, staff, industry, and peers. Students should come prepared, engage with materials, and participate actively.
- **Accommodations**: If you need accommodations (e.g. child care, extra time), please speak with the instructor at the beginning of the course.
- **Attendance**: Required for all classes. Absences should be communicated via email. Repeated absences will be evaluated by faculty.
- **Classroom Conduct**: Maintain a civil and respectful environment for discussion. Disagreements must be respectful and based on facts.
- **Collaboration and Academic Honesty**: Collaboration is encouraged, but students are responsible for their own work. Cite any substantive discussions with peers. Do not copy code or answers from others or online sources.

---

### Grade Scale

| Grade | Range   |
|-------|---------|
| A     | 93-100  |
| A-    | 90-<93  |
| B+    | 86-<90  |
| B     | 83-<86  |
| B-    | 77-<83  |
| C+    | 73-<77  |
| C     | 69-<73  |
| C-    | 65-<69  |
| F     | <65     |

---

### Take care of yourself

Eating healthy food, having regular exercises, avoiding alcohol and drugs, getting adequate sleep and taking time to relax. This will help you achieve your goals and tame stress.

If you have difficulty to keep up with any materials or homework for personal reasons please let me know early. If you or your friends/classmates who appears to be struggling, or having trouble coping with stress. We strongly encourage you to seek support at the [We Care](https://studentlife.northeastern.edu/we-care/){:target="\_blank"} program at NEU. At Northeastern, a student is never alone when struggling with a demanding situation.

---

### Policies
Plagiarism, cheating, and any form of unauthorized collaboration will not be tolerated and will be handled in accordance with University policies described in the Student Handbook. For additional information on Northeastern University’s [Academic Integrity Policy](http://www.northeastern.edu/osccr/academic-integrity-policy/){:target="\_blank"}

---

### AI Tools
AI tools, including ChatGPT, are encouraged to assist in your work. However, your unique intellectual contributions are essential. Use AI to enhance, not replace, your efforts.

---

### Title IX
Northeastern prohibits discrimination based on sex or gender identity. If you or someone you know is affected by sexual harassment or violence, confidential support is available through University Health and Counseling Services. 

---

### Student Feedback
Please use the TRACE system to provide feedback at the end of the course. The instructor may also seek feedback halfway through the semester.

---

### Accommodations for Students with Disabilities

If you have a disability, I encourage you to contact [Disability Resource Center](http://www.northeastern.edu/drc/about-the-drc/){:target="\_blank"} to register and request the accommodations. Also please discuss your needs with me as early in the semester as possible.

---

### Course Outcomes
- Exhibit proficiency in the design, implementation, and testing of software.
- Apply algorithmic and theoretical computer science principles to solve computing problems from a variety of application areas.
- Research and apply ethical considerations when solving computing problems.
- Read, discuss, and extract key ideas from research papers published at top-tier computing conferences.
- Demonstrate the conceptual and methodical competence to present research in the computing field.

---

### Course Requirements
- Attendance is required for:
  - All scheduled classes
  - All team meetings (on/off-campus)
  - All meetings with project stakeholders (on/off-campus)
  
<!-- - **Tardiness**: Considered an absence. -->

- Individual Contributions:
  - Each student must contribute equally and demonstrate skill development in all competency areas listed in the course outcomes.
  - Individual contributions must demonstrate reasonable quality and application of technology.
  - Students who do not contribute significantly may receive an adjusted grade.
  - Students who miss the Exit Interview and Showcase Day will receive a failing grade.
  

---