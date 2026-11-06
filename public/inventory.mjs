import {validateConfig, chooseResult} from './rules.mjs';
export const STOCK_KEY = 'expo-roulette-stock-v2';
const HOUR = 60 * 60 * 1000;

export function replenish(config, saved, now = Date.now()) {
  validateConfig(config);
  const startsAt = Date.parse(config.releaseStartsAt);
  if (!Number.isSafeInteger(now)) throw new Error('Horário do dispositivo inválido.');
  if (saved !== null && (!saved || saved.version !== 2 || saved.startsAt !== startsAt || !saved.balances || typeof saved.balances !== 'object' || !Number.isSafeInteger(saved.lastSeenAt))) throw new Error('Saldo local incompatível com o horário configurado.');
  const state = saved === null ? {version:2, startsAt, lastSeenAt:now, balances:{}} : structuredClone(saved);
  if (now < state.lastSeenAt) throw new Error('Confira o relógio do dispositivo antes de girar.');
  state.lastSeenAt = now;
  const elapsedHours = Math.max(0, Math.floor((now - startsAt) / HOUR));
  for (const item of config.items.filter(item => item.releasePerHour)) {
    let balance = state.balances[item.id];
    if (!balance) balance = state.balances[item.id] = {spent:0, available:0};
    if (!Number.isSafeInteger(balance.spent) || balance.spent < 0) throw new Error('Saldo local inválido.');
    const released = elapsedHours * item.releasePerHour;
    if (!Number.isSafeInteger(released)) throw new Error('Saldo fora do limite.');
    balance.available = Math.max(0, released - balance.spent);
  }
  return state;
}

export function availableConfig(config, state) {
  const effective = {...config, items:config.items.map(item => {
    if (!item.releasePerHour) return {...item};
    const available = state.balances[item.id].available;
    return {...item, enabled:item.enabled && available > 0, weight:item.weight * (item.chanceScalesWithStock ? available : 1)};
  })};
  return validateConfig(effective);
}

export function reserveResult(config, saved, now = Date.now(), random = Math.random) {
  const state = replenish(config, saved, now);
  const item = chooseResult(availableConfig(config, state), random);
  if (item.releasePerHour) {
    state.balances[item.id].spent++;
    state.balances[item.id].available--;
  }
  return {item, state};
}

export async function pickAndReserve(config) {
  const reserve = () => {
    const raw = localStorage.getItem(STOCK_KEY);
    const {item, state} = reserveResult(config, raw === null ? null : JSON.parse(raw));
    // Save before animation: reloading during a spin cannot refund a prize.
    localStorage.setItem(STOCK_KEY, JSON.stringify(state));
    return item;
  };
  // Serialize reads and writes across tabs on this browser/origin.
  if (navigator.locks) return navigator.locks.request(STOCK_KEY, reserve);
  throw new Error('Este navegador precisa oferecer suporte a Web Locks para controlar as cotas.');
}
