// Konstanter og oppslagsdata for Kaffeloggen

export const COUNTRIES = [
  ['Etiopia', '🇪🇹'], ['Kenya', '🇰🇪'], ['Colombia', '🇨🇴'], ['Brasil', '🇧🇷'],
  ['Guatemala', '🇬🇹'], ['Costa Rica', '🇨🇷'], ['Panama', '🇵🇦'], ['Honduras', '🇭🇳'],
  ['El Salvador', '🇸🇻'], ['Nicaragua', '🇳🇮'], ['Mexico', '🇲🇽'], ['Peru', '🇵🇪'],
  ['Bolivia', '🇧🇴'], ['Ecuador', '🇪🇨'], ['Rwanda', '🇷🇼'], ['Burundi', '🇧🇮'],
  ['Uganda', '🇺🇬'], ['Tanzania', '🇹🇿'], ['DR Kongo', '🇨🇩'], ['Malawi', '🇲🇼'],
  ['Zambia', '🇿🇲'], ['Zimbabwe', '🇿🇼'], ['Kamerun', '🇨🇲'], ['Jemen', '🇾🇪'],
  ['India', '🇮🇳'], ['Indonesia', '🇮🇩'], ['Papua Ny-Guinea', '🇵🇬'], ['Vietnam', '🇻🇳'],
  ['Kina', '🇨🇳'], ['Thailand', '🇹🇭'], ['Myanmar', '🇲🇲'], ['Laos', '🇱🇦'],
  ['Filippinene', '🇵🇭'], ['Taiwan', '🇹🇼'], ['Timor-Leste', '🇹🇱'], ['Jamaica', '🇯🇲'],
  ['Hawaii', '🇺🇸'], ['Den dominikanske rep.', '🇩🇴'], ['Haiti', '🇭🇹'], ['Cuba', '🇨🇺'],
  ['Puerto Rico', '🇵🇷'], ['Venezuela', '🇻🇪'], ['Australia', '🇦🇺'], ['Blend', '🌍'],
];
const FLAGS = Object.fromEntries(COUNTRIES);
export const flag = (c) => FLAGS[c] || (c ? '📍' : '');

export const PROCESSES = [
  'Vasket', 'Natural', 'Honey', 'Anaerob', 'Karbonisk maserasjon',
  'Semi-vasket', 'Wet-hulled', 'Eksperimentell', 'Dekaf',
];

export const VARIETIES = [
  'Gesha', 'Bourbon', 'Red Bourbon', 'Yellow Bourbon', 'Pink Bourbon', 'Typica',
  'Caturra', 'Catuaí', 'Castillo', 'SL28', 'SL34', 'Ruiru 11', 'Batian',
  'Heirloom', '74110/74112', 'Wush Wush', 'Pacamara', 'Maragogype', 'Mundo Novo',
  'Sidra', 'Java', 'Laurina', 'Villa Sarchi', 'Catimor', 'Tabi', 'Kurume', 'Wolisho',
];

export const ROAST_LEVELS = ['Lys', 'Lys-medium', 'Medium', 'Medium-mørk', 'Mørk'];

export const STATUSES = {
  tried: { label: 'Smakt', short: 'Smakt' },
  stash: { label: 'I lager', short: 'I lager' },
  wishlist: { label: 'Ønskeliste', short: 'Ønske' },
};

export const PROFILE_AXES = [
  ['acidity', 'Syrlighet'],
  ['sweetness', 'Sødme'],
  ['body', 'Fylde'],
  ['bitterness', 'Bitterhet'],
  ['aftertaste', 'Ettersmak'],
  ['complexity', 'Kompleksitet'],
];

