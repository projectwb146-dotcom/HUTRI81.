(function(){
  "use strict";

  /* ---------- NAV ---------- */
  var navToggle = document.getElementById('navToggle');
  var navLinks = document.getElementById('navLinks');
  navToggle.addEventListener('click', function(){
    navLinks.classList.toggle('is-open');
  });
  navLinks.querySelectorAll('a').forEach(function(a){
    a.addEventListener('click', function(){ navLinks.classList.remove('is-open'); });
  });

  /* ---------- SCROLL REVEAL ---------- */
  var revealEls = document.querySelectorAll('.reveal');
  if('IntersectionObserver' in window){
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(entry.isIntersecting){
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold:.12 });
    revealEls.forEach(function(el){ io.observe(el); });
  } else {
    revealEls.forEach(function(el){ el.classList.add('is-visible'); });
  }

  /* ---------- TOKOH CAROUSEL ---------- */
  var track = document.getElementById('frameTrack');
  var prevBtn = document.getElementById('framePrev');
  var nextBtn = document.getElementById('frameNext');
  function frameStep(){
    var card = track.querySelector('.frame-card');
    if(!card) return 260;
    var style = getComputedStyle(track);
    return card.offsetWidth + parseFloat(style.gap || 26);
  }
  prevBtn.addEventListener('click', function(){ track.scrollBy({ left: -frameStep(), behavior:'smooth' }); });
  nextBtn.addEventListener('click', function(){ track.scrollBy({ left: frameStep(), behavior:'smooth' }); });

  var isDown = false, startX, scrollLeft;
  track.addEventListener('pointerdown', function(e){
    isDown = true; track.classList.add('is-dragging');
    startX = e.pageX; scrollLeft = track.scrollLeft;
  });
  window.addEventListener('pointerup', function(){ isDown = false; track.classList.remove('is-dragging'); });
  track.addEventListener('pointerleave', function(){ isDown = false; track.classList.remove('is-dragging'); });
  track.addEventListener('pointermove', function(e){
    if(!isDown) return;
    track.scrollLeft = scrollLeft - (e.pageX - startX);
  });

  /* ---------- NUSANTARA AUTO-SLIDE ---------- */
  document.querySelectorAll('.culture-stack').forEach(function(stack, idx){
    var imgs = stack.querySelectorAll('img');
    var top = stack.closest('.culture-card').querySelector('.culture-dots');
    var dots = top ? top.querySelectorAll('.culture-dot') : [];
    if(imgs.length <= 1) return;
    var active = 0;
    setInterval(function(){
      imgs[active].classList.remove('is-active');
      if(dots[active]) dots[active].classList.remove('is-active');
      active = (active + 1) % imgs.length;
      imgs[active].classList.add('is-active');
      if(dots[active]) dots[active].classList.add('is-active');
    }, 3600 + idx * 260);
  });

  /* ---------- WALL OF DREAMS (tersimpan bersama lewat JSONBlob, tanpa akun) ---------- */
  /* Isi WALL_BLOB_ID dengan ID hasil setup pertama kali (lihat instruksi di
     layar kalau masih kosong) supaya SEMUA pengunjung melihat dinding yang sama. */
  var WALL_BLOB_ID = 'id-yang-muncul-di-layar';
  var WALL_API = 'https://jsonblob.com/api/jsonBlob';
  var runtimeBlobId = null;
  var memoryFallback = [];
  var wishesCache = [];

  function remoteUrl(id){ return WALL_API + '/' + id; }

  function createRemoteBlob(){
    return fetch(WALL_API, {
      method: 'POST',
      headers: { 'Content-Type':'application/json', 'Accept':'application/json' },
      body: JSON.stringify([])
    }).then(function(res){
      if(!res.ok) throw new Error('create failed');
      var loc = res.headers.get('Location') || res.headers.get('location') || '';
      var id = loc.split('/').filter(Boolean).pop();
      if(!id) throw new Error('no id returned');
      return id;
    });
  }

  function fetchRemote(id){
    return fetch(remoteUrl(id), { headers:{ 'Accept':'application/json' }, cache:'no-store' })
      .then(function(res){
        if(!res.ok) throw new Error('fetch failed: ' + res.status);
        return res.json();
      })
      .then(function(data){ return Array.isArray(data) ? data : []; });
  }

  function putRemote(id, list){
    return fetch(remoteUrl(id), {
      method: 'PUT',
      headers: { 'Content-Type':'application/json', 'Accept':'application/json' },
      body: JSON.stringify(list)
    }).then(function(res){
      if(!res.ok) throw new Error('put failed: ' + res.status);
      return true;
    });
  }

  function showSetupNotice(id){
    var overlay = document.createElement('div');
    overlay.setAttribute('style',
      'position:fixed;inset:0;z-index:99999;background:rgba(10,6,0,.92);'+
      'display:flex;align-items:center;justify-content:center;padding:20px;'+
      'font-family:Arial,Helvetica,sans-serif;'
    );
    overlay.innerHTML =
      '<div style="max-width:560px;width:100%;background:#1c1204;border:2px solid #c17817;'+
      'border-radius:14px;padding:26px 24px;color:#f3e6cf;line-height:1.65;max-height:88vh;overflow:auto;">'+
        '<h2 style="margin:0 0 12px;color:#f6c453;font-size:19px;">⚙️ Setup Wall Harapan (sekali saja)</h2>'+
        '<p style="margin:0 0 10px;">Supaya pesan pengunjung terlihat oleh <b>semua orang</b> (bukan cuma di browser ini), simpan ID penyimpanan berikut ke file <code>script.js</code>.</p>'+
        '<p style="margin:0 0 6px;">1. Buka <code>script.js</code>, cari baris:</p>'+
        '<pre style="background:#000;padding:10px 12px;border-radius:8px;overflow:auto;font-size:13px;">var WALL_BLOB_ID = \'\';</pre>'+
        '<p style="margin:10px 0 6px;">2. Ganti jadi:</p>'+
        '<pre style="background:#000;padding:10px 12px;border-radius:8px;overflow:auto;font-size:13px;word-break:break-all;">var WALL_BLOB_ID = \'' + id + '\';</pre>'+
        '<p style="margin:10px 0 6px;">3. Simpan, lalu upload ulang <code>script.js</code> ke hosting kamu.</p>'+
        '<p style="margin:10px 0 6px;color:#e8b975;"><b>Penting:</b> lakukan ini cuma sekali. Kalau layar ini muncul lagi setelah di-upload, berarti ID belum tersimpan di file yang aktif.</p>'+
        '<button id="wallSetupClose" style="margin-top:8px;padding:10px 20px;border:none;border-radius:8px;'+
        'background:#c17817;color:#1c1204;font-weight:700;cursor:pointer;font-size:14px;">Mengerti, tutup</button>'+
      '</div>';
    document.body.appendChild(overlay);
    document.getElementById('wallSetupClose').addEventListener('click', function(){ overlay.remove(); });
  }

  function ensureBlobId(){
    if(WALL_BLOB_ID) return Promise.resolve(WALL_BLOB_ID);
    if(runtimeBlobId) return Promise.resolve(runtimeBlobId);
    if(typeof fetch !== 'function') return Promise.resolve(null);
    return createRemoteBlob().then(function(id){
      runtimeBlobId = id;
      showSetupNotice(id);
      return id;
    }).catch(function(){ return null; });
  }

  var BAD_WORDS = [
    'anjing','anjir','asu','bangsat','bajingan','bego','goblok','tolol','idiot',
    'kontol','memek','pepek','ngentot','ngewe','jembut','peler','pecun','lonte','sundal','pelacur','penis','vagina',
    'jancok','jancuk','asem','sialan','brengsek','keparat','kampret','tai','taik','bacot',
    'babi','monyet','kunyuk','kimak','pantek','puki',
    'fuck','shit','bitch','asshole','bastard','dick','pussy','cunt','slut','whore','damn','crap'
  ];

  function leetNormalize(s){
    var map = { '0':'o', '1':'i', '3':'e', '4':'a', '5':'s', '7':'t', '8':'b', '@':'a', '$':'s', '!':'i', '|':'i' };
    return s.replace(/[0134578@$!|]/g, function(ch){ return map[ch] || ch; });
  }
  function normalizeForFilter(raw){
    var s = raw.toLowerCase();
    s = leetNormalize(s);
    s = s.replace(/[^a-z\s]/g, '');
    s = s.replace(/(.)\1+/g, '$1');
    return s;
  }
  /* Cek apakah `word` muncul sebagai rangkaian huruf berurutan di dalam
     `text`, dengan toleransi sisipan huruf lain di antaranya (mis. hasil
     obfuscation seperti "guoblok" utk "goblok" atau "muemek" utk "memek").
     Hanya dipakai utk kata >=5 huruf; kata pendek (mis. "asu","tai") tetap
     pakai pencocokan persis supaya tidak terlalu sensitif ke kata wajar. */
  function fuzzyContains(text, word){
    var maxSlack = Math.min(3, Math.max(1, Math.floor(word.length * 0.4)));
    for(var start = 0; start <= text.length - 1; start++){
      var wi = 0, slack = 0, ci = start;
      while(ci < text.length && wi < word.length){
        if(text[ci] === word[wi]){ wi++; }
        else{
          slack++;
          if(slack > maxSlack) break;
        }
        ci++;
      }
      if(wi === word.length) return true;
    }
    return false;
  }
  function containsProfanity(raw){
    var compact = normalizeForFilter(raw).replace(/\s+/g, '');
    return BAD_WORDS.some(function(w){
      if(w.length <= 4) return compact.indexOf(w) !== -1;
      return fuzzyContains(compact, w);
    });
  }
  function escapeHTML(str){
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
  function formatTime(ts){
    try{
      return new Date(ts).toLocaleDateString('id-ID', { day:'numeric', month:'short', year:'numeric' });
    }catch(e){ return ''; }
  }

  var wallGrid = document.getElementById('wallGrid');
  var wallForm = document.getElementById('wallForm');
  var wallInput = document.getElementById('wallInput');
  var wallCount = document.getElementById('wallCount');
  var wallWarning = document.getElementById('wallWarning');
  var wallSubmit = document.getElementById('wallSubmit');

  wallInput.addEventListener('input', function(){
    wallCount.textContent = wallInput.value.length;
    wallWarning.classList.remove('is-visible');
  });

  function renderWishes(list){
    wallGrid.innerHTML = '';
    if(!list.length){
      var empty = document.createElement('div');
      empty.className = 'wall-empty';
      empty.textContent = 'Jadilah yang pertama menuliskan harapan untuk Indonesia.';
      wallGrid.appendChild(empty);
      return;
    }
    list.slice().sort(function(a,b){ return b.ts - a.ts; }).forEach(function(w){
      var card = document.createElement('div');
      card.className = 'wall-card';
      card.dataset.id = w.id;

      var p = document.createElement('p');
      p.textContent = w.text;

      var meta = document.createElement('div');
      meta.className = 'wall-meta';

      var time = document.createElement('time');
      time.textContent = formatTime(w.ts);
      meta.appendChild(time);

      var del = document.createElement('button');
      del.type = 'button';
      del.className = 'wall-delete';
      del.setAttribute('aria-label', 'Hapus harapan ini');
      del.textContent = '✕';
      del.addEventListener('click', function(){
        if(window.confirm('Hapus harapan ini dari dinding?')){
          deleteWish(w.id);
        }
      });
      meta.appendChild(del);

      card.appendChild(p);
      card.appendChild(meta);
      wallGrid.appendChild(card);
    });
  }

  function loadWishes(){
    return ensureBlobId().then(function(id){
      if(!id) return memoryFallback.slice();
      return fetchRemote(id).catch(function(){ return memoryFallback.slice(); });
    }).catch(function(){ return memoryFallback.slice(); });
  }

  function saveWishes(list){
    memoryFallback = list;
    return ensureBlobId().then(function(id){
      if(!id) return;
      return putRemote(id, list);
    });
  }

  function refreshWall(){
    return loadWishes().then(function(list){
      wishesCache = list;
      renderWishes(wishesCache);
    });
  }

  function deleteWish(id){
    wishesCache = wishesCache.filter(function(w){ return w.id !== id; });
    renderWishes(wishesCache);
    loadWishes().then(function(fresh){
      var next = fresh.filter(function(w){ return w.id !== id; });
      return saveWishes(next).then(function(){
        wishesCache = next;
        renderWishes(wishesCache);
      });
    }).catch(function(){});
  }

  wallForm.addEventListener('submit', function(e){
    e.preventDefault();
    var text = wallInput.value.trim();
    wallWarning.classList.remove('is-visible');

    if(!text) return;

    if(containsProfanity(text)){
      wallWarning.textContent = 'yang santun cuy.';
      wallWarning.classList.add('is-visible');
      return;
    }

    var newWish = {
      id: 'w_' + Date.now() + '_' + Math.random().toString(36).slice(2,8),
      text: text.slice(0,220),
      ts: Date.now()
    };

    wishesCache.push(newWish);
    renderWishes(wishesCache);
    wallInput.value = '';
    wallCount.textContent = '0';

    loadWishes().then(function(fresh){
      var next = fresh.concat([newWish]);
      return saveWishes(next).then(function(){
        wishesCache = next;
        renderWishes(wishesCache);
      });
    }).catch(function(){
      wallWarning.textContent = 'Harapan tampil di layar ini, tapi gagal tersimpan permanen. Coba kirim ulang nanti.';
      wallWarning.classList.add('is-visible');
    });
  });

  refreshWall();
  setInterval(function(){
    if(document.visibilityState === 'hidden') return;
    loadWishes().then(function(list){
      wishesCache = list;
      renderWishes(wishesCache);
    });
  }, 20000);

})();
