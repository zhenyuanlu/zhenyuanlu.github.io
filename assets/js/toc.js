document.addEventListener('DOMContentLoaded', () => {
    const zToc = document.querySelector('z-toc');
    if (!zToc) return;
  
    const tocEnabled = zToc.getAttribute('data-toc') === 'true';
    const maxDepth = parseInt(zToc.getAttribute('data-toc-level') || '2', 10);
    if (!tocEnabled) return;
  
    const content = document.getElementById('blog-content');
    if (!content) return;
  
    // Identify appendix elements
    const hasFootnotes = !!document.querySelector('z-fn');
    const hasReferences = !!document.querySelector('z-cite');
    const bibliographyEnabled = document.querySelector('z-bibliography')?.getAttribute('src');
  
    // Build array of allowed headings based on maxDepth
    const allowedHeadings = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].slice(0, maxDepth);
    const allHeaders = content.querySelectorAll(allowedHeadings.join(','));
  
    if (allHeaders.length === 0 && !hasFootnotes && !hasReferences) return;
  
    // Create hierarchical structure
    const tocTree = [];
    const levels = Array.from({ length: maxDepth }, () => []);
  
    const createSection = (el, level) => {
      const id = el.id || el.textContent.trim().toLowerCase().replace(/\s+/g, '-');
      el.id = id;
      return {
        title: el.textContent.trim(),
        id: id,
        level: level,
        children: []
      };
    };
  
    allHeaders.forEach(header => {
      const tag = header.tagName.toLowerCase();
      const level = allowedHeadings.indexOf(tag) + 1;
      const section = createSection(header, level);
  
      if (level === 1) {
        tocTree.push(section);
        levels[0].push(section);
      } else {
        const parentLevel = level - 1;
        const parentArray = levels[parentLevel - 1];
        const parent = parentArray[parentArray.length - 1];
        if (parent) {
          parent.children.push(section);
        }
        // Reset deeper levels
        for (let i = level; i < maxDepth; i++) {
          levels[i] = [];
        }
        levels[level - 1].push(section);
      }
    });
  
    // Append appendices (references, footnotes, etc.) as level-1 items
    if (hasFootnotes) {
      tocTree.push({
        title: 'Footnotes',
        id: 'footnotes',
        level: 1,
        children: []
      });
    }
  
    if (hasReferences && bibliographyEnabled) {
      tocTree.push({
        title: 'References',
        id: 'references',
        level: 1,
        children: []
      });
    }
  
    // Generate TOC
    if (tocTree.length === 0) return;
  
    const generateNumber = (path) => path.join('.');
  
    const createSectionHTML = (section, path) => {
      const depth = section.level - 1;
      const sectionNumber = generateNumber(path);
      const hasChildren = section.children && section.children.length > 0;
  
      const indentClass = depth === 0 ? '-mx-2 px-2' : `pl-${(depth + 1) * 3} pr-2`;
      const numberWidthClass = depth === 0 ? 'w-5' : 'w-7';
  
      let html = `
        <div class="space-y-0.5">
          <a href="#${section.id}" class="block py-0.5 rounded transition-colors relative group hover:bg-gray-50">
            <div class="flex items-center gap-2 ${indentClass}">
              <span class="text-xs font-medium text-gray-400 group-hover:text-gray-600 transition-colors ${numberWidthClass}">
                ${sectionNumber}
              </span>
              <span class="text-xs text-gray-700 group-hover:text-gray-900 transition-colors ${depth === 0 ? 'font-medium' : ''}">
                ${section.title}
              </span>
            </div>
          </a>
      `;
  
      if (hasChildren) {
        const lineClass = depth === 0 ? 'bg-gray-200 top-0 bottom-0' : 'bg-gray-100 top-1 bottom-1';
        html += `
          <div class="relative ${depth > 0 ? 'ml-3' : 'ml-6'}">
            <div class="absolute left-0 w-px ${lineClass}"></div>
            <div class="space-y-0.5">
        `;
        section.children.forEach((child, idx) => {
          html += createSectionHTML(child, [...path, idx + 1]);
        });
        html += `</div></div>`;
      }
  
      html += `</div>`;
      return html;
    };
  
    const nav = document.createElement('nav');
    nav.className = "mb-8 relative";
    nav.setAttribute('role', 'navigation');
    nav.setAttribute('aria-label', 'Table of contents');
  
    let tocExpanded = false;
  
    const container = document.createElement('div');
    container.className = `
      relative border rounded-lg overflow-hidden transition-all duration-300 bg-gray-50
      border-gray-100 hover:shadow
    `.trim().replace(/\s+/g, ' ');
  
    const headerBtn = document.createElement('button');
    headerBtn.className = "w-full px-4 py-2 transition-all duration-200";
    headerBtn.innerHTML = `
      <div class="flex items-center justify-between">
        <h3 class="text-sm font-medium text-gray-900">Table of Contents</h3>
        <i data-lucide="chevron-down" class="w-4 h-4 text-gray-400 transition-transform duration-300"></i>
      </div>
    `;
    container.appendChild(headerBtn);
  
    const contentDiv = document.createElement('div');
    contentDiv.className = "transition-all duration-300 ease-in-out overflow-hidden bg-white max-h-0 opacity-0";
    const innerDiv = document.createElement('div');
    innerDiv.className = "px-4 pb-3 pt-1 space-y-1";
    contentDiv.appendChild(innerDiv);
    container.appendChild(contentDiv);
  
    tocTree.forEach((section, idx) => {
      innerDiv.innerHTML += createSectionHTML(section, [idx + 1]);
    });
  
    headerBtn.addEventListener('click', () => {
      tocExpanded = !tocExpanded;
      const icon = headerBtn.querySelector('[data-lucide="chevron-down"]');
      if (tocExpanded) {
        contentDiv.style.maxHeight = contentDiv.scrollHeight + 'px';
        contentDiv.style.opacity = '1';
        container.classList.remove('hover:shadow');
        container.classList.add('border-gray-200');
        if (icon) icon.style.transform = 'rotate(180deg)';
      } else {
        contentDiv.style.maxHeight = '0px';
        contentDiv.style.opacity = '0';
        container.classList.add('border-gray-200');
        if (icon) icon.style.transform = 'rotate(0deg)';
      }
    });
  
    nav.appendChild(container);
    zToc.appendChild(nav);
    lucide.createIcons({ el: nav });
  
    // Smooth scrolling effect
    const links = zToc.querySelectorAll('a[href^="#"]');
    links.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = link.getAttribute('href').substring(1);
        const target = document.getElementById(targetId);
        if (target) {
          window.scrollTo({
            top: target.offsetTop - 100, // Adjust offset if needed
            behavior: 'smooth'
          });
        }
      });
    });
  });
  