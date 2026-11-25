import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useRef, useState } from 'react';
import { ArrowRight, ArrowUpRight, Backpack, BookOpen, Clock3, Cloud, Compass, Cross, Droplet, Footprints, Heart, Map, MapPin, PackageOpen, RotateCcw, Settings2, Shield, ShieldAlert, Soup, Sparkles, Wind, X, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { act, initialState, places, timeLabel, type Item, type Place } from '@/lib/game';
import streetImage from '@/assets/mariupol-street.jpg';
import epicenterImage from '@/assets/epicenter.jpg';

export const Route = createFileRoute('/')({
  head: () => ({ meta: [
    { title: 'Белое небо — Мариуполь, 2022' },
    { name: 'description', content: 'Атмосферная история выживания мирного жителя. Мариуполь, март 2022: пустые улицы, поиск припасов и надежда выбраться.' },
    { property: 'og:title', content: 'Белое небо — история выживания' },
    { property: 'og:description', content: 'Мариуполь. Март 2022. Пережить ещё один день и найти дорогу домой.' },
    { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary_large_image' },
  ] }),
  component: Game,
});

type Panel = 'map' | 'journal' | 'settings' | 'about' | null;
function Game() {
  const [state, setState] = useState(initialState);
  const [panel, setPanel] = useState<Panel>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const location = places[state.place];
  const modalOpen = panel !== null || state.ending !== null;
  useEffect(() => {
    if (!modalOpen) return;
    const previous = document.activeElement;
    closeRef.current?.focus();
    const key = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !state.ending) setPanel(null);
      if (event.key === 'Tab') {
        const controls = Array.from(document.querySelectorAll<HTMLButtonElement>('.game-modal button:not(:disabled)'));
        const first = controls.at(0); const last = controls.at(-1);
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    };
    document.addEventListener('keydown', key);
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', key); document.body.style.overflow = oldOverflow; if (previous instanceof HTMLElement) previous.focus(); };
  }, [modalOpen, state.ending]);
  const travel = (place: Place) => { setState(current => act(current, { type: 'travel', place })); setPanel(null); };
  const restart = () => { setState({ ...initialState, inventory: { ...initialState.inventory }, journal: [...initialState.journal] }); setPanel(null); };
  const inventoryCount = Object.values(state.inventory).reduce((sum, count) => sum + count, 0);
  const items: { id: Item; label: string; icon: typeof Droplet; effect: string }[] = [
    { id: 'water', label: 'Вода', icon: Droplet, effect: '+12 энергии' },
    { id: 'food', label: 'Консервы', icon: Soup, effect: '+30 сытости' },
    { id: 'bandage', label: 'Бинт', icon: Cross, effect: '+25 здоровья' },
  ];
  return (
    <main className="game">
      <div inert={modalOpen ? true : undefined}>
      <header className="game-header">
        <div className="brand"><div className="brand-mark"><Sparkles size={19} strokeWidth={1} /></div><div><div className="brand-name">белое небо</div><div className="brand-sub">История выживания</div></div></div>
        <div className="chapter">Глава I <span className="mx-4 opacity-40">/</span> Город без голоса</div>
        <div className="header-tools"><span className="header-date">12 марта 2022</span><Button variant="ghost" size="icon" className="icon-control" aria-label="Открыть дневник" title="Дневник" onClick={() => setPanel('journal')}><BookOpen size={17} /></Button><Button variant="ghost" size="icon" className="icon-control" aria-label="Настройки" title="Настройки" onClick={() => setPanel('settings')}><Settings2 size={17} /></Button></div>
      </header>
      <section className="scene" aria-label={location.name}>
        <img key={state.place === 'epicenter' ? 'epicenter' : 'street'} className="scene-image" src={state.place === 'epicenter' ? epicenterImage : streetImage} alt={state.place === 'epicenter' ? 'Разрушенный торговый центр под пасмурным небом, художественная реконструкция' : 'Разрушенные жилые дома на пустой улице под белым небом, художественная реконструкция'} />
        <div className="scene-top"><div className="scene-badge"><span className="status-dot" />ДЕНЬ {Math.floor(state.minutes / 1440) + 17}<span className="mx-1 opacity-40">/</span><Clock3 size={11} />{timeLabel(state.minutes)}</div><div className="scene-weather"><Cloud size={17} strokeWidth={1.4} /><span>−2°C</span><span className="mx-1 opacity-50">·</span><Wind size={14} /><span>Тихий ветер</span></div></div>
        <div className="scene-bottom"><div><div className="eyebrow"><MapPin size={11} /> Мариуполь, Украина</div><h1 className="location-title">{location.name}</h1><div className="location-sub">{state.place === 'shelter' ? 'Временное укрытие. Здесь немного тише.' : 'Когда-то здесь была обычная жизнь.'}</div></div><div className="danger-block"><div className="danger-label">Уровень опасности</div><div className="danger-value"><ShieldAlert size={13} />{location.risk}<span className="ml-3 flex gap-1"><i className="h-2 w-1 bg-warning" /><i className="h-2 w-1 bg-warning" /><i className="h-2 w-1 bg-warning/30" /><i className="h-2 w-1 bg-warning/15" /></span></div></div></div>
      </section>
      <div className="game-content">
        <section className="story-column" aria-label="История и решения">
          <h2 className="section-title"><Compass size={13} strokeWidth={1.5} />Вокруг вас</h2>
          <p className="story-text">{location.description}</p>
          <p className="story-thought">«Главное — не стоять на открытом месте слишком долго».</p>
          {state.message && <div className="event-message" role="status" key={state.turns}>{state.message}</div>}
          <div className="choice-heading"><h2 className="section-title">Ваше решение</h2><span>Каждый выбор имеет значение</span></div>
          <div className="actions-grid">
            <Button variant="ghost" className="action-button primary-action" onClick={() => setPanel('map')}><span className="action-top"><Footprints size={18} strokeWidth={1.4} /><ArrowUpRight size={13} /></span><span className="action-name">Продолжить путь</span><span className="action-detail">Выбрать, куда пойти</span></Button>
            <Button variant="ghost" className="action-button" disabled={state.searched.includes(state.place)} onClick={() => setState(current => act(current, { type: 'search' }))}><span className="action-top"><PackageOpen size={18} strokeWidth={1.4} /><span className="text-[9px] text-muted-foreground">20 мин</span></span><span className="action-name">{state.searched.includes(state.place) ? 'Всё осмотрено' : 'Поискать припасы'}</span><span className="action-detail">{state.searched.includes(state.place) ? 'Здесь больше ничего нет' : 'Осмотреть здания рядом'}</span></Button>
            <Button variant="ghost" className="action-button" onClick={() => setState(current => act(current, { type: 'rest' }))}><span className="action-top"><Shield size={18} strokeWidth={1.4} /><span className="text-[9px] text-muted-foreground">1 час</span></span><span className="action-name">Остаться и переждать</span><span className="action-detail">Отдохнуть в укрытии</span></Button>
          </div>
        </section>
        <aside className="survivor" aria-label="Состояние и рюкзак">
          <div className="survivor-heading"><h2 className="section-title">Ваше состояние</h2><span className="alive-label"><span className="status-dot" />Вы живы</span></div>
          <div className="stats">{[{ label: 'Здоровье', value: state.health, icon: Heart, kind: 'health' }, { label: 'Сытость', value: state.hunger, icon: Soup, kind: 'hunger' }, { label: 'Энергия', value: state.energy, icon: Zap, kind: 'energy' }].map(stat => <div key={stat.kind} className={`stat stat-${stat.kind}`}><div className="stat-top"><span className="stat-name"><stat.icon size={12} strokeWidth={1.5} />{stat.label}</span><span>{stat.value}<span className="text-muted-foreground"> / 100</span></span></div><div className="stat-track" role="meter" aria-label={stat.label} aria-valuenow={stat.value} aria-valuemin={0} aria-valuemax={100}><div className="stat-fill" style={{ width: `${stat.value}%` }} /></div></div>)}</div>
          <div className="inventory"><div className="inventory-heading"><h2 className="section-title"><Backpack size={12} />Рюкзак</h2><span className="inventory-count">{inventoryCount} предм.</span></div><div className="inventory-items">{items.map(item => <Button key={item.id} variant="ghost" className="item-button" title={`${item.label}: ${item.effect}`} aria-label={`${item.label}: использовать, ${item.effect}. Осталось: ${state.inventory[item.id]}`} disabled={state.inventory[item.id] === 0} onClick={() => setState(current => act(current, { type: 'use', item: item.id }))}><item.icon strokeWidth={1.1} /><small>{item.label}</small><span className="item-number">{state.inventory[item.id]}</span></Button>)}</div></div>
        </aside>
      </div>
      <footer className="game-footer"><span className="footer-left"><span className="status-dot" />{state.knowsExit ? 'Найдите западный выезд. Есть надежда.' : 'Пережить ещё один день. Найти путь домой.'}</span><nav className="footer-nav" aria-label="Игровое меню"><Button variant="ghost" className="footer-button" onClick={() => setPanel('map')} title="Карта города"><Map size={13} /><span>Карта города</span></Button><Button variant="ghost" className="footer-button" onClick={() => setPanel('journal')} title="Дневник"><BookOpen size={13} /><span>Дневник</span></Button><Button variant="ghost" className="footer-button" onClick={() => setPanel('about')} title="Об истории"><Compass size={13} /><span>Об истории</span></Button></nav></footer>
      </div>
      {modalOpen && <div className="modal-backdrop" onClick={event => { if (event.target === event.currentTarget && !state.ending) setPanel(null); }}><section role="dialog" aria-modal="true" aria-labelledby="modal-title" className="game-modal"><div className="modal-heading"><h2 id="modal-title">{state.ending ? 'Белое небо' : panel === 'map' ? 'Куда дальше?' : panel === 'journal' ? 'Дневник' : panel === 'settings' ? 'Пауза' : 'Об истории'}</h2>{!state.ending && <Button ref={closeRef} variant="ghost" size="icon" aria-label="Закрыть" onClick={() => setPanel(null)}><X /></Button>}</div>
        {state.ending ? <><div className="eyebrow">{state.ending === 'rescued' ? 'Конец первой главы' : 'История оборвалась'}</div><h3 className="ending-title">{state.ending === 'rescued' ? 'Вы выбрались.' : 'Сил больше нет.'}</h3><p className="modal-prose">{state.ending === 'rescued' ? 'Микроавтобус трогается. Город медленно исчезает за запотевшим стеклом. Вы живы. И пока этого достаточно.' : 'Город оказался сильнее. Но эту историю можно начать заново — беречь силы, искать укрытие и не забывать о припасах.'}</p><Button ref={closeRef} className="mt-6" onClick={restart}><RotateCcw />Начать заново</Button></> : null}
        {!state.ending && panel === 'map' && <><div className="eyebrow mb-5"><MapPin size={12} />Сейчас: {location.name}</div><div className="place-list">{(Object.entries(places) as [Place, typeof location][]).map(([id, place]) => <Button key={id} variant="ghost" className="place-option" disabled={id === state.place || (id === 'exit' && !state.knowsExit)} onClick={() => travel(id)}><span><strong>{place.name}</strong><small>{id === state.place ? 'Вы здесь' : id === 'exit' && !state.knowsExit ? 'Путь пока неизвестен' : `30 мин пешком · Опасность: ${place.risk.toLowerCase()}`}</small></span>{id === state.place ? <MapPin size={16} /> : <ArrowRight size={16} />}</Button>)}</div></>}
        {!state.ending && panel === 'journal' && <><div className="eyebrow">12 марта 2022 · День 17</div>{state.journal.map((entry, index) => <div className="journal-entry" key={`${index}-${entry}`}>{entry}</div>)}</>}
        {!state.ending && panel === 'settings' && <><p className="modal-prose">Мариуполь · 12 марта 2022 · {timeLabel(state.minutes)}<br />{location.name}</p><div className="mt-7 flex flex-wrap gap-3"><Button onClick={() => setPanel(null)}><ArrowRight />Продолжить</Button><Button variant="outline" onClick={() => { if (window.confirm('Начать заново? Текущий прогресс будет потерян.')) restart(); }}><RotateCcw />Начать заново</Button></div></>}
        {!state.ending && panel === 'about' && <><div className="eyebrow">Белое небо · Глава I</div><p className="modal-prose mt-5">Художественная история о мирном жителе во время осады Мариуполя в 2022 году. Персонаж, события и маршруты вымышлены. Изображения — художественные реконструкции, а не документальные фотографии.</p><p className="modal-prose mt-4">В память о людях, чья обычная жизнь оборвалась из-за войны.</p></>}
      </section></div>}
    </main>
  );
}
