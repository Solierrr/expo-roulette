import { validateConfig, targetRotation, normalize, visualSegments, visualIndex } from './rules.mjs';
import { pickAndReserve } from './inventory.mjs';
const $ = selector => document.querySelector(selector);
const spinButton = $('#spin'), wheel = $('#wheel'), camera = $('.camera'), pointer = $('.pointer');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
let busy = false, rotation = 0;
const palette = ['#ff6500','#fff0e5','#ff914d','#f3f4f6','#ffb347','#fff0e5','#c84b18','#f3f4f6'];
const ns = 'http://www.w3.org/2000/svg';
function node(tag, attributes, text) {
  const element = document.createElementNS(ns, tag);
  for (const [key, value] of Object.entries(attributes)) element.setAttribute(key, value);
  if (text != null) element.textContent = text;
  return element;
}
function draw(config) {
  wheel.replaceChildren();
  const segments = visualSegments(config);
  const count = segments.length, segment = Math.PI * 2 / count;
  segments.forEach((item, i) => {
    const start = -Math.PI / 2 + i * segment, end = start + segment, middle = start + segment / 2;
    const point = angle => `${300 + Math.cos(angle) * 298},${300 + Math.sin(angle) * 298}`;
    const color = palette[i % palette.length];
    wheel.append(node('path', {d: `M300,300 L${point(start)} A298,298 0 ${segment > Math.PI ? 1 : 0},1 ${point(end)} Z`, fill: color, stroke: '#fff', 'stroke-width': 2}));
    const labelAngle = middle * 180 / Math.PI;
    const group = node('g', {transform: `translate(${300 + Math.cos(middle) * 194},${300 + Math.sin(middle) * 194}) rotate(${labelAngle + 90})`});
    const label = node('text', {'text-anchor':'middle', fill: ['#ff6500','#c84b18'].includes(color) ? '#fff' : '#242628', 'font-family':'Jakarta, sans-serif','font-size':count > 12 ? 13 : 17,'font-weight':700});
    const words = item.label.split(' '), lines = [''];
    words.forEach(word => { if ((lines.at(-1) + ' ' + word).trim().length > 15 && lines.at(-1)) lines.push(word); else lines[lines.length - 1] = (lines.at(-1) + ' ' + word).trim(); });
    lines.forEach((line, lineIndex) => label.append(node('tspan', {x:0,y:(lineIndex - (lines.length - 1) / 2) * 21}, line)));
    group.append(label); wheel.append(group);
  });
}
async function loadConfig() {
  const response = await fetch(`./config.json?t=${Date.now()}`, {cache:'no-store'});
  if (!response.ok) throw new Error('Não foi possível ler config.json.');
  return validateConfig(await response.json());
}
function status(message, error = false) {
  $('#status').textContent = error ? message : '';
  document.body.classList.toggle('error', error);
}
const smooth = t => {t = Math.max(0,Math.min(1,t)); return t * t * (3 - 2 * t);};
// Continuous velocity: gentle acceleration, cruise, then long cubic deceleration.
function travel(t) {
  if (t < .12) return (.5 * t - .12 / (2 * Math.PI) * Math.sin(Math.PI * t / .12)) / .415;
  if (t < .30) return (.06 + t - .12) / .415;
  const u = (t - .30) / .70;
  return (.24 + .175 * (1 - (1 - u) ** 4)) / .415;
}
function animate(target, duration, count) {
  return new Promise(resolve => {
    const startAngle = rotation, delta = target - rotation, started = performance.now();
    let previousSegment = Math.floor(rotation / (360 / count)), kickAt = -100;
    function frame(now) {
      const t = Math.min(1, (now - started) / duration), angle = startAngle + delta * travel(t);
      wheel.style.transform = `rotate(${angle}deg)`;
      const currentSegment = Math.floor(angle / (360 / count));
      if (currentSegment !== previousSegment) { kickAt = now; previousSegment = currentSegment; }
      const kick = Math.max(0, 1 - (now - kickAt) / 140);
      pointer.style.transform = `rotate(${-23 * Math.sin(kick * Math.PI / 2)}deg)`;
      const close = smooth((t - .36) / .35) * (1 - smooth((t - .89) / .11));
      camera.style.transform = `translateY(${close * 40}px) scale(${1 + close * .72})`;
      if (t < 1) requestAnimationFrame(frame);
      else { rotation = normalize(target); wheel.style.transform = `rotate(${rotation}deg)`; camera.style.transform = ''; pointer.style.transform = ''; resolve(); }
    }
    requestAnimationFrame(frame);
  });
}
function celebrate() {
  if (reducedMotion.matches) return;
  for (let i = 0; i < 35; i++) {
    const bit = document.createElement('i'); bit.style.background = palette[i % palette.length]; $('#confetti').append(bit);
    const x = (Math.random() - .5) * 700, y = 150 + Math.random() * 300;
    bit.animate([{transform:'translate(0,0) rotate(0)',opacity:0},{offset:.12,opacity:1},{transform:`translate(${x}px,${-180 - Math.random() * 90}px) rotate(180deg)`,offset:.45,opacity:1},{transform:`translate(${x * 1.3}px,${y}px) rotate(${360 + Math.random() * 360}deg)`,opacity:0}],{duration:1600 + Math.random() * 600,easing:'cubic-bezier(.2,.6,.4,1)'}).finished.finally(() => bit.remove());
  }
}
async function spin() {
  if (busy) return;
  busy = true; spinButton.disabled = true; $('#again').disabled = true; $('#result').hidden = true;
  status('Preparando seu giro…');
  try {
    const config = await loadConfig(); draw(config);
    const chosen = await pickAndReserve(config);
    const segments = visualSegments(config);
    const target = targetRotation(rotation, visualIndex(segments, chosen.id), segments.length, config.turns);
    document.body.classList.add('spinning'); status('Girando… acompanhe a seta.');
    if (reducedMotion.matches) { rotation = normalize(target); wheel.style.transform = `rotate(${rotation}deg)`; }
    else await animate(target, config.durationMs, segments.length);
    $('#result-label').textContent = chosen.label; $('#result').hidden = false;
    status('Seu resultado chegou.'); celebrate();
  } catch (error) {
    status(`Não foi possível girar. ${error instanceof SyntaxError ? 'Revise a sintaxe do config.json.' : error.message}`, true);
  } finally {
    document.body.classList.remove('spinning'); busy = false; spinButton.disabled = false; $('#again').disabled = false;
  }
}
spinButton.addEventListener('click', spin); $('#again').addEventListener('click', spin);
document.addEventListener('keydown', event => {
  if (event.code === 'Space' && !event.repeat && (event.target === document.body || event.target === document.documentElement)) {event.preventDefault(); spin();}
});
try {draw(await loadConfig()); status('');} catch(error) {status(`Revise config.json: ${error.message}`,true);}
finally {spinButton.disabled = false;}
