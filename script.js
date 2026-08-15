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

  /* ---------- WALL OF DREAMS (real-time via Firebase Realtime Database) ---------- */
  /* CARA SETUP (sekali saja, gratis, pakai akun Google):
     1. Buka https://console.firebase.google.com → Add project → ikuti langkahnya.
     2. Di halaman project, klik ikon "</>" (Web) untuk daftarkan web app →
        beri nama bebas → salin objek firebaseConfig yang muncul, tempel
        menggantikan firebaseConfig di bawah ini.
     3. Di menu kiri: Build → Realtime Database → Create Database → pilih
        lokasi terdekat → mulai mode apa saja (rules akan kita timpa).
     4. Buka tab "Rules" pada Realtime Database, ganti isinya jadi:
          {
            "rules": {
              "wishes": { ".read": true, ".write": true },
              ".read": false,
              ".write": false
            }
          }
        lalu klik Publish. (Ini membuka akses baca/tulis HANYA pada data
        "wishes", bukan seluruh database, dan tidak kedaluwarsa seperti
        mode test bawaan Firebase yang otomatis mati setelah 30 hari.)
     5. Simpan file ini, upload script.js (dan index.html yang sudah memuat
        SDK Firebase) ke hosting kamu. Selesai — semua pengunjung otomatis
        melihat dinding yang sama secara real-time. */
  var firebaseConfig = {
    apiKey: "GANTI_DENGAN_API_KEY",
    authDomain: "GANTI.firebaseapp.com",
    databaseURL: "https://GANTI-default-rtdb.firebaseio.com",
    projectId: "GANTI",
    storageBucket: "GANTI.appspot.com",
    messagingSenderId: "GANTI",
    appId: "GANTI"
  };

  var wishesRef = null;
  var firebaseReady = false;
  try{
    if(typeof firebase !== 'undefined' && firebaseConfig.apiKey.indexOf('GANTI') === -1){
      firebase.initializeApp(firebaseConfig);
      wishesRef = firebase.database().ref('wishes');
      firebaseReady = true;
    }
  }catch(e){ firebaseReady = false; }

  var wishesCache = [];

  function showConfigNotice(){
    var overlay = document.createElement('div');
    overlay.setAttribute('style',
      'position:fixed;inset:0;z-index:99999;background:rgba(10,6,0,.92);'+
      'display:flex;align-items:center;justify-content:center;padding:20px;'+
      'font-family:Arial,Helvetica,sans-serif;'
    );
    overlay.innerHTML =
      '<div style="max-width:560px;width:100%;background:#1c1204;border:2px solid #c17817;'+
      'border-radius:14px;padding:26px 24px;color:#f3e6cf;line-height:1.65;max-height:88vh;overflow:auto;">'+
        '<h2 style="margin:0 0 12px;color:#f6c453;font-size:19px;">⚙️ Wall Harapan belum di-setup</h2>'+
        '<p style="margin:0 0 10px;">Bagian <code>firebaseConfig</code> di <code>script.js</code> masih placeholder ("GANTI...").</p>'+
        '<p style="margin:0 0 10px;">Buka bagian atas <code>script.js</code>, baca komentar "CARA SETUP", lalu tempel config asli dari Firebase Console kamu.</p>'+
        '<button id="wallCfgClose" style="margin-top:8px;padding:10px 20px;border:none;border-radius:8px;'+
        'background:#c17817;color:#1c1204;font-weight:700;cursor:pointer;font-size:14px;">Mengerti, tutup</button>'+
      '</div>';
    document.body.appendChild(overlay);
    document.getElementById('wallCfgClose').addEventListener('click', function(){ overlay.remove(); });
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

  function refreshWall(){
    if(!firebaseReady){
      renderWishes([]);
      showConfigNotice();
      return;
    }
    wishesRef.on('value', function(snapshot){
      var val = snapshot.val() || {};
      var list = Object.keys(val).map(function(key){
        var w = val[key] || {};
        return { id: key, text: w.text || '', ts: w.ts || 0 };
      });
      wishesCache = list;
      renderWishes(wishesCache);
    }, function(){
      wallWarning.textContent = 'Gagal terhubung ke penyimpanan. Coba refresh beberapa saat lagi.';
      wallWarning.classList.add('is-visible');
    });
  }

  function deleteWish(id){
    if(!firebaseReady) return;
    wishesRef.child(id).remove().catch(function(){});
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

    if(!firebaseReady){
      wallWarning.textContent = 'Penyimpanan belum di-setup oleh pemilik situs. Pesan tidak bisa dikirim dulu.';
      wallWarning.classList.add('is-visible');
      return;
    }

    wallInput.value = '';
    wallCount.textContent = '0';

    wishesRef.push({ text: text.slice(0,220), ts: Date.now() }).catch(function(){
      wallWarning.textContent = 'Harapan gagal dikirim. Coba lagi sebentar lagi.';
      wallWarning.classList.add('is-visible');
    });
  });

  refreshWall();

})();
