export function validateConfig(config) {
  if (!config || !Array.isArray(config.items) || config.items.length < 2 || config.items.length > 24) throw new Error('Configure entre 2 e 24 itens no JSON.');
  if (typeof config.releaseStartsAt !== 'string' || !/(?:Z|[+-]\d{2}:\d{2})$/.test(config.releaseStartsAt) || !Number.isFinite(Date.parse(config.releaseStartsAt))) throw new Error('releaseStartsAt precisa ser uma data ISO com fuso horário.');
  const repeats = config.visualRepeats ?? 1;
  if (!Number.isInteger(repeats) || repeats < 1 || repeats > 6 || repeats * config.items.length > 48) throw new Error('visualRepeats deve ser de 1 a 6, com até 48 segmentos visuais.');
  const ids = new Set();
  for (const item of config.items) {
    if (!item || typeof item.id !== 'string' || !item.id.trim() || ids.has(item.id)) throw new Error('Cada item precisa de um id único.');
    ids.add(item.id);
    if (typeof item.label !== 'string' || !item.label.trim() || item.label.length > 32) throw new Error('Os nomes devem ter entre 1 e 32 caracteres.');
    if (typeof item.enabled !== 'boolean' || !Number.isFinite(item.weight) || item.weight < 0) throw new Error('Cada item precisa de enabled (booleano) e weight (número positivo ou zero).');
    if (item.releasePerHour !== undefined && (!Number.isSafeInteger(item.releasePerHour) || item.releasePerHour < 1)) throw new Error('releasePerHour precisa ser um inteiro positivo.');
    if (item.chanceScalesWithStock !== undefined && (typeof item.chanceScalesWithStock !== 'boolean' || !item.releasePerHour)) throw new Error('chanceScalesWithStock exige uma cota horária.');
  }
  const eligible = config.items.filter(item => item.enabled && item.weight > 0);
  const total = eligible.reduce((sum, item) => sum + item.weight, 0);
  if (!eligible.length || !Number.isFinite(total)) throw new Error('Nenhum resultado disponível. Confira enabled e weight.');
  if (config.forcedResultId != null && !eligible.some(item => item.id === config.forcedResultId)) throw new Error('O resultado fixado precisa estar liberado e ter peso maior que zero.');
  if (!Number.isFinite(config.durationMs) || config.durationMs < 2000 || config.durationMs > 20000) throw new Error('durationMs deve ficar entre 2000 e 20000.');
  if (!Number.isInteger(config.turns) || config.turns < 3 || config.turns > 15) throw new Error('turns deve ser um inteiro entre 3 e 15.');
  return config;
}
export function chooseResult(config, random = Math.random) {
  validateConfig(config);
  if (config.forcedResultId != null) return config.items.find(item => item.id === config.forcedResultId);
  const eligible = config.items.filter(item => item.enabled && item.weight > 0);
  let ticket = random() * eligible.reduce((sum, item) => sum + item.weight, 0);
  for (const item of eligible) { ticket -= item.weight; if (ticket < 0) return item; }
  return eligible.at(-1);
}
export const normalize = angle => ((angle % 360) + 360) % 360;
export function visualSegments(config) {
  return Array.from({length: config.visualRepeats ?? 1}, () => config.items).flat();
}
export function visualIndex(segments, id, random = Math.random) {
  const indices = segments.flatMap((item, index) => item.id === id ? [index] : []);
  if (!indices.length) throw new Error('O resultado não está na roleta.');
  return indices[Math.floor(random() * indices.length)];
}
export function targetRotation(current, index, count, turns) {
  const target = normalize(-(index + .5) * 360 / count);
  return current + turns * 360 + normalize(target - normalize(current));
}
