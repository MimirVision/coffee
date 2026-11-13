// Eksempeldata for å prøve appen
import { SAMPLE_BEANS } from './data.js';
import { saveBean, saveBrew } from './store.js';

export async function loadSamples() {
  const now = Date.now();
  let i = 0;
  for (const s of SAMPLE_BEANS) {
    const { roastDays, ...rest } = s;
    const bean = {
      methods: [], notes: [], photos: [], profile: null, favorite: false, buyAgain: false, description: '', ...rest,
      roastDate: roastDays != null ? new Date(now - roastDays * 864e5).toISOString().slice(0, 10) : '',
      openedAt: now - 20 * 864e5,
    };
    const saved = await saveBean(bean);
    saved.createdAt = now - (SAMPLE_BEANS.length - i++) * 3 * 864e5;
    await saveBean(saved);
    if (saved.status === 'stash' || saved.name.startsWith('Kiambu')) {
      const m = saved.methods[0] || 'v60';
      const n = saved.name.startsWith('Guji') ? 4 : 2;
      for (let k = 0; k < n; k++) {
        const dose = m === 'espresso' ? 18 : 15;
        await saveBrew({
          beanId: saved.id, method: m, dose, water: m === 'espresso' ? 38 + k : dose * (15.5 + k * 0.5),
          grind: m === 'espresso' ? `${8 + k}` : `${20 + k * 2} klikk`, temp: m === 'espresso' ? 93 : 94,
          time: m === 'espresso' ? 27 + k : 170 + k * 10, rating: [3.5, 4, 4.5, 4][k] || 4,
          date: new Date(now - (n - k) * 2 * 864e5).toISOString().slice(0, 10),
          notes: k === 2 ? 'Sweet spot! Sødme og klarhet i balanse.' : '',
        });
      }
    }
  }
}
