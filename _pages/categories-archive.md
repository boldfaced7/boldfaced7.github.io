 ---
title: "카테고리"
permalink: /categories/
layout: single
author_profile: true
 ---

 <div class="page__taxonomy">
 {% assign categories_list = site.categories | sort %}
   {% for category in categories_list %}
     <a href="#{{ category[0] | slugify }}" class="page__taxonomy-item">{{ category[0] }}</a> <span class="taxonomy__count">({{ category[1].size }})</span>
   {% endfor %}
 </div>

{% for category in categories_list %}
<h2 id="{{ category[0] | slugify }}" class="archive__subtitle">{{ category[0] }}</h2>
   <div class="entries-{{ page.entries_layout | default: 'list' }}">
     {% for post in category[1] %}
       {% include archive-single.html type=page.entries_layout %}
     {% endfor %}
   </div>
   <a href="#page-title" class="back-to-top">{{ site.data.ui-text[site.locale].back_to_top | default: 'Back to Top' }} &uarr;</a>
 {% endfor %}