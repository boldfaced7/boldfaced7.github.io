/* ==========================================================================
   Various functions that we want to use within the template
   ========================================================================== */

// Determine the expected state of the theme toggle, which can be "dark", "light", or
// "system". Default is "system".
let determineThemeSetting = () => {
  let themeSetting = localStorage.getItem("theme");
  return (themeSetting != "dark" && themeSetting != "light" && themeSetting != "system") ? "system" : themeSetting;
};

// Determine the computed theme, which can be "dark" or "light". If the theme setting is
// "system", the computed theme is determined based on the user's system preference.
let determineComputedTheme = () => {
  let themeSetting = determineThemeSetting();
  if (themeSetting != "system") {
    return themeSetting;
  }
  return (userPref && userPref("(prefers-color-scheme: dark)").matches) ? "dark" : "light";
};

// detect OS/browser preference
const browserPref = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

// Set the theme on page load or when explicitly called
let setTheme = (theme) => {
  const use_theme =
    theme ||
    localStorage.getItem("theme") ||
    $("html").attr("data-theme") ||
    browserPref;

  if (use_theme === "dark") {
    $("html").attr("data-theme", "dark");
    $("#theme-icon").removeClass("fa-sun").addClass("fa-moon");
  } else if (use_theme === "light") {
    $("html").removeAttr("data-theme");
    $("#theme-icon").removeClass("fa-moon").addClass("fa-sun");
  }
};

// Toggle the theme manually
var toggleTheme = () => {
  const current_theme = $("html").attr("data-theme");
  const new_theme = current_theme === "dark" ? "light" : "dark";
  localStorage.setItem("theme", new_theme);
  setTheme(new_theme);
};

/* ==========================================================================
   Plotly integration script so that Markdown codeblocks will be rendered
   ========================================================================== */

// Read the Plotly data from the code block, hide it, and render the chart as new node. This allows for the 
// JSON data to be retrieve when the theme is switched. The listener should only be added if the data is 
// actually present on the page.
import { plotlyDarkLayout, plotlyLightLayout } from './theme.js';
let plotlyElements = document.querySelectorAll("pre>code.language-plotly");
if (plotlyElements.length > 0) {
  document.addEventListener("readystatechange", () => {
    if (document.readyState === "complete") {
      plotlyElements.forEach((elem) => {
        // Parse the Plotly JSON data and hide it
        var jsonData = JSON.parse(elem.textContent);
        elem.parentElement.classList.add("hidden");

        // Add the Plotly node
        let chartElement = document.createElement("div");
        elem.parentElement.after(chartElement);

        // Set the theme for the plot and render it
        const theme = (determineComputedTheme() === "dark") ? plotlyDarkLayout : plotlyLightLayout;
        if (jsonData.layout) {
          jsonData.layout.template = (jsonData.layout.template) ? { ...theme, ...jsonData.layout.template } : theme;
        } else {
          jsonData.layout = { template: theme };
        }
        Plotly.react(chartElement, jsonData.data, jsonData.layout);
      });
    }
  });
}

/* ==========================================================================
   Actions that should occur when the page has been fully loaded
   ========================================================================== */

