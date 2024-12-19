---
layout: blog_page
type: project
title: "Wrist Motion and Hand Gesture Classification"
description: "PainAttnNet Model Extended Version on Motion Detection based on Signals."

author: "Zhenyuan Lu"
date: 2023-05-16

tags:
  - "Deep Learning"
  - "Transformer"
  - "Signal Processing"

highlight: 0

hide: false
toc: true

thumbnail: "/assets/images/thumbnails/posts/gesture.png"
image: "/assets/images/blog/projects/gesture/zl_motion_short.gif"
links:
  - type: github
    href: "https://github.com/zhenyuanlu/WristMotion-Gesture-Detection"

biliography: 2023-05-16-gesture.bib
---


<div class="l-page">
<center>
  <figure style="max-width:30%;">
    <img src="{{ '/assets/images/blog/projects/gesture/zl_motion.gif' | relative_url }}"  />
    <figcaption>
      <strong> One example of how hand is moving - not relevant to the data. Creator: Zhenyuan Lu</strong>.
    </figcaption>
  </figure>
</center>
</div>


# Abstract

In this report, we adapt our previous work PainAttnNet model <z-cite key="lu2023transformer"></z-cite>, a novel transformer-encoder deep learning framework for classifying pain intensities using physiological signals. PainAttnNet model integrates convolutional networks to capture multimodal features, a squeeze-and-excitation residual network emphasizing interdependencies among relevant features, and a transformer encoder block for optimal feature extraction and temporal dependency analysis. Supplemental information and source code are available at: <a>https://github.com/zhenyuanlu/WristMotion-Gesture-Detection</a>



<div class="l-page">
<center>
  <figure>
    <img src="{{ '/assets/images/blog/projects/gesture/quaternion.png' | relative_url }}"  />
    <figcaption>
      <strong> The transformation of quaternion data to rotation objects: X,Y, Z. Three wrist motion patterns present in the chart. Left: repetition number 1 with movement 0. Middle: repetition number 2 with movement 0. Right: repetition number 3 with movement 0. </strong>.
    </figcaption>
  </figure>
</center>
</div>


***

# Exploration


The workflow is designed to handle multimodal data features such as timestamps, raw channel data, high-pass filtered channel data, quaternion, gyroscope, accelerometer data, body movement labels, and repetition numbers from Pison Wrist Motion Data (PWMD). 

<center>
  <figure style="max-width:100%" >
    <img src='/assets/images/blog/projects/gesture/raw.png' />
    <figcaption>
      <strong> Different repetition numbers of raw data during different body movements. Here we only show the channel 0 raw signal. </strong>.
    </figcaption>
  </figure>
</center>

A crucial step in our preprocessing pipeline was the standardization of sample lengths across the dataset. This was achieved by either truncating or padding the data samples to achieve a uniform target length (we used truncating for the experiment). In our procedure, the length of each sample was truncated upon on the minimum sample length 967 in the first step. While we also noticed that there is a couple timestamps of inactivity at the begining of each motion, we also tested on the length of 900. 

Next, we have implemented a strategy to segregate data based on body movement labels and repetition numbers. Each unique combination of body movement label and repetition number was treated as a separate subject, e.g. Standing 2 with repetition number 1 as one subject. In total we have 15 subjects from the original dataset. This approach lends itself to a more practical and realistic representation of the data. For instance, in a real-world scenario, a subject may perform different wrist motions with the different body movements. Therefore, the data should be treated as a collection of unique subjects, each with a distinct body movement label and repetition number. Whereas, we found out that the wrist motion classes are based on the repetition numbers, e.g. 1, 2, 3, as three different wrist classes repeatedly performed during different body movement. During the training, the dataset was split into $k$-fold cross validation, where $k$ is 5, each fold has three samples, each one has a unique body movement label with one unique repetition number.

<div class="l-page">
<center>
  <figure>
    <img src="{{ '/assets/images/blog/projects/gesture/results.png' | relative_url }}"  />
    <figcaption>
      <strong> Left: the performance between the number of encoder layer - 5 and 3. Middle: the performance between different sample segmentation - minimum length 967 and arbitrary length 900. Right: the performance between different number of attention heads - 1,3, and 5.</strong>.
    </figcaption>
  </figure>
</center>
</div>

***

# Methodology

Please check out our previous work PainAttnNet model <z-cite key="lu2023transformer"></z-cite> for more details.

***


# Experimental Results


In our experiment, we used the PWMD for modeling. This dataset consists of 17 columns provided in the dataset. 14 of them are features we used in our model for prediction of the repetition number (wrist motion), e.g. {1, 2, 3} among body movements. The results with different settings showed in above figure. We have the best performance with the following settings: 5 encoder layers, 5 attention heads, and minimum length 967. The performance is 100% accuracy, 100% macro F1, and 100% Cohen's Kappa.

***

# Acknowledgements
The wrist motion data is provided by Pison Technology.


***

