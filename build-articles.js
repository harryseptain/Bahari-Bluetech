#!/usr/bin/env node
/**
 * build-articles.js
 * -----------------
 * Reads every .md file in content/articles/, parses frontmatter,
 * converts Markdown body to HTML, renders articles/_article-template.html,
 * and writes the output to articles/{{slug}}.html.
 *
 * Also writes articles-index.json for the resources.html listing page.
 *
 * Usage:
 *   npm install gray-matter marked
 *   node build-articles.js
 */

'use strict';

const fs   = require('fs');
const path = require('path');

/* ── deps ── */
let matter, marked;
try {
  matter = require('gray-matter');
  marked = require('marked').marked;
} catch (e) {
  console.error('Missing dependencies. Run: npm install gray-matter marked');
  process.exit(1);
}

/* ── paths ── */
const CONTENT_DIR = path.join(__dirname, 'content', 'articles');
const TEMPLATE    = path.join(__dirname, 'articles', '_article-template.html');
const OUT_DIR     = path.join(__dirname, 'articles');
const INDEX_FILE  = path.join(__dirname, 'articles-index.json');

/* ── category labels ── */
const CAT_LABELS = {
  'blue-economy':  'Blue Economy',
  'vessel-design': 'Vessel Design',
  'aquaculture':   'Aquaculture',
  'governance':    'Ocean Governance',
  'deep-sea':      'Deep Sea Mining',
  'sustainability':'Sustainability',
  'innovation':    'Innovation',
};

/* ── helpers ── */
function slugify(str) {
  return (str || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function fmtDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
}

function initial(name) {
  return (name || 'B').trim()[0].toUpperCase();
}

/* ── template renderer ── */
function render(template, data) {
  let out = template;

  // {% if featured_image %} ... {% endif %}
  out = out.replace(
    /\{%\s*if\s+featured_image\s*%\}([\s\S]*?)\{%\s*endif\s*%\}/g,
    (_, inner) => data.featured_image ? inner : ''
  );

  // {% unless featured_image %} ... {% endunless %}
  out = out.replace(
    /\{%\s*unless\s+featured_image\s*%\}([\s\S]*?)\{%\s*endunless\s*%\}/g,
    (_, inner) => data.featured_image ? '' : inner
  );

  // {% if reading_time %} ... {% endif %}
  out = out.replace(
    /\{%\s*if\s+reading_time\s*%\}([\s\S]*?)\{%\s*endif\s*%\}/g,
    (_, inner) => data.reading_time ? inner : ''
  );

  // {{key | default: fallback_key}}
  out = out.replace(
    /\{\{(\w+)\s*\|\s*default:\s*(\w+)\}\}/g,
    (_, k, fb) => (data[k] && String(data[k]).trim()) ? data[k] : (data[fb] || '')
  );

  // {{key}} — plain substitution
  out = out.replace(
    /\{\{(\w+)\}\}/g,
    (_, k) => data[k] !== undefined ? data[k] : ''
  );

  return out;
}

/* ── main ── */
function build() {
  if (!fs.existsSync(CONTENT_DIR)) {
    console.log('content/articles does not exist yet — nothing to build.');
    fs.writeFileSync(INDEX_FILE, JSON.stringify([], null, 2));
    return;
  }

  const templateSrc = fs.existsSync(TEMPLATE)
    ? fs.readFileSync(TEMPLATE, 'utf8')
    : null;

  if (!templateSrc) {
    console.error('Template not found at', TEMPLATE);
    process.exit(1);
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });

  const files = fs.readdirSync(CONTENT_DIR).filter(f => f.endsWith('.md'));
  const index = [];

  for (const file of files) {
    const src = fs.readFileSync(path.join(CONTENT_DIR, file), 'utf8');
    const { data: fm, content: body } = matter(src);

    /* Derive slug */
    const slug = fm.slug || slugify(fm.title) || path.basename(file, '.md');

    /* Markdown body → HTML */
    const contentHtml = marked(body || '');

    /* Build FAQ HTML automatically from frontmatter list */
    let faqHtml = '';
    if (fm.faq && Array.isArray(fm.faq) && fm.faq.length > 0) {
      faqHtml = '<div class="faq-block">' +
        fm.faq.map(function(item) {
          return '<div class="faq-item">' +
            '<div class="faq-q">' + (item.question || '') + '</div>' +
            '<div class="faq-a">' + (item.answer || '') + '</div>' +
            '</div>';
        }).join('') +
        '</div>';
    }

    /* Template data */
    const tplData = {
      title:           fm.title           || '',
      slug,
      category:        fm.category        || '',
      category_label:  CAT_LABELS[fm.category] || fm.category || '',
      date:            fm.date            || '',
      date_formatted:  fmtDate(fm.date),
      author:          fm.author          || 'Bahari BlueTech',
      author_initial:  initial(fm.author),
      reading_time:    fm.reading_time    || '',
      featured_image:  fm.featured_image  || '',
      excerpt:         fm.excerpt         || '',
      content:         contentHtml,
      faq:             faqHtml,
      seo_title:       fm.seo_title       || fm.title || '',
      seo_description: fm.seo_description || fm.excerpt || '',
    };

    /* Render */
    const html = render(templateSrc, tplData);

    /* Write article HTML */
    const outFile = path.join(OUT_DIR, slug + '.html');
    fs.writeFileSync(outFile, html);
    console.log('✓ articles/' + slug + '.html');

    /* Index entry */
    index.push({
      title:          tplData.title,
      slug,
      category:       tplData.category,
      date:           tplData.date,
      author:         tplData.author,
      reading_time:   tplData.reading_time,
      featured_image: tplData.featured_image,
      excerpt:        tplData.excerpt,
    });
  }

  /* Sort newest first */
  index.sort((a, b) => new Date(b.date) - new Date(a.date));

  fs.writeFileSync(INDEX_FILE, JSON.stringify(index, null, 2));
  console.log('✓ articles-index.json (' + index.length + ' articles)');
}

build();
