export function hashTextToUint32(text) {
    let hash = 2166136261 >>> 0;
    for (let i = 0; i < text.length; i += 1) {
        hash ^= text.charCodeAt(i);
        hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
}

export function createSeededRandom(seedText) {
    let state = hashTextToUint32(String(seedText || 'seed'));
    return () => {
        state = (state + 0x6D2B79F5) | 0;
        let t = Math.imul(state ^ (state >>> 15), 1 | state);
        t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

export function getDeterministicRandomInt(min, max, seedText) {
    const normalizedMin = Number.isFinite(min) ? min : 1;
    const normalizedMax = Number.isFinite(max) ? max : normalizedMin;
    if (normalizedMax <= normalizedMin) {
        return normalizedMin;
    }
    const random = createSeededRandom(seedText)();
    return Math.floor(random * (normalizedMax - normalizedMin + 1)) + normalizedMin;
}

export function pickRandomSubsetDeterministic(items, targetCount, seedText) {
    const pool = [...items];
    const nextRandom = createSeededRandom(seedText);
    for (let i = pool.length - 1; i > 0; i -= 1) {
        const j = Math.floor(nextRandom() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    return pool.slice(0, Math.max(0, targetCount));
}
