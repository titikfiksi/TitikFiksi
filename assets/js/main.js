/* =========================================================
   TITIK FIKSI — Main Controller (Smart Typography & Monetization)
   Fitur: Auto-Split Titles, Premium CTA Injection, Deep Linking
   ========================================================= */

const TitikFiksi = (() => {
  const PATHS = {
    settings: "/content/settings/settings_general.json",
    home: "/content/home/home.json",
    works: "/content/works/works.json",
    writings: "/content/writings/writings.json",
    chaptersDir: "/content/chapters/" 
  };

  const Utils = {
    getQueryParam(param) { return new URLSearchParams(window.location.search).get(param); },
    formatDate(dateString) {
      if (!dateString) return "";
      try { return new Date(dateString).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }); } 
      catch (e) { return dateString; }
    },
    async fetchJSON(path) {
      try {
        const timestamp = new Date().getTime(); 
        const url = `${path}?v=${timestamp}`; 
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) return null;
        return await res.json();
      } catch (e) { return null; }
    },
    setText(id, text) {
      const el = document.getElementById(id);
      if (el) el.textContent = text;
    },
    // 🔥 SMART TITLE FORMATTER (SPLIT JUDUL & JARGON) 🔥
    formatTitleHTML(rawTitle) {
      if (!rawTitle) return "";
      // Regex cari teks di dalam tanda kutip "..." atau kurung (...)
      const match = rawTitle.match(/["(](.*?)[")]/);
      
      if (match) {
        const subtitle = match[0]; // Bagian kutipan
        const mainTitle = rawTitle.replace(match[0], "").trim(); // Judul utama
        return `<span class="title-main">${mainTitle}</span><span class="title-sub">${subtitle}</span>`;
      }
      return `<span class="title-main">${rawTitle}</span>`;
    },
    renderMarkdown(text) {
      if (!text) return "";
      try {
        let clean = text.replace(/\\/g, ''); 
        const paragraphs = clean.split(/\n\s*\n/);
        return paragraphs.map(para => {
          if (!para || para.trim().length === 0) return "";
          let formatted = para.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>').replace(/\*(.*?)\*/g, '<i>$1</i>').replace(/__(.*?)__/g, '<u>$1</u>').replace(/\n/g, '<br>'); 
          return `<p>${formatted}</p>`;
        }).join("");
      } catch (e) { return text; }
    }
  };

  /* --- 1. GLOBAL SETTINGS --- */
  async function initGlobalSettings() {
    const settings = await Utils.fetchJSON(PATHS.settings);
    const homeData = await Utils.fetchJSON(PATHS.home);

    if (settings) {
      if (settings.brand_logo) document.querySelectorAll('img[data-brand="logo"]').forEach(img => img.src = settings.brand_logo);
      if (settings.brand_favicon) {
        let link = document.querySelector("link[rel~='icon']") || document.createElement('link');
        link.rel = 'icon'; link.href = settings.brand_favicon; document.head.appendChild(link);
      }
      if (settings.site_title && (location.pathname === '/' || location.pathname.includes('index'))) {
          document.title = settings.site_title;
      }
    }
    if (homeData && homeData.socials) {
       // Social logic here if needed
    }
  }

  /* --- 2. BERANDA --- */
  async function initHomePage() {
    const data = await Utils.fetchJSON(PATHS.home);
    if (!data || !data.hero) return;

    Utils.setText("hero-title", data.hero.title);
    Utils.setText("hero-subtitle", data.hero.subtitle);
    Utils.setText("hero-intro", data.hero.intro);
    
    // Video Split Logic
    const ytWrapper = document.getElementById("hero-youtube-wrapper");
    const ytContainer = document.getElementById("hero-youtube");
    if (data.hero.youtube_embed && ytContainer) {
      let url = data.hero.youtube_embed.replace("watch?v=", "embed/").replace("youtu.be/", "www.youtube.com/embed/");
      ytContainer.innerHTML = `<iframe src="${url}" title="YouTube" frameborder="0" allowfullscreen></iframe>`;
      Utils.setText("hero-video-title", data.hero.video_title || "Trailer Resmi");
      Utils.setText("hero-video-desc", data.hero.video_desc || "Tonton cuplikan cerita terbaru.");
      const btn = document.getElementById("hero-video-link");
      if(btn && data.hero.video_link) { btn.href=data.hero.video_link; btn.textContent=data.hero.video_btn_text||"Tonton"; btn.style.display="inline-block"; }
      if(ytWrapper) ytWrapper.style.display = "grid";
    }

    // Novel Links & Ads logic same as before...
    initFeaturedWritings();
  }

  async function initFeaturedWritings() {
    const container = document.getElementById("home-featured-container"); if (!container) return;
    const data = await Utils.fetchJSON(PATHS.writings); if (!data || !data.writings) return;
    const featured = data.writings.filter(w => w.featured === true);
    if (featured.length === 0) { container.innerHTML = `<p style="font-size:13px; color:var(--muted);">Belum ada info terbaru.</p>`; return; }
    const topItem = featured[0]; 
    container.innerHTML = `
        <div style="margin-bottom:10px;">
            <div style="font-size:10px; text-transform:uppercase; color:var(--brand); margin-bottom:4px; font-weight:700;">${topItem.category||'Update'}</div>
            <h4 style="margin:0 0 6px; font-size:14px; line-height:1.4;">${topItem.title}</h4>
            <p style="font-size:12px; margin:0; color:var(--text-2); line-height:1.5;">${topItem.content ? topItem.content.substring(0, 70) + '...' : ''}</p>
        </div>
        <a href="writings.html" style="font-size:11px; font-weight:700; color:var(--brand); text-decoration:none;">Baca Selengkapnya →</a>
    `;
  }

  /* --- 3. DETAIL NOVEL --- */
  async function initNovelDetail() {
    const slug = Utils.getQueryParam("slug"); if (!slug) return; Utils.setText("work-title", "Memuat...");
    const data = await Utils.fetchJSON(PATHS.works); const novel = data?.works?.find(w => w.slug === slug);
    if (!novel) { Utils.setText("work-title", "Novel Tidak Ditemukan"); return; }
    
    document.title = `${novel.title}`; 
    
    // Apply Smart Title Formatting
    const titleContainer = document.getElementById("work-title");
    if(titleContainer) titleContainer.innerHTML = Utils.formatTitleHTML(novel.title);

    Utils.setText("work-genre", `${novel.genre}`); Utils.setText("work-status", `${novel.status}`);
    const synopsisBox = document.getElementById("work-synopsis"); if(synopsisBox) synopsisBox.innerHTML = Utils.renderMarkdown(novel.synopsis);
    const imgEl = document.getElementById("work-cover-img"); if (imgEl) imgEl.src = novel.cover || "assets/images/defaults/cover-default.jpg";
    
    // Load Chapters
    const listContainer = document.getElementById("chapters-list"); listContainer.innerHTML = '<div>Mencari bab...</div>';
    let chapterCount = 1, foundChapters = [], gapCount = 0;
    while (chapterCount <= 300 && gapCount < 5) {
      const code = String(chapterCount).padStart(2, '0'); const chapData = await Utils.fetchJSON(`${PATHS.chaptersDir}${slug}-${code}.json`);
      if (chapData) { if (chapData.published !== false) foundChapters.push({ ...chapData, code }); gapCount = 0; } else gapCount++; chapterCount++;
    }
    listContainer.innerHTML = "";
    if (foundChapters.length === 0) listContainer.innerHTML = '<div class="glass-panel" style="padding:15px; text-align:center;">Belum ada bab.</div>';
    else {
      foundChapters.sort((a,b) => parseInt(a.code) - parseInt(b.code));
      foundChapters.forEach(chap => {
        const item = document.createElement("a"); item.className = "chapter-item"; item.href = `chapter.html?novel=${slug}&chapter=${chap.code}`;
        item.innerHTML = `<div style="display:flex; align-items:center;"><span class="chap-number">#${parseInt(chap.code)}</span><div class="chap-info"><strong>${chap.title}</strong><span style="font-size:11px; color:var(--muted);">${Utils.formatDate(chap.date)}</span></div></div> <span style="font-size:12px;">📄</span>`;
        listContainer.appendChild(item);
      });
    }
  }

  /* --- 4. READER MODE & PREMIUM CTA --- */
  async function initReadChapter() {
    window.scrollTo(0,0); const novelSlug = Utils.getQueryParam("novel"); const chapCode = Utils.getQueryParam("chapter");
    if (!novelSlug || !chapCode) return;
    
    const data = await Utils.fetchJSON(`${PATHS.chaptersDir}${novelSlug}-${chapCode}.json`);
    if (!data) { Utils.setText("chapter-title", "Bab Tidak Ditemukan"); return; }
    
    document.title = `${data.title}`; 
    Utils.setText("chapter-top", `CHAPTER ${parseInt(chapCode)}`); 
    Utils.setText("chapter-title", data.title);
    const contentBox = document.getElementById("chapter-content"); 
    if(contentBox) contentBox.innerHTML = Utils.renderMarkdown(data.content);

    // 🔥 PREMIUM CTA INJECTION 🔥
    const linkBox = document.getElementById("chapter-external-links");
    if(linkBox && data.external_links) {
        const l = data.external_links;
        // Hanya tampilkan jika ada minimal 1 link monetisasi
        if((l.karyakarsa && l.karyakarsa.length > 5) || (l.wattpad && l.wattpad.length > 5) || (l.goodnovel && l.goodnovel.length > 5)) {
            let btns = "";
            if(l.karyakarsa) btns += `<a href="${l.karyakarsa}" target="_blank" class="btn-cta cta-karyakarsa">🎁 Karyakarsa</a>`;
            if(l.wattpad) btns += `<a href="${l.wattpad}" target="_blank" class="btn-cta cta-wattpad">🟠 Wattpad</a>`;
            if(l.goodnovel) btns += `<a href="${l.goodnovel}" target="_blank" class="btn-cta cta-goodnovel">📘 GoodNovel</a>`;
            if(l.custom_url) btns += `<a href="${l.custom_url}" target="_blank" class="btn-cta cta-generic">🔗 ${l.custom_text||'Link Lain'}</a>`;
            
            linkBox.innerHTML = `
              <div class="cta-premium-card">
                 <h4>Suka dengan cerita ini?</h4>
                 <p>Jangan tunggu lama. Baca bab selanjutnya lebih cepat dan dukung penulis di platform resmi:</p>
                 <div class="cta-buttons">${btns}</div>
              </div>
            `;
        } else {
            linkBox.innerHTML = "";
        }
    }

    const btnBack = document.getElementById("btn-back-novel"); if(btnBack) btnBack.href = `novel.html?slug=${novelSlug}`;
    
    // Nav Buttons
    const cur = parseInt(chapCode); 
    const btnPrev = document.getElementById("btn-prev"); 
    if(btnPrev) { if(cur>1) { btnPrev.href=`chapter.html?novel=${novelSlug}&chapter=${String(cur-1).padStart(2,'0')}`; btnPrev.style.display="inline-flex";} else btnPrev.style.display="none"; }
    
    const btnNext = document.getElementById("btn-next"); 
    if(btnNext) { 
        // Cek next chapter existence
        const nxt = await Utils.fetchJSON(`${PATHS.chaptersDir}${novelSlug}-${String(cur+1).padStart(2,'0')}.json`); 
        if(nxt){ btnNext.href=`chapter.html?novel=${novelSlug}&chapter=${String(cur+1).padStart(2,'0')}`; btnNext.style.display="inline-flex";} 
        else btnNext.style.display="none"; 
    }
  }

  /* --- 5. WORKS LIST --- */
  async function initWorksList() {
    const container = document.getElementById("works-container"); if(!container) return;
    const data = await Utils.fetchJSON(PATHS.works); 
    if(!data || !data.works){ container.innerHTML = '<div class="glass-panel" style="padding:20px;">Belum ada novel.</div>'; return; }
    container.innerHTML = "";
    
    data.works.forEach(work => {
      const card = document.createElement("a"); card.href = `novel.html?slug=${work.slug}`; card.className = "card-work glass-panel";
      // Apply Smart Title juga di kartu
      const titleHTML = Utils.formatTitleHTML(work.title);
      
      card.innerHTML = `
        <div class="card-cover"><img src="${work.cover||'assets/images/defaults/cover-default.jpg'}" loading="lazy"></div>
        <div style="padding: 12px;">
            <div class="card-meta"><span class="badge">${work.status}</span></div>
            <h4>${titleHTML}</h4>
        </div>
      `;
      container.appendChild(card);
    });
  }

  async function initWritingsList() {
    const container = document.getElementById("writings-container"); if(!container) return;
    const data = await Utils.fetchJSON(PATHS.writings); if(!data || !data.writings){ container.innerHTML = '<div>Kosong.</div>'; return; }
    container.innerHTML = "";
    data.writings.sort((a,b)=>new Date(b.date)-new Date(a.date)).forEach(item => {
        const row = document.createElement("div"); row.className="glass-panel"; row.style.cssText="margin-bottom:15px; padding:22px; border-left:4px solid var(--brand);";
        row.innerHTML=`<div style="display:flex; justify-content:space-between; margin-bottom:8px;"><span style="font-size:0.8rem; color:var(--brand); font-weight:bold;">${item.category||'Artikel'}</span><span style="font-size:0.8rem; color:var(--muted);">${Utils.formatDate(item.date)}</span></div><h3 style="margin:0 0 10px; font-size:1.25rem;">${item.title}</h3><p style="font-size:0.95rem; line-height:1.7; color:var(--text-2); margin:0;">${item.content?Utils.renderMarkdown(item.content):'...'}</p>`;
        container.appendChild(row);
    });
  }

  function init() {
    initGlobalSettings(); 
    const path = window.location.pathname.toLowerCase(); 
    const slug = Utils.getQueryParam("slug"); 
    const chapter = Utils.getQueryParam("chapter");
    
    if(chapter && Utils.getQueryParam("novel")) initReadChapter(); 
    else if(slug) initNovelDetail(); 
    else if(path.includes("works")||path.includes("novel")) initWorksList(); 
    else if(path.includes("writings")||path.includes("tulisan")) initWritingsList(); 
    else if(path==="/"||path.includes("index")) initHomePage();
  }
  return { init, Utils };
})();

document.addEventListener("DOMContentLoaded", TitikFiksi.init);