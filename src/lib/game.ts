export type Place = 'street' | 'epicenter' | 'shelter' | 'clinic' | 'exit';
export type Item = 'water' | 'food' | 'bandage';
export interface GameState {
  place: Place; minutes: number; health: number; hunger: number; energy: number;
  inventory: Record<Item, number>; searched: Place[]; journal: string[];
  message: string; knowsExit: boolean; ending: 'rescued' | 'lost' | null; turns: number;
}
export const places: Record<Place, { name: string; short: string; description: string; risk: string }> = {
  street: { name: 'Проспект Мира', short: 'Проспект', description: 'Ветер гонит пепел по пустой дороге. Где-то за домами глухо гремит. В окнах напротив — ни огонька. Только чья-то занавеска всё ещё шевелится на ветру.', risk: 'Повышенная' },
  epicenter: { name: '«Эпицентр»', short: 'Эпицентр', description: 'За провалившейся крышей видно то же белое небо. Между опрокинутыми стеллажами могут остаться полезные вещи. Со стороны стоянки доносятся чужие голоса.', risk: 'Высокая' },
  shelter: { name: 'Подвал жилого дома', short: 'Укрытие', description: 'Толстые стены приглушают далёкие разрывы. На ступенях — одеяло и пустая кружка. Здесь можно перевести дыхание. Наверху медленно скрипит незакрытая дверь.', risk: 'Низкая' },
  clinic: { name: 'Старая поликлиника', short: 'Поликлиника', description: 'В коридоре пахнет сыростью. На стене висит записка: «К вечеру собираемся у западного выезда. Идите дворами». Под ней — нарисованная от руки стрелка.', risk: 'Повышенная' },
  exit: { name: 'Западный выезд', short: 'Выезд', description: 'За последними домами стоит старый микроавтобус. Водитель молча открывает дверь. Вы в последний раз оглядываетесь на город. Белое небо остаётся за спиной.', risk: 'Высокая' },
};
export const initialState: GameState = {
  place: 'street', minutes: 522, health: 85, hunger: 62, energy: 48,
  inventory: { water: 2, food: 1, bandage: 1 }, searched: [],
  journal: ['08:42 — Вы вышли из подвала на проспект Мира. Нужно найти припасы и путь из города.'],
  message: '', knowsExit: false, ending: null, turns: 0,
};
export function timeLabel(minutes: number) { return `${String(Math.floor(minutes / 60) % 24).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`; }
export type Action = { type: 'travel'; place: Place } | { type: 'search' } | { type: 'rest' } | { type: 'use'; item: Item };
export function act(state: GameState, action: Action): GameState {
  if (state.ending) return state;
  const next: GameState = { ...state, inventory: { ...state.inventory }, searched: [...state.searched], journal: [...state.journal], turns: state.turns + 1 };
  let elapsed = 0;
  if (action.type === 'use') {
    if (next.inventory[action.item] <= 0) return state;
    next.inventory[action.item] -= 1;
    if (action.item === 'water') { next.energy += 12; next.message = 'Несколько глотков холодной воды. Руки уже не так дрожат. Энергия +12.'; }
    if (action.item === 'food') { next.hunger += 30; next.message = 'Вы съели консервы. Теперь будет немного легче идти. Сытость +30.'; }
    if (action.item === 'bandage') { next.health += 25; next.message = 'Чистая повязка. Боль понемногу отступает. Здоровье +25.'; }
    elapsed = 5;
  } else if (action.type === 'travel') {
    if (action.place === 'exit' && !state.knowsExit) return state;
    next.place = action.place; elapsed = 30; next.energy -= 10; next.hunger -= 5;
    next.message = `Вы добрались: ${places[action.place].name}.`;
    if (action.place === 'clinic') { next.knowsExit = true; next.message = 'На стене — записка об эвакуации. Западный выезд теперь отмечен на карте.'; }
    if (action.place === 'exit') next.ending = 'rescued';
    if (action.place === 'epicenter') { next.health -= 5; next.message += ' Рядом прошёл патруль оккупантов. Вы переждали за бетонной стеной, поранив руку об осколок.'; }
  } else if (action.type === 'search') {
    if (next.searched.includes(state.place)) return state;
    next.searched.push(state.place); elapsed = 20; next.energy -= 8; next.hunger -= 4;
    const found: Item = state.place === 'clinic' ? 'bandage' : state.place === 'shelter' ? 'water' : 'food';
    next.inventory[found] += 1;
    next.message = found === 'food' ? 'Под обломками нашлась целая банка консервов. Вы убрали её в рюкзак.' : found === 'water' ? 'В углу осталась запечатанная бутылка воды. Маленькая удача.' : 'В ящике стола остался чистый бинт. Он ещё пригодится.';
  } else {
    elapsed = 60; next.energy += state.place === 'shelter' ? 30 : 15; next.hunger -= 10;
    next.message = state.place === 'shelter' ? 'Час тишины в подвале. Вы согрелись и немного поспали. Энергия +30.' : 'Вы переждали в подъезде. Сон был тревожным, но силы понемногу возвращаются. Энергия +15.';
  }
  next.minutes += elapsed;
  if (next.energy <= 0 || next.hunger <= 0) { next.health -= 15; next.message += ' Истощение даёт о себе знать. Здоровье −15.'; }
  next.health = Math.max(0, Math.min(100, next.health));
  next.hunger = Math.max(0, Math.min(100, next.hunger));
  next.energy = Math.max(0, Math.min(100, next.energy));
  if (next.health === 0) next.ending = 'lost';
  next.journal.unshift(`${timeLabel(next.minutes)} — ${next.message}`);
  return next;
}