$(document).ready(function () {
  // SCSS SETTINGS - These should be the same as the settings in the relevant files 
  const scssLarge = 925;          // pixels, from /_sass/_themes.scss
  const scssMastheadHeight = 70;  // pixels, from the current theme (e.g., /_sass/theme/_default.scss)

  // If the user hasn't chosen a theme, follow the OS preference
  setTheme();
  window.matchMedia('(prefers-color-scheme: dark)')
        .addEventListener("change", (e) => {
          if (!localStorage.getItem("theme")) {
            setTheme(e.matches ? "dark" : "light");
          }
        });

  // Enable the theme toggle
  $('#theme-toggle').on('click', toggleTheme);

  // Enable the sticky footer
  var bumpIt = function () {
    $("body").css("margin-bottom", $(".page__footer").outerHeight(true));
  }
  $(window).resize(function () {
    didResize = true;
  });
  setInterval(function () {
    if (didResize) {
      didResize = false;
      bumpIt();
    }}, 250);
  var didResize = false;
  bumpIt();

  // FitVids init
  fitvids();

  // Follow menu drop down
  $(".author__urls-wrapper button").on("click", function () {
    $(".author__urls").fadeToggle("fast", function () { });
    $(".author__urls-wrapper button").toggleClass("open");
  });

  // Restore the follow menu if toggled on a window resize
  jQuery(window).on('resize', function () {
    if ($('.author__urls.social-icons').css('display') == 'none' && $(window).width() >= scssLarge) {
      $(".author__urls").css('display', 'block')
    }
  });

  // Init smooth scroll, this needs to be slightly more than then fixed masthead height
  $("a").smoothScroll({
    offset: -scssMastheadHeight,
    preventDefault: false,
  });

  // Generate table of contents
  console.log('Document ready, calling generateTableOfContents');
  
        // 즉시 실행되는 함수로 변경
      (function() {
        console.log('generateTableOfContents called');
        
        const tocTopContainer = document.getElementById('markdown-toc-top');
        const tocSidebarContainer = document.getElementById('markdown-toc-sidebar');
        
        console.log('tocTopContainer:', tocTopContainer);
        console.log('tocSidebarContainer:', tocSidebarContainer);
        
        const headings = document.querySelectorAll('.page__content h1, .page__content h2, .page__content h3, .page__content h4, .page__content h5, .page__content h6');
        
        console.log('headings found:', headings.length);
        headings.forEach((heading, index) => {
          console.log(`Heading ${index}:`, heading.textContent.trim());
        });
        
        if (headings.length === 0) {
          console.log('No headings found, hiding TOC containers');
          // Hide TOC containers if no headings
          if (tocTopContainer) {
            const tocTopNav = tocTopContainer.closest('.toc-top');
            if (tocTopNav) tocTopNav.style.display = 'none';
          }
          if (tocSidebarContainer) {
            const tocSidebarNav = tocSidebarContainer.closest('.sidebar');
            if (tocSidebarNav) tocSidebarNav.style.display = 'none';
          }
          return;
        }

        // Create TOC for both top and sidebar
        [tocTopContainer, tocSidebarContainer].forEach((container, containerIndex) => {
          if (!container) {
            console.log(`Container ${containerIndex} not found`);
            return;
          }
          
          console.log(`Creating TOC for container ${containerIndex}`);
          
          const toc = document.createElement('ul');
          toc.className = 'toc__menu';

          let currentH1 = null;
          let currentH2 = null;
          let h1Items = []; // H1 아이템들을 저장할 배열
          let h2Items = []; // H2 아이템들을 저장할 배열
          let h1HasChildren = {}; // H1이 자식을 가지고 있는지 확인
          let h2HasChildren = {}; // H2가 자식을 가지고 있는지 확인

          // 먼저 H2가 어떤 H1에 속하는지, H3-H6이 어떤 H2에 속하는지 미리 확인
          headings.forEach((heading, index) => {
            if (heading.classList.contains('page__title')) return;
            
            const headingLevel = parseInt(heading.tagName.charAt(1));
            if (headingLevel === 2) {
              // H2를 가장 가까운 H1에 연결
              let closestH1Index = -1;
              for (let i = index - 1; i >= 0; i--) {
                const prevHeading = headings[i];
                if (prevHeading.classList.contains('page__title')) continue;
                const prevLevel = parseInt(prevHeading.tagName.charAt(1));
                if (prevLevel === 1) {
                  closestH1Index = i;
                  break;
                }
              }
              if (closestH1Index !== -1) {
                h1HasChildren[closestH1Index] = true;
              }
            } else if (headingLevel >= 3) {
              // H3-H6을 가장 가까운 H2에 연결
              let closestH2Index = -1;
              for (let i = index - 1; i >= 0; i--) {
                const prevHeading = headings[i];
                if (prevHeading.classList.contains('page__title')) continue;
                const prevLevel = parseInt(prevHeading.tagName.charAt(1));
                if (prevLevel === 2) {
                  closestH2Index = i;
                  break;
                }
              }
              if (closestH2Index !== -1) {
                h2HasChildren[closestH2Index] = true;
              }
            }
          });

          headings.forEach((heading, index) => {
            // Skip if it's the page title or TOC title
            if (heading.classList.contains('page__title') || 
                heading.textContent.trim() === '목차' ||
                heading.textContent.trim() === 'Table of Contents') return;

            console.log('Processing heading:', heading.tagName, heading.textContent.trim(), 'Level:', parseInt(heading.tagName.charAt(1)));

            // Create ID for heading if it doesn't exist
            if (!heading.id) {
              heading.id = `heading-${index}`;
            }

            const headingLevel = parseInt(heading.tagName.charAt(1));
            const listItem = document.createElement('li');
            const link = document.createElement('a');
            
            link.href = `#${heading.id}`;
            const originalText = heading.textContent.trim();
            console.log('Original heading text:', originalText);
            link.textContent = originalText;
            link.className = `toc-level-${headingLevel}`;
            
            // Add click event for smooth scrolling
            link.addEventListener('click', function(e) {
              // 토글 버튼 클릭이 아닌 경우에만 스크롤 실행
              if (!e.target.classList.contains('toc-toggle')) {
                console.log('Link clicked:', this.href);
                console.log('Target element:', document.querySelector(this.getAttribute('href')));
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                  console.log('Scrolling to target:', target);
                  target.scrollIntoView({ behavior: 'smooth' });
                } else {
                  console.log('Target not found for:', this.getAttribute('href'));
                }
              }
            });
            
            listItem.appendChild(link);

            // Handle different heading levels
            if (headingLevel === 1) {
              // H1: Always visible with toggle functionality
              currentH1 = listItem;
              h1Items.push(listItem); // H1 아이템 저장
              
              // Add toggle button to H1 only if it has children
              if (h1HasChildren[index]) {
                const toggleSpan = document.createElement('span');
                toggleSpan.className = 'toc-toggle';
                toggleSpan.textContent = ' [▼]';
                toggleSpan.style.cursor = 'pointer';
                toggleSpan.style.color = '#666';
                toggleSpan.style.fontSize = '0.8rem';
                toggleSpan.style.fontWeight = 'normal';
                
                // 사이드바 토글 버튼은 더 작게
                if (listItem.closest('.sidebar')) {
                  toggleSpan.style.fontSize = '0.6rem';
                }
                toggleSpan.style.marginLeft = '0.5rem';
                
                // Add toggle to the link
                link.appendChild(toggleSpan);
                
                // Add click event for toggle
                toggleSpan.addEventListener('click', function(e) {
                  e.preventDefault();
                  e.stopPropagation();
                  
                  // Find or create submenu for this H1
                  let submenu = listItem.querySelector('.toc-submenu');
                  if (!submenu) {
                    submenu = document.createElement('ul');
                    submenu.className = 'toc-submenu';
                    submenu.style.display = 'none';
                    listItem.appendChild(submenu);
                  }
                  
                  const isVisible = submenu.style.display !== 'none';
                  submenu.style.display = isVisible ? 'none' : 'block';
                  toggleSpan.textContent = isVisible ? ' [▼]' : ' [▲]';
                });
              }
              
              toc.appendChild(listItem);
            } else if (headingLevel === 2) {
              // H2: Add to the most recent H1's submenu
              currentH2 = listItem;
              h2Items.push(listItem); // H2 아이템 저장
              
              if (h1Items.length > 0) {
                const targetH1 = h1Items[h1Items.length - 1]; // 가장 최근 H1
                
                // Create submenu if it doesn't exist
                let submenu = targetH1.querySelector('.toc-submenu');
                if (!submenu) {
                  submenu = document.createElement('ul');
                  submenu.className = 'toc-submenu';
                  submenu.style.display = 'none';
                  targetH1.appendChild(submenu);
                }
                
                // Add toggle button to H2 only if it has children
                if (h2HasChildren[index]) {
                  const toggleSpan = document.createElement('span');
                  toggleSpan.className = 'toc-toggle';
                  toggleSpan.textContent = ' [▼]';
                  toggleSpan.style.cursor = 'pointer';
                  toggleSpan.style.color = '#666';
                  toggleSpan.style.fontSize = '0.8rem';
                  toggleSpan.style.fontWeight = 'normal';
                  
                  // 사이드바 토글 버튼은 더 작게
                  if (listItem.closest('.sidebar')) {
                    toggleSpan.style.fontSize = '0.6rem';
                  }
                  toggleSpan.style.marginLeft = '0.5rem';
                  
                  // Add toggle to the link
                  link.appendChild(toggleSpan);
                  
                  // Add click event for toggle
                  toggleSpan.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    // Find or create submenu for this H2
                    let h2Submenu = listItem.querySelector('.toc-submenu');
                    if (!h2Submenu) {
                      h2Submenu = document.createElement('ul');
                      h2Submenu.className = 'toc-submenu';
                      h2Submenu.style.display = 'none';
                      listItem.appendChild(h2Submenu);
                    }
                    
                    const isVisible = h2Submenu.style.display !== 'none';
                    h2Submenu.style.display = isVisible ? 'none' : 'block';
                    toggleSpan.textContent = isVisible ? ' [▼]' : ' [▲]';
                  });
                }
                
                submenu.appendChild(listItem);
              } else {
                // If no H1 parent, add directly to main TOC
                toc.appendChild(listItem);
              }
            } else {
              // H3-H6: Add to the most recent H2's submenu
              if (h2Items.length > 0) {
                const targetH2 = h2Items[h2Items.length - 1]; // 가장 최근 H2
                
                // Create submenu if it doesn't exist
                let submenu = targetH2.querySelector('.toc-submenu');
                if (!submenu) {
                  submenu = document.createElement('ul');
                  submenu.className = 'toc-submenu';
                  submenu.style.display = 'none';
                  targetH2.appendChild(submenu);
                }
                
                submenu.appendChild(listItem);
              } else {
                // If no H2 parent, add directly to main TOC
                toc.appendChild(listItem);
              }
            }
          });

          container.appendChild(toc);
          console.log(`TOC created for container ${containerIndex} with ${toc.children.length} items`);
        });
      })();

});

/* ==========================================================================
   Table of Contents Generation
   ========================================================================== */
