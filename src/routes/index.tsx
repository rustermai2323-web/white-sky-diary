import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, ArrowUpRight, Backpack, Bath, Bed, BookOpen, ChevronRight, Clock3, Cloud, Compass, Cross, DoorOpen, Droplet, Footprints, Heart, Home, LoaderCircle, MapPin, PackageOpen, Radio, RotateCcw, Shield, Soup, Sparkles, Utensils, Wifi, WifiOff, X, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SceneBackdrop } from '@/components/scene-backdrop';
import { chapterAt, clockLabel, dateLabel, isWartime, type Supply } from '@/lib/chronicle';
import { images, imageDescriptions } from '@/lib/scene-images';
import { activityBlocked, locations, sessionAt, travelCost, worldImage, type ActivityKind, type Room } from '@/lib/world';
import { useGameSession } from '@/hooks/use-game-session';

export const Route = createFileRoute('/')({
  head: () => ({ meta: [
    { title: 'Белое небо — Мариуполь, февраль–март 2022' },
    { name: 'description', content: 'История мирного жителя Мариуполя: обычная квартира, тревожные новости, поиски воды и припасов, опасные выходы и решение уехать.' },
    { property: 'og:title', content: 'Белое небо — до и после' },
    { property: 'og:description', content: 'Мариуполь, 17 февраля 2022. Пока ещё обычный вечер. Открывай двери, принимай решения и береги силы на обратный путь.' },
    { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary_large_image' },
  ] }), component: Game,
});
const supplies: { id: Supply; label: string; icon: typeof Droplet; effect: string }[] = [
  { id: 'water', label: 'Вода', icon: Droplet, effect: '+12 энергии' }, { id: 'food', label: 'Еда', icon: Soup, effect: '+30 сытости' }, { id: 'bandage', label: 'Бинт', icon: Cross, effect: '+25 здоровья' },
];
const roomIcons: Partial<Record<Room, typeof Home>> = { living: Home, kitchen: Utensils, bathroom: Bath, bedroom: Bed, landing: DoorOpen, stairs: Footprints, cellar: Shield };
const activityIcons: Partial<Record<ActivityKind, typeof Home>> = { rest: Bed, water: Droplet, wash: Bath, toilet: DoorOpen, search: PackageOpen, neighbor: Backpack, soldier: Backpack, listen: Radio, window: Compass, pack: Backpack, respect: Heart };
type Panel = 'journal' | 'about' | 'pause' | null;
function Game() {
  const { session, pending, displayedAt, error, perform, restart: resetSession, retry } = useGameSession();
  const state = session.story; const world = session.world;
  const [panel, setPanel] = useState<Panel>(null);
  const [newsExpanded, setNewsExpanded] = useState(true);
  const dialogRef = useRef<HTMLElement>(null);
  const chapter = chapterAt(state);
  const escaped = state.ending === 'escaped'; const killed = state.ending === 'killed';
  const image = worldImage(session); const prepared = state.prepared.includes(state.index);
  const wartime = isWartime(chapter); const exploring = world.active && !state.ending;
  const actualAt = sessionAt(session);
  const place = exploring ? locations[world.place].name : escaped ? 'Дорога из города' : chapter.place;
  const passingTime = pending !== null && pending.story.index !== state.index;
  useEffect(() => {
    if (!panel) return;
    const previous = document.activeElement; const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden'; dialogRef.current?.querySelector<HTMLButtonElement>('button')?.focus();
    const key = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setPanel(null);
      if (event.key !== 'Tab') return;
      const controls = dialogRef.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)');
      const first = controls?.[0]; const last = controls?.[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener('keydown', key);
    return () => { document.body.style.overflow = oldOverflow; document.removeEventListener('keydown', key); if (previous instanceof HTMLElement) previous.focus(); };
  }, [panel]);
  const restart = () => { resetSession(); setPanel(null); setNewsExpanded(true); };
  return <main className={`game chronicle ${killed ? 'chronicle-ended' : ''}`}>
    <div inert={panel !== null ? true : undefined}>
      <header className="game-header">
        <div className="brand"><div className="brand-mark"><Sparkles size={19} strokeWidth={1} /></div><div><div className="brand-name">белое небо</div><div className="brand-sub">Мариуполь · 2022</div></div></div>
        <div className="chapter">{escaped ? 'Эпилог / Дорога' : exploring ? 'Квартира. Подъезд. Город.' : !wartime ? 'До / Обычная жизнь' : 'После / Остаться в живых'}</div>
        <div className="header-tools"><span className="header-date">{dateLabel(actualAt)}</span><Button variant="ghost" size="icon" className="icon-control" aria-label="Открыть дневник" title="Дневник" onClick={() => setPanel('journal')}><BookOpen size={17} /></Button><Button variant="ghost" size="icon" className="icon-control" aria-label="Пауза" title="Пауза" onClick={() => setPanel('pause')}><Clock3 size={17} /></Button></div>
      </header>
      <section className={`scene ${world.encounter ? 'scene-danger' : ''}`} aria-label={place} aria-busy={pending !== null}>
        <SceneBackdrop src={images[image]} alt={imageDescriptions[image]} />
        <div className="scene-top"><div className="scene-badge"><span className="status-dot" /><span>{dateLabel(actualAt)}</span><span className="opacity-40">/</span><Clock3 size={11} /><time dateTime={actualAt}>{clockLabel(actualAt)}</time></div><div className="scene-weather">{chapter.offline ? <WifiOff size={14} /> : <Cloud size={17} />}<span>{chapter.offline ? 'Нет сети' : '−2°C · Облачно'}</span></div></div>
        <div className="scene-bottom" key={`${chapter.id}-${exploring ? world.place : 'story'}`}><div><div className="eyebrow"><MapPin size={11} />Мариуполь, Украина</div><h1 className="location-title">{escaped ? 'Город остаётся позади' : place}</h1><div className="location-sub">{world.encounter ? 'Военный заметил движение. Решай.' : exploring ? locations[world.place].outside ? 'Обратная дорога тоже потребует сил.' : 'За дверью — следующий выбор.' : escaped ? 'Ты жив.' : wartime ? 'Слышно взрывы.' : 'Обычная жизнь. Пока.'}</div></div><div className="danger-block"><div className="danger-label">{wartime ? 'Опасность' : 'За окном'}</div><div className="danger-value"><Shield size={13} />{world.encounter ? 'Патруль рядом' : exploring && locations[world.place].outside && wartime ? 'Открытое место' : wartime ? 'Обстрелы' : 'Тихий город'}</div></div></div>
        {passingTime && <div className="time-passage" role="status" aria-label="Проходит время"><span>{dateLabel(new Date(displayedAt).toISOString())}</span><strong>{clockLabel(displayedAt)}</strong><span className="passage-line" /><small>{chapterAt(pending.story).at.slice(0, 10) !== chapter.at.slice(0, 10) ? 'Позже' : 'Время идёт'}</small></div>}
        {pending && !passingTime && <div className="scene-loading" role="status" aria-label="Загружается следующий кадр"><LoaderCircle size={16} /></div>}
      </section>
      <div className="story-dateline"><span>{dateLabel(actualAt)}</span><span><Clock3 size={11} />{clockLabel(actualAt)}</span><span>{world.encounter ? 'Нужно укрытие' : exploring ? 'На месте' : 'Дневник'}</span></div>
      <div className="game-content">
        <section className="story-column" aria-label="История и решения">
          {error && <div className="image-error" role="alert"><span>{error}</span><Button variant="outline" size="sm" onClick={retry}><RotateCcw size={13} />Повторить</Button></div>}
          <div key={`${chapter.id}-${exploring ? world.place : 'story'}`} className="story-reveal">
            <div className="story-section-heading"><h2 className="section-title"><Compass size={13} />{escaped ? 'Эпилог' : killed ? 'История оборвалась' : exploring ? 'Вокруг тебя' : 'Сейчас'}</h2>{exploring && <Button variant="ghost" size="sm" className="back-to-story" disabled={pending !== null || world.encounter} onClick={() => perform({ type: 'return' })}><ArrowLeft size={12} />К событиям</Button>}</div>
            <h2 className="story-title">{escaped ? 'Ты всё-таки сел в машину.' : world.deathReason ? 'Не получилось вернуться' : exploring ? world.encounter ? 'Бежать или спрятаться?' : locations[world.place].name : chapter.title}</h2>
            <p className="story-text">{escaped ? 'На выезде все молчат. Ты сжимаешь телефон: впервые за долгое время он нужен не для новостей. «Мам, я выехал». За стеклом исчезает город. Ты не знаешь, когда вернёшься. Но ты жив.' : world.deathReason || (exploring ? !wartime && ['street','shop','courtyard'].includes(world.place) ? 'Пока здесь обычная жизнь. Люди покупают продукты, возвращаются домой, спорят о новостях. Ты можешь осмотреться или пойти дальше.' : locations[world.place].description : chapter.text)}</p>
            {!exploring && <p className="story-thought">{escaped ? '«Пожалуйста, ответь». ' : chapter.thought}</p>}
          </div>
          {state.ending ? <div className="ending-block"><div className="eyebrow">{escaped ? 'Ты покинул город' : `${dateLabel(actualAt)} · ${clockLabel(actualAt)}`}</div><p>{escaped ? 'Твоя история продолжается за пределами города.' : world.deathReason ? 'Ты не вернулся. В дневнике остались твои решения и незаконченные планы.' : 'Ты погиб при артиллерийском ударе по дому. В память о мирных жителях, чью жизнь оборвала война.'}</p><div className="ending-controls"><Button onClick={restart}><RotateCcw size={15} />Начать заново</Button><Button variant="outline" onClick={() => setPanel('journal')}><BookOpen size={15} />Прочитать дневник</Button></div></div> : exploring ? <>
            {world.message && <div key={world.turns} className={`world-event ${world.encounter ? 'world-event-danger' : ''}`} role="status">{world.message}</div>}
            {world.encounter ? <div className="encounter-actions"><Button disabled={pending !== null || state.energy < 15} onClick={() => perform({ type: 'run' })}><Footprints size={17} />Бежать в подъезд <span>−15 сил</span></Button><Button variant="outline" disabled={pending !== null} onClick={() => perform({ type: 'hide' })}><Shield size={16} />Спрятаться и не двигаться</Button>{state.energy < 15 && <p>На бег не хватает сил. Остаётся спрятаться.</p>}</div> : <>
              <div className="choice-heading"><h2 className="section-title">Что сделать</h2><span>{locations[world.place].actions.length} действий</span></div>
              <div className="room-actions">{locations[world.place].actions.map(action => { const blocked = activityBlocked(session,action); const Icon = activityIcons[action.kind] ?? Compass; return <Button key={action.id} variant="ghost" className="room-action" disabled={pending !== null || blocked !== null} title={blocked ?? `${action.minutes} мин`} onClick={() => perform({ type: 'activity', id: action.id })}><Icon size={17} strokeWidth={1.4} /><span><strong>{action.label}</strong><small>{blocked ?? `${action.minutes} мин · ${action.energy < 0 ? '+' : '−'}${Math.abs(action.energy)} энергии${action.water ? ` · ${action.water} воды` : ''}`}</small></span><ChevronRight size={13} /></Button>; })}</div>
              <div className="choice-heading movement-heading"><h2 className="section-title"><DoorOpen size={12} />Куда пойти</h2><span>Береги силы на возвращение</span></div>
              <div className="room-navigation">{locations[world.place].neighbors.map(room => { const Icon = roomIcons[room] ?? Footprints; const cost = travelCost(room); return <Button key={room} variant="outline" disabled={pending !== null || state.energy < cost} onClick={() => perform({ type: 'move', place: room })}><Icon size={15} /><span>{locations[room].name}<small>−{cost} энергии</small></span><ArrowRight size={13} /></Button>; })}</div>
              {chapter.escape && world.place === 'gate' && <Button className="departure-room" disabled={pending !== null} onClick={() => perform({ type: 'story', action: { type: 'escape' } })}><ArrowUpRight size={16} />Сесть в машину и уехать</Button>}
            </>}
          </> : <>
            <div className="choice-heading"><h2 className="section-title">Твоё решение</h2><span>{chapter.escape ? 'В машине ещё есть место' : 'Что сделаешь?'}</span></div>
            <div className={`actions-grid ${chapter.escape ? 'escape-choices' : ''}`}>
              {chapter.escape && <Button disabled={pending !== null} className="action-button evacuation-action" onClick={() => perform({ type: 'story', action: { type: 'escape' } })}><span className="action-top"><ArrowUpRight size={19} /><ArrowRight size={14} /></span><span className="action-name">Уехать из города</span><span className="action-detail">Взять документы и сесть в машину</span></Button>}
              <Button variant="ghost" disabled={pending !== null} className="action-button primary-action" onClick={() => perform({ type: 'story', action: { type: 'continue' } })}><span className="action-top"><ArrowRight size={18} /><Clock3 size={13} /></span><span className="action-name">{chapter.decision}</span><span className="action-detail">{chapter.id === 'last-chance' ? 'Отказаться от последнего места' : 'Продолжить события'}</span></Button>
              <Button variant="ghost" className="action-button" disabled={pending !== null || prepared} onClick={() => perform({ type: 'story', action: { type: 'prepare' } })}><span className="action-top"><PackageOpen size={18} /><Backpack size={13} /></span><span className="action-name">{prepared ? 'Запасы отложены' : chapter.prepare}</span><span className="action-detail">{prepared ? 'Рюкзак пополнен' : state.index % 2 === 0 ? '+1 порция еды' : '+1 бутылка воды'}</span></Button>
            </div>
            <Button className="explore-entry" variant="outline" disabled={pending !== null} onClick={() => perform({ type: 'enter' })}><DoorOpen size={18} /><span>Осмотреться и выбрать действия<small>Квартира · подъезд · город</small></span><ArrowRight size={16} /></Button>
            {world.message && <div className="chronicle-notice" role="status">{world.message}</div>}
          </>}
        </section>
        <aside className="chronicle-sidebar" aria-label="Новости и состояние">
          <section className={`news-feed ${chapter.offline ? 'news-offline' : ''}`} aria-label="Новости и сообщения">
            <div className="phone-top"><span>{clockLabel(actualAt)}</span><span>{chapter.offline ? <WifiOff size={12} /> : <Wifi size={12} />}<span className="battery-level">{!wartime ? '86%' : chapter.offline ? '8%' : '42%'}</span></span></div>
            <Button variant="ghost" className="news-heading" aria-expanded={newsExpanded} onClick={() => setNewsExpanded(!newsExpanded)}><span><Radio size={13} />{chapter.offline ? 'Сохранённое' : 'Новости и сообщения'}</span><span>{newsExpanded ? '−' : '+'}</span></Button>
            {newsExpanded && <div className="news-body" key={chapter.id}><div className="news-source"><span className="status-dot" />{chapter.news.source.replace(' · пересказ', '')}</div><h3>{chapter.news.headline}</h3><p>{chapter.news.body}</p><div className="news-stamp">{dateLabel(chapter.at)} · {clockLabel(chapter.at)}{chapter.offline && <WifiOff size={11} />}</div></div>}
          </section>
          <div className="survivor-heading"><h2 className="section-title">Твоё состояние</h2><span className="alive-label"><span className="status-dot" />{killed ? 'История завершена' : 'Ты жив'}</span></div>
          <div className="stats">{[{ label: 'Здоровье', value: state.health, icon: Heart, kind: 'health' }, { label: 'Сытость', value: state.hunger, icon: Soup, kind: 'hunger' }, { label: 'Энергия', value: state.energy, icon: Zap, kind: 'energy' }, { label: 'Страх', value: world.fear, icon: Shield, kind: 'fear' }].map(stat => <div className={`stat stat-${stat.kind}`} key={stat.kind}><div className="stat-top"><span className="stat-name"><stat.icon size={12} />{stat.label}</span><span>{stat.value}<span className="text-muted-foreground"> / 100</span></span></div><progress className="stat-progress" value={stat.value} max={100} aria-label={stat.label} /></div>)}</div>
          <div className="inventory"><div className="inventory-heading"><h2 className="section-title"><Backpack size={12} />Рюкзак</h2><span className="inventory-count">{Object.values(state.inventory).reduce((a,b) => a+b,0) + (world.pistol ? 1 : 0)} предм.</span></div><div className="inventory-items">{supplies.map(item => <Button key={item.id} variant="ghost" className="item-button" title={`${item.label}: ${item.effect}`} aria-label={`${item.label}: использовать, ${item.effect}. Осталось: ${state.inventory[item.id]}`} disabled={state.ending !== null || pending !== null || world.encounter || state.inventory[item.id] === 0} onClick={() => perform({ type: 'story', action: { type: 'use', item: item.id } })}><item.icon strokeWidth={1.1} /><small>{item.label}</small><span className="item-number">{state.inventory[item.id]}</span></Button>)}</div><div className="home-stock"><Droplet size={12} />Запас воды дома: {world.waterStored}</div>{world.pistol && <div className="home-stock"><Shield size={12} />Пистолет · без патронов</div>}</div>
          <div className="place-status"><MapPin size={12} /><span>{exploring ? locations[world.place].name : chapter.place}</span></div>
        </aside>
      </div>
      <footer className="game-footer"><span className="footer-left"><span className="status-dot" />{killed ? 'В память о мирных жителях.' : escaped ? 'Жизнь продолжается.' : 'Белое небо. До и после.'}</span><nav className="footer-nav" aria-label="Игровое меню"><Button variant="ghost" className="footer-button" onClick={() => setPanel('journal')} title="Дневник"><BookOpen size={13} /><span>Дневник</span></Button><Button variant="ghost" className="footer-button" onClick={() => setPanel('about')} title="Об истории"><Compass size={13} /><span>Об истории</span></Button></nav></footer>
    </div>
    {panel && <div className="modal-backdrop" onClick={event => { if (event.target === event.currentTarget) setPanel(null); }}><section ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="modal-title" className="game-modal"><div className="modal-heading"><h2 id="modal-title">{panel === 'journal' ? 'Дневник' : panel === 'pause' ? 'Пауза' : 'Об истории'}</h2><Button variant="ghost" size="icon" aria-label="Закрыть" onClick={() => setPanel(null)}><X /></Button></div>
      {panel === 'journal' && <><div className="eyebrow">С 17 февраля 2022 года</div>{state.journal.map((entry,index) => <div className="journal-entry" key={`${entry.at}-${index}`}><time>{dateLabel(entry.at)} · {clockLabel(entry.at)}</time><p>{entry.text}</p></div>)}</>}
      {panel === 'pause' && <><div className="eyebrow">{dateLabel(actualAt)} · {clockLabel(actualAt)}</div><p className="modal-prose">{place}<br />{chapter.title}</p><div className="ending-controls"><Button onClick={() => setPanel(null)}><ArrowRight />Продолжить</Button><Button variant="outline" onClick={() => { if (window.confirm('Начать заново? Текущая история будет потеряна.')) restart(); }}><RotateCcw />Начать заново</Button></div></>}
      {panel === 'about' && <><div className="eyebrow">Белое небо · До и после</div><p className="modal-prose">Художественная история мирного жителя Мариуполя с 17 февраля по 12 марта 2022 года. Герой, личные сообщения, маршруты и обстоятельства финала вымышлены. Изображения — художественные реконструкции, не архивные фотографии.</p><p className="modal-prose">Сводки передают общий исторический контекст, но не являются архивными выпусками или дословными обращениями. Доступность выезда относится только к судьбе героя: не все реальные люди могли безопасно покинуть город. Ответственность за гибель мирных жителей не лежит на тех, кто остался.</p><p className="modal-prose">История содержит сцены войны и гибели людей. Прогресс сохраняется только до закрытия страницы.</p><p className="modal-prose">В память о людях, чья обычная жизнь оборвалась из-за войны.</p></>}
    </section></div>}
  </main>;
}
