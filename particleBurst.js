/**
 * particleBurst.js
 * 新增成就時觸發的粒子/煙火動畫（對應規格第 5 節「新增成就時觸發粒子/煙火動畫」）。
 * 刻意只在「新增成功」這個單一時刻觸發，不做逐卡片的通用 hover 動效。
 * 遵守 prefers-reduced-motion：使用者設定減少動態時，直接略過動畫。
 */

const PARTICLE_COLORS = ['#7C3AED', '#3A86FF', '#F0568C', '#F5A623', '#14B8A6'];
const PARTICLE_COUNT = 16;

/**
 * 在指定元素（通常是「新增成就」按鈕）周圍觸發一次粒子噴發效果。
 * @param {HTMLElement} originEl - 動畫的噴發起點元素
 */
export function fireParticleBurst(originEl) {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) return;

  const rect = originEl.getBoundingClientRect();
  const originX = rect.left + rect.width / 2;
  const originY = rect.top + rect.height / 2;

  const layer = document.createElement('div');
  layer.className = 'particle-burst-layer';
  document.body.appendChild(layer);

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const particle = document.createElement('span');
    particle.className = 'particle';

    const angle = (Math.PI * 2 * i) / PARTICLE_COUNT + Math.random() * 0.3;
    const distance = 60 + Math.random() * 60;
    const dx = Math.cos(angle) * distance;
    const dy = Math.sin(angle) * distance;

    particle.style.left = `${originX}px`;
    particle.style.top = `${originY}px`;
    particle.style.background = PARTICLE_COLORS[i % PARTICLE_COLORS.length];
    particle.style.setProperty('--dx', `${dx}px`);
    particle.style.setProperty('--dy', `${dy}px`);

    layer.appendChild(particle);
  }

  // 動畫時長需與 theme.css 的 .particle 動畫時間（0.7s）一致，結束後清除節點避免累積
  setTimeout(() => layer.remove(), 800);
}
