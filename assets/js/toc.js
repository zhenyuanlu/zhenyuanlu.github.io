// toc.js
export function initTOC() {
    const content = document.querySelector('.prose');
    const headings = content ? content.querySelectorAll('h2, h3, h4') : [];
    const toc = document.querySelector('.z-toc-content');
    
    if (!toc || headings.length === 0) return;
  
    const tocStructure = buildTocStructure(headings);
    toc.innerHTML = generateTocHtml(tocStructure);
  
    // Assign IDs to headings if they don't have them
    headings.forEach((heading, index) => {
      if (!heading.id) heading.id = `heading-${index}`;
    });
  
    setupScrollSpy(headings);
    setupEventListeners();
  }
  
  function buildTocStructure(headings) {
    const structure = [];
    const levels = { h2: 0, h3: 1, h4: 2 };
    const stack = [{ items: structure, level: -1 }];
  
    headings.forEach((heading) => {
      const level = levels[heading.tagName.toLowerCase()];
      const item = { id: heading.id, title: heading.textContent, level, items: [] };
  
      while (stack.length > 1 && stack[stack.length - 1].level >= level) {
        stack.pop();
      }
      stack[stack.length - 1].items.push(item);
      stack.push(item);
    });
  
    return structure;
  }
  
  function generateTocHtml(items, level = 0) {
    if (!items.length) return '';
    let html = `<ul class="toc-list${level === 0 ? ' root' : ''}">`;
    items.forEach(item => {
      html += `
        <li class="toc-item" data-level="${item.level}">
          <a href="#${item.id}" class="toc-link" data-section="${item.id}">${item.title}</a>
          ${generateTocHtml(item.items, level + 1)}
        </li>
      `;
    });
    html += '</ul>';
    return html;
  }
  
  function setupScrollSpy(headings) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        const id = entry.target.getAttribute('id');
        const tocItem = document.querySelector(`[data-section="${id}"]`);
        if (tocItem) {
          if (entry.isIntersecting) {
            setActiveSection(id);
          }
        }
      });
    }, { rootMargin: '-20% 0px -80% 0px' });
  
    headings.forEach(heading => observer.observe(heading));
  }
  
  function setActiveSection(id) {
    document.querySelectorAll('.toc-link').forEach(link => link.classList.remove('active'));
    const activeLink = document.querySelector(`[data-section="${id}"]`);
    if (activeLink) {
      activeLink.classList.add('active');
      let parent = activeLink.closest('.toc-list');
      while (parent && parent.classList.contains('toc-list')) {
        parent.classList.add('expanded');
        parent = parent.parentElement && parent.parentElement.closest('.toc-list');
      }
    }
  }
  
  function setupEventListeners() {
    document.querySelectorAll('.toc-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const id = link.getAttribute('href').substring(1);
        const target = document.getElementById(id);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
  }
  