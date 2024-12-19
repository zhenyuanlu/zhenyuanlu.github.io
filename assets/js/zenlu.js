// zenlu.js
// Changes:
// - Remove [#number] in the tooltip references.
// - Only two lines in references (line 2 includes doi).
// - Lighter gray text in references.
// - Tooltip width now half of frame width (handled by CSS).
// - Same minimalistic styling for pdf/link inline.
// - No bracketed numbers in popup, keep them in references section only.

document.addEventListener('DOMContentLoaded', () => {
  const content = document.querySelector('#blog-content');
  if (!content) return;

  const bibTag = document.querySelector('z-bibliography[src]');
  const appendix = document.querySelector('z-appendix');
  if (!bibTag || !appendix) return;

  const footnoteContainer = appendix.querySelector('z-footnote');
  const citationListContainer = appendix.querySelector('z-citation-list');
  if (!footnoteContainer || !citationListContainer) return;

  const bibSrc = bibTag.getAttribute('src');

  // FOOTNOTES
  const footnoteElements = content.querySelectorAll('z-fn[key]');
  let footnotes = [];
  footnoteElements.forEach(fn => {
    const key = fn.getAttribute('key');
    const text = fn.innerHTML.trim();
    footnotes.push({ key, text });
  });

  footnoteElements.forEach((fn, i) => {
    const sup = document.createElement('sup');
    sup.className = 'footnote cursor-pointer text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 transition-colors';
    sup.setAttribute('data-fn-index', i);
    sup.textContent = '†';
    fn.replaceWith(sup);
  });

  if (footnotes.length > 0) {
    const footnoteHeading = document.createElement('h3');
    footnoteHeading.textContent = 'Footnotes';
    footnoteHeading.className = 'footnotes-heading';
    footnoteContainer.appendChild(footnoteHeading);

     // Add an ID so the TOC can jump here
    footnoteHeading.id = 'footnotes';

    footnotes.forEach((fnObj, i) => {
      const div = document.createElement('div');
      div.className = 'footnote-item';

      const label = document.createElement('span');
      label.className = 'footnote-label';
      label.textContent = (i+1) + '.';

      const p = document.createElement('p');
      p.innerHTML = fnObj.text;

      div.appendChild(label);
      div.appendChild(p);
      footnoteContainer.appendChild(div);
    });
  }

  // CITATIONS
  const citeElements = content.querySelectorAll('z-cite[key]');
  let citationKeysInOrder = [];
  citeElements.forEach(el => {
    const keysStr = el.getAttribute('key');
    const keys = keysStr.split(',').map(k => k.trim()).filter(k => k);
    keys.forEach(k => {
      if (!citationKeysInOrder.includes(k)) citationKeysInOrder.push(k);
    });
  });

  citeElements.forEach(el => {
    const keysStr = el.getAttribute('key');
    const keys = keysStr.split(',').map(k => k.trim()).filter(k => k);
    const indices = keys.map(k => citationKeysInOrder.indexOf(k) + 1).sort((a,b)=>a-b);

    let label = '';
    if (indices.length === 1) {
      label = `[${indices[0]}]`;
    } else {
      let ranges = [];
      let start = indices[0];
      let prev = start;
      for (let i = 1; i < indices.length; i++) {
        const cur = indices[i];
        if (cur === prev + 1) {
          prev = cur;
        } else {
          if (start === prev) ranges.push(start.toString());
          else ranges.push(`${start}–${prev}`);
          start = cur;
          prev = cur;
        }
      }
      if (start === prev) ranges.push(start.toString());
      else ranges.push(`${start}–${prev}`);
      label = '[' + ranges.join(',') + ']';
    }

    const sup = document.createElement('sup');
    sup.className = 'citation cursor-pointer text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 transition-colors';
    sup.setAttribute('data-cite-keys', keys.join(','));
    sup.textContent = label;
    el.replaceWith(sup);
  });

  // Load bibliography
  fetch(bibSrc)
    .then(res => res.text())
    .then(bibContent => {
      const references = parseBibtex(bibContent);
      const citedRefs = citationKeysInOrder.map(k => references.find(r => r.key === k)).filter(Boolean);

      // Insert references
      if (citedRefs.length > 0) {
        const refHeading = document.createElement('h3');
        refHeading.textContent = 'References';
        refHeading.className = 'references-heading';
        citationListContainer.appendChild(refHeading);

        // Add an ID so the TOC can jump to references
        refHeading.id = 'references';

        citedRefs.forEach((ref, i) => {
          const div = document.createElement('div');
          div.className = 'reference-item';

          const label = document.createElement('span');
          label.className = 'reference-label';
          label.textContent = '[' + (i+1) + ']';

          const content = document.createElement('div');
          content.className = 'reference-content';
          content.innerHTML = formatReference(ref);

          div.appendChild(label);
          div.appendChild(content);
          citationListContainer.appendChild(div);
        });
      }

      // Tooltip setup
      const tooltip = document.createElement('div');
      tooltip.className = 'citation-tooltip';
      tooltip.style.display = 'none';
      tooltip.style.position = 'absolute';
      tooltip.style.zIndex = '9999';
      document.body.appendChild(tooltip);

      let isOverTooltip = false;
      let isOverCitation = false;

      function showTooltip(html, target) {
        tooltip.innerHTML = html;
        tooltip.style.display = 'block';
        positionTooltip(target, tooltip);
      }

      function hideTooltipIfNeeded() {
        if (!isOverTooltip && !isOverCitation) {
          tooltip.style.display = 'none';
        }
      }

      tooltip.addEventListener('mouseenter', () => {
        isOverTooltip = true;
      });

      tooltip.addEventListener('mouseleave', () => {
        isOverTooltip = false;
        setTimeout(hideTooltipIfNeeded, 100);
      });

      // Citations hover
      document.querySelectorAll('sup.citation').forEach((sup) => {
        const keys = sup.getAttribute('data-cite-keys').split(',').map(k => k.trim());
        const refsToShow = keys.map(k => {
          const idx = citationKeysInOrder.indexOf(k);
          if (idx === -1) return null;
          return { index: idx+1, ref: citedRefs[idx] };
        }).filter(Boolean);

        sup.addEventListener('mouseenter', () => {
          isOverCitation = true;
          // Remove numbering in the popup
          const html = refsToShow.map(r => {
            const formattedRef = formatReference(r.ref);
            return `<div class="citation-tooltip-item">
              <div class="citation-tooltip-ref">${formattedRef}</div>
            </div>`;
          }).join('');
          showTooltip(html, sup);
        });

        sup.addEventListener('mousemove', () => {
          positionTooltip(sup, tooltip);
        });

        sup.addEventListener('mouseleave', () => {
          isOverCitation = false;
          setTimeout(hideTooltipIfNeeded, 100);
        });
      });

      // Footnotes hover
      document.querySelectorAll('sup.footnote').forEach((sup) => {
        const fnIndex = parseInt(sup.getAttribute('data-fn-index'), 10);
        const fn = footnotes[fnIndex];
        if (!fn) return;

        sup.addEventListener('mouseenter', () => {
          isOverCitation = true;
          showTooltip(`<div class="citation-tooltip-ref">${fn.text}</div>`, sup);
        });

        sup.addEventListener('mousemove', () => {
          positionTooltip(sup, tooltip);
        });

        sup.addEventListener('mouseleave', () => {
          isOverCitation = false;
          setTimeout(hideTooltipIfNeeded, 100);
        });
      });

    })
    .catch(err => console.error('Error loading bibliography:', err));

  // Byline styling logic
  const headings = content.querySelectorAll('h1, h2, h3, h4, h5, h6');
  headings.forEach(h => {
    const next = h.nextElementSibling;
    if (next && next.tagName === 'Z-BYLINE') {
      if (h.tagName.toLowerCase() === 'h1') {
        next.classList.add('z-byline-fullwidth');
      } else if (h.tagName.toLowerCase() === 'h2') {
        next.classList.add('z-byline-framework');
      }
    }
  });

  function positionTooltip(target, tooltip) {
    const rect = target.getBoundingClientRect();
    const ttRect = tooltip.getBoundingClientRect();
    const scrollY = window.scrollY || window.pageYOffset;
    const scrollX = window.scrollX || window.pageXOffset;
    const margin = 12;

    let top = scrollY + rect.top - ttRect.height - margin;
    let left = scrollX + rect.left + (rect.width / 2) - (ttRect.width / 2);

    if (left < margin) left = margin;
    if ((left + ttRect.width) > window.innerWidth) 
      left = window.innerWidth - ttRect.width - margin;
    if (top < scrollY) top = scrollY + rect.bottom + margin;

    tooltip.style.top = `${top}px`;
    tooltip.style.left = `${left}px`;
  }

  function formatReference(ref) {
    // Two lines total:
    // Line 1: Title [pdf/link if any]
    // Line 2: Authors (Year) Source Volume Pages doi:xxx (if present)

    let lines = [];

    // Line 1
    let line1 = '';
    if (ref.title) {
      line1 += `<span class="ref-title">${ref.title}</span>`;
    }

    let extras = [];
    if (ref.pdf) {
      extras.push(`<a href="${ref.pdf}" target="_blank" rel="noopener" class="ref-inline-extras a">[pdf]</a>`);
    }
    if (ref.url) {
      extras.push(`<a href="${ref.url}" target="_blank" rel="noopener" class="ref-inline-extras a">[link]</a>`);
    }

    if (extras.length > 0) {
      // join extras with a space
      line1 += ` <span class="ref-inline-extras">${extras.join(' ')}</span>`;
    }
    if (line1) lines.push(line1);

    // Line 2
    let line2Parts = [];
    if (ref.authors) line2Parts.push(ref.authors);
    if (ref.year) line2Parts.push(`(${ref.year})`);
    let source = ref.journal || ref.booktitle || ref.publisher || '';
    if (source) line2Parts.push(source);
    if (ref.volume) line2Parts.push(ref.volume);
    if (ref.pages) line2Parts.push(ref.pages);
    if (ref.doi) {
      line2Parts.push(`doi:${ref.doi}`);
    }

    if (line2Parts.length > 0) {
      lines.push(`<span class="ref-details">${line2Parts.join(' ')}</span>`);
    }

    return lines.join('<br>');
  }

  function parseBibtex(bibString) {
    const entries = bibString.split('@').slice(1);
    const refs = [];

    entries.forEach(entryText => {
      entryText = entryText.trim();
      const typeMatch = entryText.match(/^(\w+)\s*\{([^,]+),/i);
      if (!typeMatch) return;
      const key = typeMatch[2].trim();

      const lastBrace = entryText.lastIndexOf('}');
      const body = entryText.substring(entryText.indexOf('{')+1, lastBrace);

      const fields = parseFields(body);
      refs.push({
        key,
        authors: fields.author || '',
        title: fields.title || '',
        year: fields.year || '',
        journal: fields.journal || '',
        booktitle: fields.booktitle || '',
        publisher: fields.publisher || '',
        volume: fields.volume || '',
        pages: fields.pages || '',
        doi: fields.doi || '',
        url: fields.url || '',
        pdf: fields.pdf || '',
        html: fields.html || ''
      });
    });

    return refs;
  }

  function parseFields(body) {
    const lines = body.split('\n');
    let fields = {};
    let currentField = null;
    let currentValue = '';

    lines.forEach(ln => {
      let line = ln.trim();
      if (line === '') return;

      let eqIndex = line.indexOf('=');
      if (eqIndex > -1) {
        if (currentField) {
          fields[currentField.toLowerCase()] = cleanValue(currentValue);
          currentField = null;
          currentValue = '';
        }
        let fieldName = line.slice(0, eqIndex).trim().toLowerCase();
        let valPart = line.slice(eqIndex+1).trim();
        currentField = fieldName;
        currentValue = valPart;
      } else {
        if (currentField) {
          currentValue += ' ' + line;
        }
      }
    });

    if (currentField) {
      fields[currentField.toLowerCase()] = cleanValue(currentValue);
    }

    return fields;
  }

  function cleanValue(val) {
    val = val.trim();
    val = val.replace(/^[{"]+|[}"]+$/g, '');
    val = val.replace(/[},]+$/g, '');
    val = val.replace(/}|\.$/g, '');
    return val.trim();
  }
});
