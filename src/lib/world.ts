import { chapterAt, chapters, decide, isWartime, opening, type ChronicleState, type ChronicleAction, type SceneImage } from './chronicle';
export type Room = 'living' | 'kitchen' | 'bathroom' | 'bedroom' | 'landing' | 'stairs' | 'cellar' | 'courtyard' | 'street' | 'shop' | 'clinic' | 'gate';
export type ActivityKind = 'rest' | 'water' | 'search' | 'listen' | 'window' | 'wash' | 'toilet' | 'pack' | 'neighbor' | 'soldier' | 'respect';
export interface Activity { id: string; label: string; kind: ActivityKind; minutes: number; energy: number; once?: boolean; water?: number }
interface Location { name: string; image: SceneImage; description: string; neighbors: Room[]; outside: boolean; actions: Activity[] }
const activity = (id: string, label: string, kind: ActivityKind, minutes: number, energy: number, once = false, water = 0): Activity => ({ id, label, kind, minutes, energy, once, water });
export const locations: Record<Room, Location> = {
  living: { name: 'Квартира · комната', image: 'evening', description: 'Ты у себя дома. Рядом рюкзак, у окна кресло. Из комнаты можно пройти на кухню, в ванную или спальню. За входной дверью — площадка.', neighbors: ['kitchen', 'bathroom', 'bedroom', 'landing'], outside: false, actions: [activity('sofa','Прилечь на диван','rest',40,-22),activity('window','Посмотреть из-за стены у окна','window',3,1),activity('cupboard','Осмотреть шкаф','search',12,3,true),activity('messages','Прочитать сообщения','listen',7,1),activity('bag','Собрать рюкзак','pack',10,3,true)] },
  kitchen: { name: 'Кухня', image: 'kitchen', description: 'На столе еда, возле раковины бутылки. Можно набрать воду, поискать продукты или передохнуть. Воды и сил на всё не хватит.', neighbors: ['living'], outside: false, actions: [activity('tap','Набрать питьевую воду','water',8,2,true),activity('shelves','Проверить кухонные шкафы','search',13,3,true),activity('chair','Посидеть за столом','rest',20,-10),activity('radio','Послушать сводку','listen',9,1),activity('dishes','Вымыть кружку и руки','wash',6,1,false,1)] },
  bathroom: { name: 'Ванная и туалет', image: 'bathroom', description: 'В ванне можно хранить воду. На полу пустое ведро. Если вода ещё идёт, лучше заполнить ёмкости сейчас.', neighbors: ['living'], outside: false, actions: [activity('bath','Наполнить ванну','water',20,4,true),activity('bottles','Наполнить бутылки','water',9,2,true),activity('shower','Быстро принять душ','wash',12,3,false,2),activity('toilet','Сходить в туалет','toilet',6,1),activity('cabinet','Проверить аптечку','search',9,2,true)] },
  bedroom: { name: 'Спальня', image: 'bedroom', description: 'Кровать не заправлена. В шкафу тёплые вещи, возле кровати телефон. Здесь можно поспать, проверить документы и собрать одежду.', neighbors: ['living'], outside: false, actions: [activity('sleep','Попытаться поспать','rest',85,-38),activity('clothes','Собрать тёплые вещи','pack',15,4,true),activity('drawers','Осмотреть ящики','search',11,3,true),activity('call','Позвонить маме','listen',8,1),activity('curtain','Проверить двор из глубины комнаты','window',3,1)] },
  landing: { name: 'Площадка твоего этажа', image: 'stairs', description: 'За дверями слышны люди. Лестница ведёт вниз. Можно постучать к соседям или проверить, что происходит этажом ниже.', neighbors: ['living','stairs'], outside: false, actions: [activity('knock','Постучать к соседям','listen',8,2),activity('landing-box','Проверить общий ящик','search',10,3,true),activity('stairs-listen','Послушать, что внизу','listen',4,1),activity('landing-sit','Передохнуть на ступеньке','rest',15,-7),activity('blanket','Приготовить вещи к спуску','pack',9,3,true)] },
  stairs: { name: 'Лестница · первый этаж', image: 'stairs', description: 'Дверь во двор приоткрыта. Можно спуститься в подвал, выйти наружу или подняться обратно к квартире.', neighbors: ['landing','cellar','courtyard'], outside: false, actions: [activity('door','Выглянуть из-за двери','window',3,2),activity('mail','Осмотреть ящик у входа','search',8,3,true),activity('voices','Прислушаться к улице','listen',4,1),activity('steps','Присесть у стены','rest',13,-6),activity('bottles-stairs','Проверить оставленные бутылки','search',8,3,true)] },
  cellar: { name: 'Подвал', image: 'shelter', description: 'Здесь соседи, одеяла и канистры. Взрывы слышно глуше. Можно отдохнуть, послушать радио и подготовиться к выходу.', neighbors: ['stairs'], outside: false, actions: [activity('cellar-rest','Отдохнуть у стены','rest',45,-26),activity('cellar-radio','Послушать радио с соседями','listen',14,1),activity('cellar-search','Осмотреть дальний угол','search',16,4,true),activity('cellar-water','Проверить канистры','search',10,3,true),activity('cellar-bag','Подготовить рюкзак к выходу','pack',10,3,true)] },
  courtyard: { name: 'Двор', image: 'courtyard', description: 'До подъезда несколько шагов. Дальше дорога. Здесь опасно задерживаться: если появится военный, для побега понадобятся силы.', neighbors: ['stairs','street'], outside: true, actions: [activity('yard-look','Осмотреть двор из укрытия','window',4,3),activity('yard-water','Проверить бутылки у скамейки','search',9,6,true),activity('neighbor-body','Обыскать погибшего соседа','neighbor',7,6,true),activity('neighbor-cover','Накрыть погибшего соседа','respect',5,4,true),activity('yard-listen','Прислушаться за углом','listen',3,2)] },
  street: { name: 'Улица у дома', image: 'ruins', description: 'Впереди магазин и поликлиника. На улице погибшие и разбитые машины. Можно быстро проверить припасы и вернуться, но каждый лишний шаг отнимает силы.', neighbors: ['courtyard','shop','clinic','gate'], outside: true, actions: [activity('street-car','Проверить брошенную машину','search',12,8,true),activity('soldier-body','Обыскать погибшего военного','soldier',9,8,true),activity('street-body','Проверить сумку рядом с погибшим','neighbor',6,5,true),activity('street-look','Посмотреть за перекрёсток','window',3,3),activity('street-cover','Переждать за бетонной стеной','listen',7,2)] },
  shop: { name: 'Продуктовый магазин', image: 'shop', description: 'Часть полок опрокинута. Под ними могут остаться консервы и вода. Из задней комнаты слышны шорохи. Не трать все силы на поиски.', neighbors: ['street'], outside: true, actions: [activity('shop-shelf','Проверить нижние полки','search',12,7,true),activity('shop-water','Поискать бутылки воды','search',10,6,true),activity('shop-counter','Заглянуть под прилавок','search',14,8,true),activity('shop-back','Осмотреть подсобку','search',18,10,true),activity('shop-listen','Замереть и прислушаться','listen',3,2)] },
  clinic: { name: 'Поликлиника', image: 'lastShelter', description: 'В коридоре холодно. На полу перевёрнутые стулья. В шкафах могут остаться бинты, но на улице рядом ходят вооружённые люди.', neighbors: ['street'], outside: true, actions: [activity('clinic-drawer','Осмотреть медицинский шкаф','search',12,7,true),activity('clinic-desk','Проверить стол регистратуры','search',9,5,true),activity('clinic-water','Поискать воду в ординаторской','search',14,8,true),activity('clinic-listen','Прислушаться у двери','listen',3,2),activity('clinic-window','Проверить путь обратно','window',4,3)] },
  gate: { name: 'Выезд из квартала', image: 'courtyard', description: 'Здесь иногда ждут машины. Место для тебя есть только тогда, когда приходит предложение выехать. В остальное время остаётся искать припасы и возвращаться домой.', neighbors: ['street'], outside: true, actions: [activity('gate-call','Проверить сообщения водителя','listen',7,2),activity('gate-box','Осмотреть коробку у ворот','search',10,6,true),activity('gate-road','Посмотреть на дорогу','window',4,3),activity('gate-bag','Перепаковать вещи','pack',8,3,true),activity('gate-sign','Поискать записки об отъезде','listen',6,2)] },
};
export interface WorldState { active: boolean; place: Room; elapsed: number; fear: number; waterStored: number; pistol: boolean; seed: number; searched: string[]; encounter: boolean; message: string; deathReason: string; turns: number }
export interface Session { story: ChronicleState; world: WorldState }
export const initialWorld: WorldState = { active: false, place: 'living', elapsed: 0, fear: 8, waterStored: 0, pistol: false, seed: 19377, searched: [], encounter: false, message: '', deathReason: '', turns: 0 };
export const openingSession: Session = { story: opening, world: initialWorld };
export type SessionAction = { type: 'story'; action: ChronicleAction } | { type: 'enter' } | { type: 'return' } | { type: 'move'; place: Room } | { type: 'activity'; id: string } | { type: 'run' } | { type: 'hide' };
export function sessionAt(session: Session) { return new Date(Date.parse(chapterAt(session.story).at) + session.world.elapsed * 60000).toISOString(); }
export function travelCost(to: Room) { return locations[to].outside ? 8 : to === 'stairs' || to === 'cellar' || to === 'landing' ? 4 : 2; }
export function worldImage(session: Session): SceneImage {
  if (session.story.ending === 'escaped') return 'exit';
  if (!session.world.active || session.story.ending) return chapterAt(session.story).image;
  if (session.world.encounter) return 'patrol';
  const room = session.world.place; const war = isWartime(chapterAt(session.story));
  if (room === 'living') return war ? 'apartment' : 'evening';
  if (room === 'street' && !war) return 'peace';
  if (room === 'shop' && !war) return 'morning';
  if (room === 'cellar' && chapterAt(session.story).offline) return 'radio';
  if ((room === 'stairs' || room === 'landing') && !war) return 'apartment';
  return locations[room].image;
}
function searchKey(session: Session, action: Activity) { return `${sessionAt(session).slice(0,10)}:${session.world.place}:${action.id}`; }
export function activityBlocked(session: Session, action: Activity): string | null {
  if (session.story.ending) return 'История завершена';
  if (session.world.encounter) return 'Сначала уйди от патруля';
  if ((action.kind === 'neighbor' || action.kind === 'soldier' || action.kind === 'respect') && chapterAt(session.story).at < '2022-03-02') return 'Здесь никого нет';
  if (action.once && session.world.searched.includes(searchKey(session,action))) return 'Сегодня уже проверено';
  if (action.energy > session.story.energy) return 'Не хватает сил';
  if (action.water && action.water > session.story.inventory.water + session.world.waterStored) return 'Не хватает воды';
  if (action.kind === 'water' && chapterAt(session.story).at >= '2022-03-02') return 'Из крана вода не идёт';
  return null;
}
export function takeAction(session: Session, action: SessionAction, randomOverride?: () => number): Session {
  if (session.story.ending) return session;
  if (session.world.encounter && action.type !== 'run' && action.type !== 'hide') return session;
  if (action.type === 'return') return { ...session, world: { ...session.world, active: false } };
  if (action.type === 'enter') return { ...session, world: { ...session.world, active: true } };
  if (action.type === 'story') {
    const story = decide(session.story, action.action);
    if (story === session.story) return session;
    const advance = story.index !== session.story.index;
    return { story, world: { ...session.world, active: advance || story.ending ? false : session.world.active, elapsed: advance ? 0 : session.world.elapsed, fear: Math.min(100, session.world.fear + (advance && isWartime(chapterAt(story)) ? 4 : 0)), message: story.journal[0]?.text ?? '' } };
  }
  if (!session.world.active) return session;
  const next: Session = { story: { ...session.story, inventory: {...session.story.inventory}, journal: [...session.story.journal] }, world: { ...session.world, searched: [...session.world.searched], turns: session.world.turns + 1 } };
  const { story, world } = next;
  const random = () => { world.seed = (Math.imul(world.seed, 1664525) + 1013904223) >>> 0; return randomOverride ? randomOverride() : world.seed / 4294967296; };
  let minutes = 0;
  const war = isWartime(chapterAt(story));
  if (action.type === 'run') {
    if (!world.encounter || story.energy < 15) return session;
    story.energy -= 15; world.place = 'landing'; world.encounter = false; minutes = 6;
    world.fear += 15; world.message = 'Ты бежишь к своему подъезду и поднимаешься на этаж. Военные не пошли следом. Ты дома, но силы потрачены.';
  } else if (action.type === 'hide') {
    if (!world.encounter) return session;
    minutes = 12; story.energy = Math.max(0, story.energy - 3); world.encounter = false;
    if (random() < .35) { story.health -= 30; world.fear += 25; world.message = 'Тебя заметили. Рядом стреляют. Ты получаешь ранение и отползаешь за стену. Патруль уходит, но оставаться здесь нельзя.'; }
    else { world.fear += 10; world.message = 'Ты прижимаешься к стене и не двигаешься. Шаги проходят мимо. Через несколько минут становится тихо.'; }
  } else if (action.type === 'move') {
    if (!locations[world.place].neighbors.includes(action.place)) return session;
    const cost = travelCost(action.place);
    if (story.energy < cost) return session;
    story.energy -= cost; minutes = locations[action.place].outside ? 7 : 3; world.place = action.place;
    world.message = `Ты переходишь: ${locations[action.place].name}. Энергия −${cost}.`;
    if (locations[action.place].outside && war) { world.fear += 6; if (random() < (action.place === 'shop' ? .3 : .16)) { world.encounter = true; world.message = 'Впереди российский военный с автоматом. Он поворачивается в твою сторону. Нужно бежать или спрятаться.'; } }
  } else if (action.type === 'activity') {
    const selected = locations[world.place].actions.find(item => item.id === action.id);
    if (!selected || activityBlocked(session, selected)) return session;
    minutes = selected.minutes; story.energy = Math.min(100, story.energy - selected.energy);
    if (selected.once) world.searched.push(searchKey(session, selected));
    if (selected.water) { const stored = Math.min(world.waterStored, selected.water); world.waterStored -= stored; story.inventory.water -= selected.water - stored; }
    if (selected.kind === 'water') {
      const amount = selected.id === 'bath' ? 6 : 2;
      world.waterStored += amount; world.message = `Ты набираешь воду. Запас в квартире +${amount}. Можно перелить её в бутылки в рюкзаке.`;
      // One portable bottle is part of every successful water collection.
      story.inventory.water += 1;
    } else if (selected.kind === 'rest') {
      world.fear -= 10; world.message = `Ты отдыхаешь ${minutes} минут. Энергия +${Math.min(100 - session.story.energy, -selected.energy)}. ${war ? 'С улицы слышно взрывы. Уснуть трудно.' : 'В квартире тихо.'}`;
    } else if (selected.kind === 'search') {
      const roll = random();
      if (roll < .58) { const item = world.place === 'clinic' || selected.id === 'cabinet' ? 'bandage' : /water|bottles/.test(selected.id) ? 'water' : 'food'; story.inventory[item] += 1; world.message = item === 'food' ? 'Ты находишь целую упаковку еды. Убираешь её в рюкзак.' : item === 'water' ? 'Нашлась закрытая бутылка воды. Ты забираешь её.' : 'В ящике лежит чистый бинт. Ты берёшь его.'; }
      else world.message = 'Ты всё проверяешь. Ничего пригодного не осталось. Возвращаешься к двери.';
    } else if (selected.kind === 'neighbor') {
      const roll = random(); world.fear += 20;
      if (roll < .4) { story.inventory.food += 1; world.message = 'Ты обыскиваешь карманы погибшего. Находишь батончик в целой упаковке. Руки дрожат. Еда +1.'; }
      else if (roll < .6) { story.inventory.water += 1; world.message = 'В сумке погибшего — закрытая бутылка воды. Ты забираешь её и быстро отходишь.'; }
      else if (roll < .7) { story.inventory.bandage += 1; world.message = 'В кармане лежит бинт. Ты забираешь его. Смотреть на лицо не можешь.'; }
      else world.message = 'Ты проверяешь карманы погибшего. Ничего полезного. Тебе страшно и стыдно. Нужно уходить.';
    } else if (selected.kind === 'soldier') {
      const roll = random(); world.fear += 25;
      if (roll < .2 && !world.pistol) { world.pistol = true; world.message = 'У погибшего военного ты находишь пистолет. Патронов нет. Ты убираешь его в сумку. От патруля он не защитит: всё равно придётся уходить.'; }
      else if (roll < .5) { story.inventory.bandage += 1; world.message = 'Ты находишь перевязочный пакет. Оружия, которое можно забрать, нет. Нужно возвращаться.'; }
      else world.message = 'Ты быстро проверяешь снаряжение погибшего. Пусто. Вдали слышны голоса. Ты отходишь к укрытию.';
    } else if (selected.kind === 'respect') { world.fear -= 4; world.message = 'Ты накрываешь погибшего соседа. Говорить нечего. Ты запоминаешь место и отходишь к подъезду.'; }
    else if (selected.kind === 'wash') { world.fear -= 8; world.message = selected.id === 'shower' ? 'Ты быстро моешься. На несколько минут становится легче. Вода потрачена, в ванной холодно.' : 'Ты моешь руки и кружку. Небольшая часть обычной жизни. Вода потрачена.'; }
    else if (selected.kind === 'toilet') { world.fear -= 3; world.message = 'Ты идёшь в туалет, потом возвращаешься в комнату. Стараешься беречь воду.'; }
    else if (selected.kind === 'pack') { world.fear -= 3; world.message = 'Ты проверяешь документы, одежду и рюкзак. Теперь вещи под рукой. Это немного успокаивает.'; }
    else if (selected.kind === 'window') { world.fear += war ? 5 : -2; world.message = war ? 'Ты осторожно смотришь наружу. Слышно взрывы. На улице дым и почти нет людей. Быстро отходишь от окна.' : 'Во дворе идут люди, проезжает машина. Всё выглядит как обычно. Ты отходишь от окна.'; }
    else { const roll = random(); world.message = chapterAt(story).offline ? roll < .5 ? 'Связи нет. Ты снова набираешь номер, но вызов не проходит. Сосед говорит, что на соседней улице искали воду.' : 'С радио доносятся помехи. Соседи говорят о военных у магазина. Надо беречь силы для обратной дороги.' : roll < .5 ? 'Ты дозваниваешься маме. Говоришь, где находишься. Она просит не выходить без необходимости.' : 'В чате пишут о новых взрывах и предлагают делиться водой. Ты запоминаешь, у кого есть запас.'; }
    if (locations[world.place].outside && war && !world.encounter && random() < (world.place === 'shop' ? .25 : .12)) { world.encounter = true; world.message += ' Ты слышишь шаги: из-за угла появляется вооружённый патруль. Бежать или прятаться?'; }
  }
  world.elapsed += minutes;
  if (world.elapsed % 30 < minutes) story.hunger = Math.max(0, story.hunger - 3);
  if (story.hunger === 0) story.health -= 3;
  world.fear = Math.max(0,Math.min(100,world.fear));
  if (story.health <= 0) { story.health = 0; story.ending = 'killed'; world.encounter = false; world.deathReason = 'Ты не пережил ранение. Помощь не успела прийти.'; }
  const nextBeat = chapters[story.index + 1];
  if (!story.ending && !world.encounter && nextBeat && sessionAt(next) >= nextBeat.at) {
    next.story = decide(story, { type: 'continue' }); world.elapsed = 0; world.active = false;
  }
  next.story.journal.unshift({ at: sessionAt(next), text: world.message });
  return next;
}
