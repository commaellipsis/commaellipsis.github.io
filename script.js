// Minimal JS to fetch and render posts. Editable.

async function fetchJSON(path){
  const r = await fetch(path, {cache: 'no-cache'});
  if (!r.ok) throw new Error('fetch error: '+r.status);
  return r.json();
}

// Load the index (posts.json)
async function loadIndex(){
  try{
    const posts = await fetchJSON('posts.json');
    renderIndex(posts);
  }catch(e){
    document.getElementById('posts-list').innerHTML = '<p>Could not load posts. Make sure posts.json exists.</p>';
    console.error(e);
  }
}

function renderIndex(posts){
  const container = document.getElementById('posts-list');
  if (!Array.isArray(posts) || posts.length===0){
    container.innerHTML = '<p>No posts yet. Add one to <code>/posts/</code> and list it in <code>posts.json</code>.</p>';
    return;
  }
  const html = posts.map(p => {
    return `
      <article class="post-item">
        <h2><a href="post.html?post=${encodeURIComponent(p.slug)}">${escapeHtml(p.title)}</a></h2>
        <div class="meta">${escapeHtml(p.date)} • ${escapeHtml(p.author || '')}</div>
        <p class="post-excerpt">${escapeHtml(p.excerpt || '')}</p>
      </article>
    `
  }).join('\n');
  container.innerHTML = html;
}

// Load a post page using query ?post=slug
async function loadPostFromQuery(){
  const q = new URLSearchParams(location.search);
  const slug = q.get('post') || '';
  if (!slug){
    document.getElementById('post-article').innerHTML = '<p>No post specified.</p>';
    return;
  }
  try{
    // Optional: read posts.json to get title/date meta
    let meta = null;
    try {meta = await fetchJSON('posts.json')} catch(e){}
    if (meta && Array.isArray(meta)){
      meta = meta.find(x=>x.slug===slug) || null;
    }
    const mdResp = await fetch('posts/'+slug+'.md');
    if (!mdResp.ok){
      document.getElementById('post-article').innerHTML = '<p>Post not found: '+escapeHtml(slug)+'</p>';
      return;
    }
    const md = await mdResp.text();
    const html = marked.parse(md);
    const title = meta?.title || extractTitleFromMarkdown(md) || slug;
    const date = meta?.date ? `<div class="meta">${escapeHtml(meta.date)}</div>` : '';
    document.getElementById('post-article').innerHTML = `
      <h1>${escapeHtml(title)}</h1>
      ${date}
      <section class="content">${html}</section>
    `;
    // Optional: run any further enhancement (e.g., syntax highlighting)
  }catch(e){
    document.getElementById('post-article').innerHTML = '<p>Error loading post.</p>';
    console.error(e);
  }
}

function extractTitleFromMarkdown(md){
  const m = md.match(/^#\s+(.+)$/m);
  return m ? m[1].trim() : null;
}

function escapeHtml(s){
  if (!s) return '';
  return String(s).replace(/[&<>\"]+/g, function(c){
    return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c] || c;
  });
}


/*
posts.json example (place at repo root):
[
  {
    "title": "Example Post",
    "slug": "example-post",
    "date": "2025-08-11",
    "excerpt": "A short demo post to show how this works.",
    "author": "Your Name"
  }
]
*/