export const FLAVORS = [
  { cat: 'Bær', color: '#9b3d68', tags: ['Blåbær', 'Bringebær', 'Jordbær', 'Solbær', 'Kirsebær', 'Tranebær', 'Bjørnebær'] },
  { cat: 'Sitrus', color: '#d39a12', tags: ['Sitron', 'Lime', 'Appelsin', 'Grapefrukt', 'Bergamott', 'Mandarin'] },
  { cat: 'Frukt', color: '#dd7438', tags: ['Fersken', 'Aprikos', 'Plomme', 'Eple', 'Grønt eple', 'Pære', 'Drue', 'Nektarin'] },
  { cat: 'Tropisk', color: '#e2553b', tags: ['Mango', 'Ananas', 'Pasjonsfrukt', 'Papaya', 'Litchi', 'Guava', 'Kokos'] },
  { cat: 'Tørket frukt', color: '#8a4b2a', tags: ['Rosin', 'Daddel', 'Fiken', 'Sviske', 'Tørket kirsebær'] },
  { cat: 'Blomster', color: '#a26fbf', tags: ['Jasmin', 'Rose', 'Lavendel', 'Hibiskus', 'Kamille', 'Appelsinblomst', 'Hyllblomst'] },
  { cat: 'Søtt', color: '#c2842f', tags: ['Karamell', 'Honning', 'Brunt sukker', 'Lønnesirup', 'Vanilje', 'Melasse', 'Toffee', 'Sukkerrør'] },
  { cat: 'Sjokolade & nøtter', color: '#6b4226', tags: ['Melkesjokolade', 'Mørk sjokolade', 'Kakao', 'Hasselnøtt', 'Mandel', 'Peanøtt', 'Valnøtt', 'Marsipan', 'Pekan'] },
  { cat: 'Krydder', color: '#a3502b', tags: ['Kanel', 'Kardemomme', 'Nellik', 'Pepper', 'Ingefær', 'Anis', 'Muskat'] },
  { cat: 'Te & urter', color: '#5b8a47', tags: ['Svart te', 'Grønn te', 'Earl Grey', 'Urter', 'Gress', 'Tomat', 'Rabarbra'] },
  { cat: 'Vin & fermentert', color: '#7d2d3d', tags: ['Rødvin', 'Hvitvin', 'Rom', 'Whisky', 'Yoghurt', 'Kombucha', 'Cider'] },
  { cat: 'Ristet', color: '#5e5650', tags: ['Ristet brød', 'Malt', 'Korn', 'Tobakk', 'Røyk', 'Sedertre', 'Lær'] },
];
const TAG_COLORS = {};
FLAVORS.forEach((g) => g.tags.forEach((t) => (TAG_COLORS[t.toLowerCase()] = g.color)));
export const tagColor = (t) => TAG_COLORS[String(t).toLowerCase()] || '#8c7b6e';
export const tagCategory = (t) => FLAVORS.find((g) => g.tags.some((x) => x.toLowerCase() === String(t).toLowerCase()))?.cat || 'Annet';

// Bryggemetoder med standardoppskrift og trinn for timeren (sekunder)
export const METHODS = [
  { id: 'v60', name: 'V60', ratio: 16, temp: 94, grind: 'Medium-fin', dose: 15,
    steps: [[0, 'Bloom', 'Hell 2–3× dosen vann, rør forsiktig'], [45, 'Første helling', 'Hell sakte til 60 % av vannet'], [75, 'Andre helling', 'Hell resten i sirkler'], [105, 'Drawdown', 'Gi den en forsiktig swirl'], [180, 'Ferdig', 'Nyt koppen ☕']] },
  { id: 'chemex', name: 'Chemex', ratio: 16, temp: 94, grind: 'Medium-grov', dose: 30,
    steps: [[0, 'Bloom', 'Hell 2× dosen vann'], [45, 'Helling', 'Hell til halvparten'], [90, 'Helling', 'Hell resten'], [150, 'Drawdown', 'La den renne gjennom'], [270, 'Ferdig', 'Nyt koppen ☕']] },
  { id: 'kalita', name: 'Kalita Wave', ratio: 16, temp: 93, grind: 'Medium', dose: 16,
    steps: [[0, 'Bloom', 'Hell 2× dosen vann'], [40, 'Puls 1', 'Hell til 40 %'], [70, 'Puls 2', 'Hell til 70 %'], [100, 'Puls 3', 'Hell til 100 %'], [130, 'Drawdown', 'Vent'], [210, 'Ferdig', 'Nyt koppen ☕']] },
  { id: 'aeropress', name: 'AeroPress', ratio: 15, temp: 88, grind: 'Medium-fin', dose: 15,
    steps: [[0, 'Hell', 'Hell alt vannet'], [10, 'Rør', 'Rør 3–4 ganger, sett på stempelet'], [60, 'Swirl', 'Swirl og vent'], [90, 'Press', 'Press sakte i ca. 30 sek'], [120, 'Ferdig', 'Nyt koppen ☕']] },
  { id: 'frenchpress', name: 'French press', ratio: 15, temp: 95, grind: 'Grov', dose: 30,
    steps: [[0, 'Hell', 'Hell alt vannet'], [240, 'Bryt skorpen', 'Rør og skum av toppen'], [300, 'Vent', 'La partiklene synke'], [480, 'Press', 'Press stempelet ned forsiktig'], [500, 'Ferdig', 'Nyt koppen ☕']] },
  { id: 'clever', name: 'Clever Dripper', ratio: 16, temp: 94, grind: 'Medium', dose: 18,
    steps: [[0, 'Hell', 'Hell alt vannet'], [30, 'Rør', 'Rør forsiktig'], [120, 'Slipp', 'Sett på koppen'], [180, 'Ferdig', 'Nyt koppen ☕']] },
  { id: 'espresso', name: 'Espresso', ratio: 2, temp: 93, grind: 'Fin', dose: 18,
    steps: [[0, 'Preinfusjon', 'Lavt trykk'], [6, 'Ekstraksjon', 'Følg flyten'], [28, 'Ferdig', 'Stopp ved målvekt']] },
  { id: 'moka', name: 'Moka', ratio: 8, temp: 70, grind: 'Fin-medium', dose: 15,
    steps: [[0, 'Varm', 'Middels varme, lokket åpent'], [180, 'Flyt', 'Følg med på flyten'], [240, 'Ferdig', 'Kjøl ned bunnen']] },
  { id: 'batch', name: 'Filtermaskin', ratio: 16, temp: 94, grind: 'Medium', dose: 60, steps: [[0, 'Brygg', 'La maskinen jobbe'], [300, 'Ferdig', 'Nyt koppen ☕']] },
  { id: 'coldbrew', name: 'Cold brew', ratio: 8, temp: 4, grind: 'Grov', dose: 100, steps: [[0, 'Trekk', '12–18 timer i kjøleskapet']] },
];
export const methodById = (id) => METHODS.find((m) => m.id === id) || null;
export const methodName = (id) => methodById(id)?.name || id || '';

