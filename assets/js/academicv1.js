document.addEventListener('DOMContentLoaded', () => {
    tableOfContents.init();
    citations.init();
    codeBlocks.init();
  });
  
  // TOC Logic (no sidebar, just fill .z-toc-content inside <details>)
  const tableOfContents = {
    init() {
      const content = document.querySelector('.prose');
      if (!content) return;
      const headings = content.querySelectorAll('h2, h3, h4');
      const toc = document.querySelector('.z-toc-content');
      if (!toc || !headings.length) return;
  
      headings.forEach((h, i) => {
        if (!h.id) h.id = `heading-${i}`;
      });
  
      const structure = this.buildStructure(headings);
      toc.innerHTML = this.buildHTML(structure);
      this.setupScrollSpy();
    },
  
    buildStructure(headings) {
      const structure = [];
      const levels = {H2:0,H3:1,H4:2};
      const stack = [{items: structure, level:-1}];
  
      headings.forEach(h => {
        const level = levels[h.tagName];
        const item = {id:h.id, title:h.innerText, level, items:[]};
        while (stack.length>1 && stack[stack.length-1].level>=level) stack.pop();
        stack[stack.length-1].items.push(item);
        stack.push({...item, level});
      });
      return structure;
    },
  
    buildHTML(items) {
      if (!items.length) return '';
      let html = `<ul class="toc-list">`;
      items.forEach(item => {
        html += `
          <li class="toc-item">
            <a href="#${item.id}" class="toc-link">${item.title}</a>
            ${this.buildHTML(item.items)}
          </li>
        `;
      });
      html += '</ul>';
      return html;
    },
  
    setupScrollSpy() {
      const options = { rootMargin: '-20% 0px -80% 0px' };
      const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          const id = entry.target.id;
          const link = document.querySelector(`.toc-link[href="#${id}"]`);
          if (link) {
            if (entry.isIntersecting) {
              document.querySelectorAll('.toc-link').forEach(l => l.classList.remove('active'));
              link.classList.add('active');
            }
          }
        });
      }, options);
  
      document.querySelectorAll('h2, h3, h4').forEach(heading => observer.observe(heading));
    }
  };
  
  // Citation Logic
  const citations = {
    init() {
      // Load global bibliography if needed
      // Assuming references.bib is the main bibliography file
      fetch('/assets/docs/bibliography/references.bib')
        .then(res => res.text())
        .then(bib => {
          const entries = bibtexParse.toJSON(bib);
          this.bibMap = new Map(entries.map(e=>[e.citationKey,e]));
          this.assignNumbers();
        });
    },
  
    assignNumbers() {
      let i=1;
      document.querySelectorAll('z-cite[key]').forEach(citeEl => {
        const key = citeEl.getAttribute('key');
        const entry = this.bibMap.get(key);
        citeEl.setAttribute('number', i++);
        if (entry) {
          const preview = document.createElement('div');
          preview.className = 'citation-preview';
          preview.innerHTML = this.formatEntry(entry);
          citeEl.appendChild(preview);
        }
      });
    },
  
    formatEntry(entry) {
      const title = entry.entryTags.title || '';
      const author = entry.entryTags.author || '';
      const journal = entry.entryTags.journal || entry.entryTags.booktitle || '';
      const year = entry.entryTags.year || '';
      return `
        <div class="font-medium mb-1">${title}</div>
        <div class="text-sm">${author}</div>
        <div class="text-sm text-gray-500 mt-1">${journal} ${year}</div>
      `;
    }
  };
  
  // Code Blocks
  const codeBlocks = {
    init() {
      document.querySelectorAll('z-code').forEach(block => {
        const header = block.querySelector('.header');
        if (!header) return;
        const btn = document.createElement('button');
        btn.className='copy-btn';
        btn.innerHTML='<i data-lucide="copy"></i>';
        btn.onclick=()=>this.copyCode(block,btn);
        header.appendChild(btn);
      });
    },
    async copyCode(block, btn) {
      const code = block.querySelector('pre').textContent;
      await navigator.clipboard.writeText(code);
      btn.innerHTML='<i data-lucide="check"></i>';
      setTimeout(()=>btn.innerHTML='<i data-lucide="copy"></i>',2000);
    }
  };
  