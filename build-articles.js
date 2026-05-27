#!/usr/bin/env node
/**
 * build-articles.js
 * -----------------
 * Reads every .md file in content/articles/, parses frontmatter,
 * converts Markdown body to HTML, renders articles/_article-template.html,
 * and writes the output to articles/{{slug}}.html.
 *
 * Also writes articles-index.json, which resources.html uses to
 * dynamically load article cards at runtime (no build required for the
 * listing page — only article pages need a build step).
 *
 * Usage:
 *   npm install gray-matter marked
 *   node build-articles.js
 *
 * Or add to package.json:
 *   "scripts": { "build": "node build-articles.js" }
 */

'use strict';

const fs   = require('fs');
const path = require('path');

/* ── deps (install with: npm install gray-matter marked) ── */
let matter, marked;
try {
  matter = require('gray-matter');
  marked = require('marked').marked;
} catch (e) {
  console.error('Missing dependencies. Run: npm install gray-matter marked');
  process.exit(1);
}

/* ── paths ── */
const CONTENT_DIR  = path.join(__dirname, 'content', 'articles');
const TEMPLATE     = path.join(__dirname, 'articles', '_article-template.html');
const OUT_DIR      = path.join(__dirname, 'articles');
const INDEX_FILE   = path.join(__dirname, 'articles-index.json');

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

/* ── render template ── */
function render(template, data) {
  return template
    /* Simple {{key}} substitution */
    .replace(/\{\{(\w+)\}\}/g, (_, k) => data[k] !== undefined ? data[k] : '')
    /* Liquid-style default: {{key | default: fallback}} */
    .replace(/\{\{(\w+)\s*\|\s*default:\s*(\w+)\}\}/g, (_, k, fb) =>
      data[k] || data[fb] || '')
    /* Liquid-style unless block for featured_image */
    .replace(/\{%\s*unless\s+featured_image\s*%\}([\s\S]*?)\{%\s*endunless\s*%\}/g,
      (_, inner) => data.featured_image ? '' : inner)
    /* Liquid-style if block for featured_image */
    .replace(/\{%\s*if\s+featured_image\s*%\}([\s\S]*?)\{%\s*endif\s*%\}/g,
      (_, inner) => data.featured_image ? inner : '');
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
    const src   = fs.readFileSync(path.join(CONTENT_DIR, file), 'utf8');
    const { data: fm, content: body } = matter(src);

    /* Derive slug from frontmatter or filename */
    const slug = fm.slug || slugify(fm.title) || path.basename(file, '.md');

    /* Render body Markdown → HTML */
    const contentHtml = marked(body || '');

    /* Build template data */
    const tplData = {
      title:          fm.title         || '',
      slug,
      category:       fm.category      || '',
      category_label: CAT_LABELS[fm.category] || fm.category || '',
      date:           fm.date          || '',
      date_formatted: fmtDate(fm.date),
      author:         fm.author        || 'Bahari BlueTech',
      author_initial: initial(fm.author),
      reading_time:   fm.reading_time  || '',
      featured_image: fm.featured_image || '',
      excerpt:        fm.excerpt       || '',
      content:        contentHtml,
      seo_title:      fm.seo_title     || fm.title || '',
      seo_description:fm.seo_description || fm.excerpt || '',
    };

    /* Render HTML */
    const html = render(templateSrc, tplData);

    /* Write article HTML */
    const outFile = path.join(OUT_DIR, slug + '.html');
    fs.writeFileSync(outFile, html);
    console.log('✓ articles/' + slug + '.html');

    /* Collect index entry */
    index.push({
      title:         tplData.title,
      slug,
      category:      tplData.category,
      date:          tplData.date,
      author:        tplData.author,
      reading_time:  tplData.reading_time,
      featured_image:tplData.featured_image,
      excerpt:       tplData.excerpt,
    });
  }

  /* Sort newest first */
  index.sort((a, b) => new Date(b.date) - new Date(a.date));

  /* Write index */
  fs.writeFileSync(INDEX_FILE, JSON.stringify(index, null, 2));
  console.log('✓ articles-index.json (' + index.length + ' articles)');
}

build();