export const RATING_LABELS = [
  [0, 'Ikke vurdert'], [1, 'Nei takk'], [2, 'Meh'], [3, 'Helt ok'],
  [3.5, 'God'], [4, 'Veldig god'], [4.5, 'Fantastisk'], [5, 'Gudommelig ✨'],
];
export const ratingLabel = (v) => {
  let l = RATING_LABELS[0][1];
  for (const [min, txt] of RATING_LABELS) if (v >= min && v > 0) l = txt;
  return v > 0 ? l : RATING_LABELS[0][1];
};

// Ferskhet basert på brennedato
export function freshness(roastDate) {
  if (!roastDate) return null;
  const days = Math.floor((Date.now() - new Date(roastDate).getTime()) / 864e5);
  if (days < 0) return null;
  if (days < 5) return { days, key: 'rest', label: 'Hviler', hint: 'Gi bønnene noen dager til å avgasse' };
  if (days <= 30) return { days, key: 'peak', label: 'Topp', hint: 'Perfekt vindu for brygging' };
  if (days <= 60) return { days, key: 'ok', label: 'Ok', hint: 'Fortsatt fine, men på vei ned' };
  return { days, key: 'old', label: 'Gammel', hint: 'Har passert sin beste tid' };
}

export const SAMPLE_BEANS = [
  { name: 'Guji Hambela', roaster: 'Tim Wendelboe', country: 'Etiopia', region: 'Guji', farm: 'Hambela Estate', variety: 'Heirloom', process: 'Natural', altitude: 2100, roastLevel: 0, rating: 4.5, notes: ['Blåbær', 'Jasmin', 'Melkesjokolade'], profile: { acidity: 4, sweetness: 5, body: 3, bitterness: 1, aftertaste: 4, complexity: 5 }, status: 'stash', weight: 250, price: 239, shop: 'Tim Wendelboe, Grünerløkka', favorite: true, buyAgain: true, methods: ['v60', 'aeropress'], description: 'Utrolig saftig og blomstrete. Som blåbærsyltetøy med en jasminfinish.', roastDays: 12 },
  { name: 'Kiambu AA', roaster: 'Supreme Roastworks', country: 'Kenya', region: 'Kiambu', variety: 'SL28', process: 'Vasket', altitude: 1800, roastLevel: 1, rating: 4, notes: ['Solbær', 'Grapefrukt', 'Brunt sukker'], profile: { acidity: 5, sweetness: 3, body: 3, bitterness: 2, aftertaste: 4, complexity: 4 }, status: 'tried', weight: 250, price: 219, favorite: false, buyAgain: true, methods: ['v60'], description: 'Klassisk Kenya – syrlig og levende.', roastDays: 40 },
  { name: 'Finca El Paraíso Lychee', roaster: 'Kaffa', country: 'Colombia', region: 'Cauca', farm: 'El Paraíso', variety: 'Castillo', process: 'Anaerob', altitude: 1950, roastLevel: 1, rating: 3.5, notes: ['Litchi', 'Rose', 'Yoghurt'], profile: { acidity: 3, sweetness: 4, body: 2, bitterness: 1, aftertaste: 3, complexity: 4 }, status: 'tried', weight: 200, price: 289, favorite: false, buyAgain: false, methods: ['v60'], description: 'Veldig funky – morsom, men litt for mye.', roastDays: 70 },
  { name: 'Santos Cerrado', roaster: 'Solberg & Hansen', country: 'Brasil', region: 'Cerrado Mineiro', variety: 'Mundo Novo', process: 'Natural', altitude: 1100, roastLevel: 3, rating: 3, notes: ['Peanøtt', 'Kakao', 'Karamell'], profile: { acidity: 1, sweetness: 3, body: 5, bitterness: 3, aftertaste: 3, complexity: 2 }, status: 'stash', weight: 500, price: 189, favorite: false, buyAgain: false, methods: ['espresso', 'moka'], description: 'Trygg hverdagsespresso.', roastDays: 3 },
  { name: 'Gesha Village Lot 74', roaster: 'Fuglen', country: 'Etiopia', region: 'Bench Maji', variety: 'Gesha', process: 'Vasket', roastLevel: 0, rating: 0, notes: ['Bergamott', 'Jasmin', 'Fersken'], status: 'wishlist', price: 450, weight: 100, description: 'Må prøves før jeg dør.' },
];
