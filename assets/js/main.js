/* =========================================================
   TITIK FIKSI — Main Controller (FINAL SPLIT LOGIC)
   Fitur: GA4, Video Split, Contact, Store
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
      try {
        return new Date(dateString).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });
      } catch (e) { return dateString; }
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
    renderMarkdown(text) {
      if (!text) return "";
      try {
        let clean = text.replace(/\\/g, ''); 
        const paragraphs = clean.split(/\n\s*\n/);
        return paragraphs.map(para => {
          if (!para || para.trim().length === 0) return "";
          let formatted = para.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>').replace(/\*(.*?)\*/g, '<i>$1</i>').replace(/__(.*?)__/g, '<u>$1</u>').replace(/\n/g, '<br>'); 
          return `<p style="margin-bottom:18px; text-align:justify; line-height:1.9;">${formatted}</p>`;
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
      
      // GA4 Setup
      if (settings.ga_id && document.getElementById('ga-script')) {
          const gaId = settings.ga_id;
          document.getElementById('ga-script').src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
          document.getElementById('ga-setup').innerHTML = `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${gaId}');
          `;
      }
    }

    if (homeData && homeData.socials) {
      const s = homeData.socials;
      updateSocialLink('social-ig', s.instagram);
      updateSocialLink('social-fb', s.facebook);
      updateSocialLink('social-tw', s.twitter);
      updateSocialLink('social-tt', s.tiktok);
      updateSocialLink('social-yt', s.youtube);
      renderBusinessContacts(s);
    }
  }

  function updateSocialLink(className, url) {
    const els = document.getElementsByClassName(className);
    if (url && url.length > 5) {
        for (let el of els) { el.href = url; el.style.display = "inline-flex"; }
    } else {
        for (let el of els) { el.style.display = "none"; }
    }
  }

  function renderBusinessContacts(s) {
      const container = document.getElementById("business-contacts");
      if (!container) return; 
      let html = "";
      if(s.whatsapp) html += `<a href="https://wa.me/${s.whatsapp}" target="_blank" class="btn-contact btn-wa">💬 WhatsApp</a>`;
      if(s.email) html += `<a href="mailto:${s.email}" class="btn-contact btn-email">📧 Email Bisnis</a>`;
      container.innerHTML = html;
  }

  /* --- 2. BERANDA --- */
  async function initHomePage() {
    const data = await Utils.fetchJSON(PATHS.home);
    if (!data || !data.hero) return;

    Utils.setText("hero-title", data.hero.title);
    Utils.setText("hero-subtitle", data.hero.subtitle);
    Utils.setText("hero-intro", data.hero.intro);
    
    // VIDEO UTAMA (SPLIT LAYOUT)
    const ytWrapper = document.getElementById("hero-youtube-wrapper");
    const ytContainer = document.getElementById("hero-youtube");
    const ytTitle = document.getElementById("hero-video-title");
    const ytDesc = document.getElementById("hero-video-desc");
    const ytBtn = document.getElementById("hero-video-link");

    if (data.hero.youtube_embed && ytContainer) {
      let url = data.hero.youtube_embed.replace("watch?v=", "embed/").replace("youtu.be/", "www.youtube.com/embed/");
      ytContainer.innerHTML = `<iframe src="${url}" title="YouTube" frameborder="0" allowfullscreen></iframe>`;
      
      // Isi Kolom Deskripsi (Kanan)
      if (ytTitle && data.hero.video_title) ytTitle.textContent = data.hero.video_title;
      if (ytDesc && data.hero.video_desc) ytDesc.textContent = data.hero.video_desc;
      
      // Isi Tombol Iklan (Jika ada link)
      if (ytBtn && data.hero.video_link) {
          ytBtn.href = data.hero.video_link;
          ytBtn.textContent = data.hero.video_btn_text || "Cek Disini";
          ytBtn.style.display = "inline-block";
      } else if (ytBtn) {
          ytBtn.style.display = "none";
      }
      
      if(ytWrapper) ytWrapper.style.display = "grid"; // Aktifkan Grid
    }

    // A. LINK NOVEL
    const linksContainer = document.getElementById("novel-links-container");
    if (linksContainer) {
        if (data.novel_links && Array.isArray(data.novel_links)) {
            let htmlLeft = "";
            data.novel_links.forEach(item => {
                let colorClass = getColorClass(item.color);
                htmlLeft += `<a href="${item.url}" target="_blank" class="btn-platform ${colorClass}">${item.name}</a>`;
            });
            linksContainer.innerHTML = htmlLeft;
        } else { linksContainer.innerHTML = ""; }
    }

    // B. STORE / IKLAN
    const adsContainer = document.getElementById("ads-store-container");
    if (adsContainer) {
        if (data.ads_store && Array.isArray(data.ads_store)) {
            let htmlStore = "";
            data.ads_store.forEach(item => {
                let colorClass = getColorClass(item.color);
                let mediaHtml = "";
                if (item.youtube && item.youtube.length > 5) {
                     let ytUrl = item.youtube.replace("watch?v=", "embed/").replace("youtu.be/", "www.youtube.com/embed/");
                     mediaHtml = `<iframe src="${ytUrl}" title="Iklan" frameborder="0" allowfullscreen></iframe>`;
                } else if (item.image) {
                     mediaHtml = `<img src="${item.image}" alt="${item.product_name}">`;
                }

                htmlStore += `
                <div class="store-item">
                    ${mediaHtml ? `<div class="store-media">${mediaHtml}</div>` : ''}
                    <div class="store-info">
                        <h4 class="store-title">${item.product_name}</h4>
                        <p class="store-desc">${item.description || ''}</p>
                        <a href="${item.url}" target="_blank" class="store-btn ${colorClass}">${item.btn_text || 'Cek Disini'}</a>
                    </div>
                </div>`;
            });
            adsContainer.innerHTML = htmlStore;
        } else { adsContainer.innerHTML = `<p style="font-size:12px; color:var(--muted);">Belum ada produk/iklan.</p>`; }
    }

    initFeaturedWritings();
  }

  function getColorClass(colorName) {
    if (!colorName) return "plat-purple";
    if (colorName.includes("Orange")) return "plat-orange";
    if (colorName.includes("Merah")) return "plat-red";
    if (colorName.includes("Biru")) return "plat-blue";
    if (colorName.includes("Hijau")) return "plat-green";
    if (colorName.includes("Hitam")) return "plat-black";
    if (colorName.includes("Kuning")) return "plat-yellow";
    if (colorName.includes("Pink")) return "plat-pink";
    return "plat-purple";
  }

  async function initFeaturedWritings() {
    const container = document.getElementById("home-featured-container"); if (!container) return;
    const data = await Utils.fetchJSON(PATHS.writings); if (!data || !data.writings) return;
    const featured = data.writings.filter(w => w.featured === true);
    if (featured.length === 0) { container.innerHTML = `<p style="font-size:13px; color:var(--muted);">Belum ada info terbaru.</p>`; return; }
    featured.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
    const topItem = featured[0]; 
    let html = `
        <div style="margin-bottom:10px;">
            <div style="font-size:11px; color:var(--muted); margin-bottom:4px;">${Utils.formatDate(topItem.date)}</div>
            <h3 style="margin:0 0 8px; font-size:15px; line-height:1.4;">${topItem.title}</h3>
            <p style="font-size:13px; margin:0; color:var(--text-2); line-height:1.5;">${topItem.content ? topItem.content.substring(0, 80) + '...' : ''}</p>
        </div>
        <a href="writings.html" style="display:block; width:100%; text-align:center; padding:8px; background:rgba(59,130,246,0.1); border-radius:8px; font-size:12px; font-weight:bold; color:var(--brand); text-decoration:none;">Baca Selengkapnya &rarr;</a>
    `;
    container.innerHTML = html;
  }

  async function initNovelDetail() {
    const slug = Utils.getQueryParam("slug"); if (!slug) return; Utils.setText("work-title", "Memuat...");
    const data = await Utils.fetchJSON(PATHS.works); const novel = data?.works?.find(w => w.slug === slug);
    if (!novel) { Utils.setText("work-title", "Novel Tidak Ditemukan"); return; }
    document.title = `${novel.title}`; Utils.setText("work-title", novel.title); Utils.setText("work-genre", `📌 ${novel.genre}`); Utils.setText("work-status", `✅ ${novel.status}`);
    const synopsisBox = document.getElementById("work-synopsis"); if(synopsisBox) synopsisBox.innerHTML = Utils.renderMarkdown(novel.synopsis);
    const imgEl = document.getElementById("work-cover-img"); if (imgEl) imgEl.src = novel.cover || "assets/images/defaults/cover-default.jpg";
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
        const item = document.createElement("a"); item.className = "chapter-item glass-panel"; item.href = `chapter.html?novel=${slug}&chapter=${chap.code}`; item.style.marginBottom = "10px";
        item.innerHTML = `<div class="chap-num">#${parseInt(chap.code)}</div><div class="chap-info"><strong>${chap.title}</strong><span>${Utils.formatDate(chap.date)}</span></div>`;
        listContainer.appendChild(item);
      });
    }
  }

  async function initReadChapter() {
    window.scrollTo(0,0); const novelSlug = Utils.getQueryParam("novel"); const chapCode = Utils.getQueryParam("chapter");
    if (!novelSlug || !chapCode) return;
    const data = await Utils.fetchJSON(`${PATHS.chaptersDir}${novelSlug}-${chapCode}.json`);
    if (!data) { Utils.setText("chapter-title", "Bab Tidak Ditemukan"); return; }
    document.title = `${data.title}`; Utils.setText("chapter-top", `CHAPTER ${parseInt(chapCode)}`); Utils.setText("chapter-title", data.title);
    const contentBox = document.getElementById("chapter-content"); if(contentBox) contentBox.innerHTML = Utils.renderMarkdown(data.content);
    const linkBox = document.getElementById("chapter-external-links");
    if(linkBox && data.external_links) {
        let html = ""; const l = data.external_links;
        if(l.karyakarsa && l.karyakarsa.length > 3) html += `<a href="${l.karyakarsa}" target="_blank" class="btn-ext btn-kk">🎁 Karyakarsa</a>`;
        if(l.wattpad && l.wattpad.length > 3) html += `<a href="${l.wattpad}" target="_blank" class="btn-ext btn-wp">🟠 Wattpad</a>`;
        if(l.goodnovel && l.goodnovel.length > 3) html += `<a href="${l.goodnovel}" target="_blank" class="btn-ext btn-gn">📘 GoodNovel</a>`;
        if(l.custom_url && l.custom_url.length > 3) html += `<a href="${l.custom_url}" target="_blank" class="btn-ext btn-custom">🔗 ${l.custom_text||'Link'}</a>`;
        linkBox.innerHTML = html ? `<div class="external-links-box"><p>Lanjut baca di:</p><div class="ext-buttons">${html}</div></div>` : "";
    }
    const btnBack = document.getElementById("btn-back-novel"); if(btnBack) btnBack.href = `novel.html?slug=${novelSlug}`;
    const cur = parseInt(chapCode); const btnPrev = document.getElementById("btn-prev"); if(btnPrev) { if(cur>1) { btnPrev.href=`chapter.html?novel=${novelSlug}&chapter=${String(cur-1).padStart(2,'0')}`; btnPrev.style.display="inline-flex";} else btnPrev.style.display="none"; }
    const btnNext = document.getElementById("btn-next"); if(btnNext) { const nxt = await Utils.fetchJSON(`${PATHS.chaptersDir}${novelSlug}-${String(cur+1).padStart(2,'0')}.json`); if(nxt){btnNext.href=`chapter.html?novel=${novelSlug}&chapter=${String(cur+1).padStart(2,'0')}`; btnNext.style.display="inline-flex";} else btnNext.style.display="none"; }
  }

  async function initWorksList() {
    const container = document.getElementById("works-container"); if(!container) return;
    const data = await Utils.fetchJSON(PATHS.works); if(!data || !data.works){ container.innerHTML = '<div class="glass-panel" style="padding:20px;">Belum ada novel.</div>'; return; }
    container.innerHTML = "";
    data.works.forEach(work => {
      const card = document.createElement("a"); card.href = `novel.html?slug=${work.slug}`; card.className = "glass-panel card-work";
      card.innerHTML = `<div style="aspect-ratio:2/3; width:100%; border-radius:12px; overflow:hidden; margin-bottom:12px; background:#e2e8f0;"><img src="${work.cover||'assets/images/defaults/cover-default.jpg'}" style="width:100%; height:100%; object-fit:cover;" loading="lazy"></div><h4 style="margin:0 0 6px; font-size:1rem; line-height:1.4; font-weight:700;">${work.title}</h4><div style="font-size:0.75rem; color:var(--muted); margin-top:auto;"><span class="badge">${work.status}</span></div>`;
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
    initGlobalSettings(); const path = window.location.pathname.toLowerCase(); const slug = Utils.getQueryParam("slug"); const chapter = Utils.getQueryParam("chapter");
    if(chapter && Utils.getQueryParam("novel")) initReadChapter(); else if(slug) initNovelDetail(); else if(path.includes("works")||path.includes("novel")) initWorksList(); else if(path.includes("writings")||path.includes("tulisan")) initWritingsList(); else if(path==="/"||path.includes("index")) initHomePage();
  }
  return { init, Utils };
})();

document.addEventListener("DOMContentLoaded", TitikFiksi.init);