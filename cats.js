'use strict';
// Lightweight SVG + CSS animation. No timers while idle, media, downloads or audio.
const catMedia = matchMedia('(prefers-reduced-motion: reduce)');
let catPaused = readStorage('bow-purl-cat-paused', false) === true;
for (const scene of document.querySelectorAll('[data-cat]')) {
  const pet = document.createElement('button'); pet.type = 'button'; pet.className = 'cat-button';
  pet.setAttribute('aria-label', scene.dataset.cat === 'nap' ? 'Give the sleepy studio cat a little love' : 'Pet the studio cat');
  // Fixed, authored artwork only; user data never enters SVG markup.
  pet.innerHTML = `<svg viewBox="0 0 250 142" aria-hidden="true" focusable="false">
    <ellipse cx="119" cy="127" rx="89" ry="7" fill="#d6b5bd" opacity=".32"/>
    <path d="M43 124Q27 109 15 119" fill="none" stroke="#ba6c86" stroke-width="2"/>
    <g class="cat-tail"><path d="M140 108C175 125 190 91 168 83" fill="none" stroke="#69515b" stroke-width="15" stroke-linecap="round"/></g>
    <g class="cat-breathe">
      <ellipse cx="116" cy="99" rx="44" ry="28" fill="#e9d7c4" stroke="#80636b" stroke-width="2"/>
      <path d="M64 67L58 28Q58 22 65 27L85 42M108 43L127 25Q133 20 132 30L131 68" fill="#69515b" stroke="#80636b" stroke-width="2" stroke-linejoin="round"/>
      <path d="M65 34L69 52L79 44M124 34L121 52L112 45" fill="#d39caa"/>
      <ellipse cx="96" cy="66" rx="41" ry="32" fill="#e9d7c4" stroke="#80636b" stroke-width="2"/>
      <path d="M67 59Q77 43 96 52Q116 43 126 59L120 82Q98 103 72 82Z" fill="#69515b"/>
      <g class="cat-eyes"><ellipse cx="81" cy="66" rx="6" ry="7" fill="#b6dee5"/><ellipse cx="111" cy="66" rx="6" ry="7" fill="#b6dee5"/><ellipse cx="82" cy="66" rx="2" ry="6" fill="#443e50"/><ellipse cx="110" cy="66" rx="2" ry="6" fill="#443e50"/></g>
      <path d="M92 75L100 75L96 79Z" fill="#e7b2b6"/><path d="M96 79Q89 87 85 81M96 79Q102 87 107 81" fill="none" stroke="#ead8cd" stroke-width="1.5" stroke-linecap="round"/>
      <path d="M73 78L51 74M73 83L50 85M119 78L141 74M119 83L142 85" stroke="#a78b94" stroke-width="1.4" stroke-linecap="round"/>
      <path d="M105 100Q93 87 92 100Q91 110 105 105Q119 116 120 103Q120 92 105 100" fill="#b63862"/>
      <circle cx="105" cy="103" r="4" fill="#e7a7bb"/>
      <g class="cat-paw cat-paw-left"><ellipse cx="86" cy="120" rx="16" ry="8" fill="#69515b"/><path d="M80 117L80 123M87 117L87 123" stroke="#ae9299"/></g>
      <g class="cat-paw cat-paw-right"><ellipse cx="121" cy="120" rx="16" ry="8" fill="#69515b"/><path d="M115 117L115 123M122 117L122 123" stroke="#ae9299"/></g>
    </g>
    <g class="cat-yarn"><circle cx="204" cy="111" r="17" fill="#cc8199" stroke="#a9607b" stroke-width="2"/><path d="M194 98Q215 104 216 121M188 108Q205 111 209 127M202 94Q193 111 198 127M215 99Q199 104 189 117" fill="none" stroke="#f7d6dc" stroke-width="2"/></g>
    <path class="cat-love" d="M178 46C165 35 169 22 179 26C189 17 201 30 190 40L178 51Z" fill="#b63862"/>
    <g class="cat-snooze" fill="#9c7e9b" font-family="Georgia,serif"><text x="153" y="49" font-size="15">z</text><text x="172" y="34" font-size="20">z</text></g>
  </svg>`;
  let loveTimer;
  pet.onclick = () => { clearTimeout(loveTimer); scene.classList.add('is-loved'); notify('Prrr… the studio cat approves of your knitting time.'); loveTimer = setTimeout(() => scene.classList.remove('is-loved'), 1800); };
  scene.append(pet);
}
function syncCatMotion() {
  const paused = catPaused || catMedia.matches;
  document.documentElement.classList.toggle('cats-paused', paused);
  $('catMotion').textContent = catMedia.matches ? 'Motion reduced' : catPaused ? 'Animate cats' : 'Pause cats';
  $('catMotion').setAttribute('aria-pressed', String(paused));
  $('catMotion').disabled = catMedia.matches;
  $('catMotion').title = catMedia.matches ? 'Your device requests reduced motion.' : 'Pause or resume cat animations on this device';
}
$('catMotion').onclick = () => { catPaused = !catPaused; writeStorage('bow-purl-cat-paused', catPaused); syncCatMotion(); };
catMedia.addEventListener('change', syncCatMotion);
document.addEventListener('visibilitychange', () => document.documentElement.classList.toggle('cats-background', document.hidden));
syncCatMotion();
