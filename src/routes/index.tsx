import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useRef, useState } from 'react';
import { ArrowRight, ArrowUpRight, Backpack, BookOpen, Clock3, Cloud, Compass, Cross, Droplet, Heart, PackageOpen, Radio, RotateCcw, Shield, Soup, Sparkles, VolumeX, Wifi, WifiOff, X, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { chapterAt, chapters, clockLabel, dateLabel, decide, opening, transitionTime, type ChronicleAction, type ChronicleState, type SceneImage, type Supply } from '@/lib/chronicle';
import peacefulImage from '@/assets/peaceful-mariupol.jpg';
import nightImage from '@/assets/first-night.jpg';
import eveningImage from '@/assets/last-peaceful-night.jpg';
import morningImage from '@/assets/first-morning.jpg';
import ruinsImage from '@/assets/mariupol-street.jpg';
import patrolImage from '@/assets/siege-patrol.jpg';
import exitImage from '@/assets/leaving-city.jpg';

export const Route = createFileRoute('/')({
  head: () => ({ meta: [
    { title: 'Белое небо — Мариуполь, февраль–март 2022' },
    { name: 'description', content: 'Интерактивная история мирного жителя: неделя до вторжения, тревожные новости, осада Мариуполя и выбор — уехать или остаться.' },
    { property: 'og:title', content: 'Белое небо — до и после' },
    { property: 'og:description', content: 'Мариуполь, 17 февраля 2022. Пока ещё обычный вечер. Художественная история о жизни, войне и решении уехать.' },
    { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary_large_image' },
  ] }), component: Game,
});
const images: Record<SceneImage, string> = { peace: peacefulImage, evening: eveningImage, night: nightImage, morning: morningImage, ruins: ruinsImage, patrol: patrolImage, exit: exitImage };
const descriptions: Record<SceneImage, string> = { peace: 'Мирный Мариуполь: прохожие, машины и театр под зимним небом', evening: 'Тихий мирный двор с освещёнными окнами вечером перед вторжением', night: 'Ночной жилой квартал и далёкое зарево на горизонте', morning: 'Очереди у магазинов в первые дни вторжения', ruins: 'Разрушенные дома под белым небом', patrol: 'Российский вооружённый патруль и повреждённый брошенный танк на разрушенной улице', exit: 'Город за окном машины, выезжающей из Мариуполя' };
const supplies: { id: Supply; label: string; icon: typeof Droplet; effect: string }[] = [
  { id: 'water', label: 'Вода', icon: Droplet, effect: '+12 энергии' }, { id: 'food', label: 'Еда', icon: Soup, effect: '+30 сытости' }, { id: 'bandage', label: 'Бинт', icon: Cross, effect: '+25 здоровья' },
];
type Panel = 'journal' | 'about' | 'pause' | null;
function Game() {
  const [state, setState] = useState<ChronicleState>(opening);
  const [panel, setPanel] = useState<Panel>(null);
  const [pending, setPending] = useState<ChronicleState | null>(null);
  const [displayedAt, setDisplayedAt] = useState(Date.parse(chapterAt(opening).at));
  const [newsExpanded, setNewsExpanded] = useState(true);
  const dialogRef = useRef<HTMLElement>(null);
  const chapter = chapterAt(state);
  const escaped = state.ending === 'escaped';
  const killed = state.ending === 'killed';
  const image = escaped ? 'exit' : chapter.image;
  const prepared = state.prepared.includes(state.index);
  const wartime = state.index >= 5;
  useEffect(() => {
    if (!pending) return;
    const from = Date.parse(chapterAt(state).at); const to = Date.parse(chapterAt(pending).at);
    const duration = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 2200;
    let frame = 0; const start = performance.now();
    const tick = (now: number) => {
      const progress = duration === 0 ? 1 : Math.min(1, (now - start) / duration);
      setDisplayedAt(transitionTime(from, to, progress));
      if (progress < 1) frame = requestAnimationFrame(tick);
      else { setState(pending); setPending(null); }
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [pending, state]);
  useEffect(() => {
    if (!panel) return;
    const previous = document.activeElement;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialogRef.current?.querySelector<HTMLButtonElement>('button')?.focus();
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
  function perform(action: ChronicleAction) {
    if (pending) return;
    const next = decide(state, action);
    if (next.index !== state.index) setPending(next); else setState(next);
  }
  function restart() { setPending(null); setState(opening); setDisplayedAt(Date.parse(chapterAt(opening).at)); setPanel(null); setNewsExpanded(true); }
  const latestEntry = state.journal[0];
  return <main className={`game chronicle ${killed ? 'chronicle-ended' : ''}`}>
    <div inert={panel !== null ? true : undefined}>
      <header className="game-header">
        <div className="brand"><div className="brand-mark"><Sparkles size={19} strokeWidth={1} /></div><div><div className="brand-name">белое небо</div><div className="brand-sub">Мариуполь · 2022</div></div></div>
        <div className="chapter">{escaped ? 'Эпилог / Дорога' : state.index < 3 ? 'Пролог / Обычная жизнь' : wartime ? 'Глава I / После' : '24 февраля / До рассвета'}</div>
        <div className="header-tools"><span className="header-date">{dateLabel(chapter.at)}</span><Button variant="ghost" size="icon" className="icon-control" aria-label="Открыть дневник" title="Дневник" onClick={() => setPanel('journal')}><BookOpen size={17} /></Button><Button variant="ghost" size="icon" className="icon-control" aria-label="Пауза" title="Пауза" onClick={() => setPanel('pause')}><Clock3 size={17} /></Button></div>
      </header>
      <section className={`scene ${killed ? 'scene-silent' : ''}`} aria-label={escaped ? 'Дорога из города' : chapter.place} aria-busy={pending !== null}>
        <img key={image} className="scene-image" src={images[image]} alt={`${descriptions[image]}. Художественная реконструкция, не архивное фото.`} />
        <div className="scene-top"><div className="scene-badge"><span className="status-dot" /><span>{dateLabel(chapter.at)}</span><span className="opacity-40">/</span><Clock3 size={11} /><time dateTime={chapter.at}>{clockLabel(chapter.at)}</time></div><div className="scene-weather">{chapter.offline ? <WifiOff size={14} /> : <Cloud size={17} />}<span>{chapter.offline ? 'Нет сети' : '−2°C · Облачно'}</span></div></div>
        <div className="scene-bottom"><div><div className="eyebrow">Мариуполь, Украина</div><h1 className="location-title">{escaped ? 'Город остаётся позади' : chapter.place}</h1><div className="location-sub">{escaped ? 'Вы выбрались. Но часть вас осталась здесь.' : wartime ? 'То же небо. Совсем другая жизнь.' : 'Когда обычный день ещё кажется обещанием.'}</div></div><div className="danger-block"><div className="danger-label">{wartime ? 'Состояние города' : 'До вторжения'}</div><div className="danger-value">{wartime ? <Shield size={13} /> : <Clock3 size={13} />}{state.index < 3 ? `${7 - Math.floor((Date.parse(chapter.at) - Date.parse(chapters[0]?.at ?? chapter.at)) / 86400000)} дней` : chapter.offline ? 'Под обстрелами' : wartime ? 'Война' : 'Несколько часов'}</div></div></div>
        {pending && <div className="time-passage" role="status" aria-label="Проходит время"><span>{dateLabel(new Date(displayedAt).toISOString())}</span><strong>{clockLabel(displayedAt)}</strong><span className="passage-line" /><small>{chapterAt(pending).at.slice(0, 10) !== chapter.at.slice(0, 10) ? 'Следующий день дневника' : 'Позже в тот же день'}</small></div>}
        <span className="scene-caption">Художественная реконструкция</span>
      </section>
      <div className="chronicle-progress" aria-label={`Эпизод ${state.index + 1} из ${chapters.length}`}><span>17.02</span><div className="progress-segments">{chapters.map((beat, index) => <i key={beat.id} className={index <= state.index ? 'visited' : ''} title={`${dateLabel(beat.at)} · ${clockLabel(beat.at)}`} />)}</div><span>12.03</span></div>
      <div className="game-content">
        <section className="story-column" aria-label="История и решения">
          <h2 className="section-title"><Compass size={13} />{escaped ? 'Эпилог' : killed ? 'История оборвалась' : `${dateLabel(chapter.at)} · ${clockLabel(chapter.at)}`}</h2>
          <h2 className="story-title" key={chapter.id}>{escaped ? 'Вы всё-таки сели в машину.' : chapter.title}</h2>
          <p className="story-text">{escaped ? 'На выезде все молчат. Вы сжимаете телефон: впервые за долгое время он нужен не для новостей. «Мам, я выехал». За стеклом медленно исчезает город. Вы не знаете, когда вернётесь. Но ваша история продолжается.' : chapter.text}</p>
          <p className="story-thought">{escaped ? '«Я жив. Пожалуйста, ответь». ' : chapter.thought}</p>
          {state.ending ? <div className="ending-block"><div className="eyebrow">{escaped ? 'Вы покинули город' : '12 марта 2022 · 08:42'}</div><p>{escaped ? 'Выезд героя — вымышленный эпизод, а не воспроизведение безопасного маршрута.' : 'Герой погиб при артиллерийском ударе по дому. Его судьба вымышлена. В память о мирных жителях, чью жизнь оборвала война.'}</p><div className="ending-controls"><Button onClick={restart}><RotateCcw size={15} />Начать заново</Button><Button variant="outline" onClick={() => setPanel('journal')}><BookOpen size={15} />Прочитать дневник</Button></div></div> : <>
            <div className="choice-heading"><h2 className="section-title">Ваше решение</h2><span>{chapter.escape ? 'Место в машине ещё есть' : 'Что вы сделаете?'}</span></div>
            <div className={`actions-grid ${chapter.escape ? 'escape-choices' : ''}`}>
              {chapter.escape && <Button disabled={pending !== null} className="action-button evacuation-action" onClick={() => perform({ type: 'escape' })}><span className="action-top"><ArrowUpRight size={19} /><ArrowRight size={14} /></span><span className="action-name">Уехать из города</span><span className="action-detail">Взять документы и сесть в машину</span></Button>}
              <Button variant="ghost" disabled={pending !== null} className="action-button primary-action" onClick={() => perform({ type: 'continue' })}><span className="action-top"><ArrowRight size={18} /><Clock3 size={13} /></span><span className="action-name">{chapter.decision}</span><span className="action-detail">{chapter.id === 'last-chance' ? 'Отказаться от последнего места' : 'Время идёт дальше'}</span></Button>
              <Button variant="ghost" className="action-button" disabled={pending !== null || prepared} onClick={() => perform({ type: 'prepare' })}><span className="action-top"><PackageOpen size={18} /><Backpack size={13} /></span><span className="action-name">{prepared ? 'Запасы отложены' : chapter.prepare}</span><span className="action-detail">{prepared ? 'Рюкзак пополнен' : state.index % 2 === 0 ? '+1 порция еды' : '+1 бутылка воды'}</span></Button>
            </div>
            {latestEntry && prepared && <div className="chronicle-notice" role="status">{latestEntry.text}</div>}
          </>}
        </section>
        <aside className="chronicle-sidebar" aria-label="Новости и состояние">
          <section className={`news-feed ${chapter.offline ? 'news-offline' : ''}`} aria-label="Новости и сообщения">
            <div className="phone-top"><span>{clockLabel(chapter.at)}</span><span>{chapter.offline ? <WifiOff size={12} /> : <Wifi size={12} />}<span className="battery-level">{state.index < 5 ? '86%' : chapter.offline ? '8%' : '42%'}</span></span></div>
            <Button variant="ghost" className="news-heading" aria-expanded={newsExpanded} onClick={() => setNewsExpanded(!newsExpanded)}><span><Radio size={13} />{chapter.offline ? 'Сохранённое' : 'Новости и сообщения'}</span><span>{newsExpanded ? '−' : '+'}</span></Button>
            {newsExpanded && <div className="news-body" key={chapter.id}><div className="news-source"><span className="status-dot" />{chapter.news.source}</div><h3>{chapter.news.headline}</h3><p>{chapter.news.body}</p><div className="news-stamp">{dateLabel(chapter.at)} · {clockLabel(chapter.at)}{chapter.offline && <WifiOff size={11} />}</div></div>}
            <div className="news-disclosure">Личные сообщения вымышлены. Сводки — художественный пересказ, не дословные цитаты.</div>
          </section>
          <div className="survivor-heading"><h2 className="section-title">Ваше состояние</h2><span className="alive-label"><span className="status-dot" />{killed ? 'История завершена' : 'Вы живы'}</span></div>
          <div className="stats">{[{ label: 'Здоровье', value: state.health, icon: Heart, kind: 'health' }, { label: 'Сытость', value: state.hunger, icon: Soup, kind: 'hunger' }, { label: 'Энергия', value: state.energy, icon: Zap, kind: 'energy' }].map(stat => <div className={`stat stat-${stat.kind}`} key={stat.kind}><div className="stat-top"><span className="stat-name"><stat.icon size={12} />{stat.label}</span><span>{stat.value}<span className="text-muted-foreground"> / 100</span></span></div><progress className="stat-progress" value={stat.value} max={100} aria-label={stat.label} /></div>)}</div>
          <div className="inventory"><div className="inventory-heading"><h2 className="section-title"><Backpack size={12} />Рюкзак</h2><span className="inventory-count">{Object.values(state.inventory).reduce((a, b) => a + b, 0)} предм.</span></div><div className="inventory-items">{supplies.map(item => <Button key={item.id} variant="ghost" className="item-button" title={`${item.label}: ${item.effect}`} aria-label={`${item.label}: использовать, ${item.effect}. Осталось: ${state.inventory[item.id]}`} disabled={state.ending !== null || pending !== null || state.inventory[item.id] === 0} onClick={() => perform({ type: 'use', item: item.id })}><item.icon strokeWidth={1.1} /><small>{item.label}</small><span className="item-number">{state.inventory[item.id]}</span></Button>)}</div></div>
        </aside>
      </div>
      <footer className="game-footer"><span className="footer-left"><VolumeX size={12} />{killed ? 'В память о мирных жителях.' : escaped ? 'Жизнь продолжается.' : 'Белое небо. До и после.'}</span><nav className="footer-nav" aria-label="Игровое меню"><Button variant="ghost" className="footer-button" onClick={() => setPanel('journal')} title="Дневник"><BookOpen size={13} /><span>Дневник</span></Button><Button variant="ghost" className="footer-button" onClick={() => setPanel('about')} title="Об истории"><Compass size={13} /><span>Об истории</span></Button></nav></footer>
    </div>
    {panel && <div className="modal-backdrop" onClick={event => { if (event.target === event.currentTarget) setPanel(null); }}><section ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="modal-title" className="game-modal"><div className="modal-heading"><h2 id="modal-title">{panel === 'journal' ? 'Дневник' : panel === 'pause' ? 'Пауза' : 'Об истории'}</h2><Button variant="ghost" size="icon" aria-label="Закрыть" onClick={() => setPanel(null)}><X /></Button></div>
      {panel === 'journal' && <><div className="eyebrow">С 17 февраля 2022 года</div>{state.journal.map((entry, index) => <div className="journal-entry" key={`${entry.at}-${index}`}><time>{dateLabel(entry.at)} · {clockLabel(entry.at)}</time><p>{entry.text}</p></div>)}</>}
      {panel === 'pause' && <><div className="eyebrow">{dateLabel(chapter.at)} · {clockLabel(chapter.at)}</div><p className="modal-prose">{chapter.place}<br />{chapter.title}</p><div className="ending-controls"><Button onClick={() => setPanel(null)}><ArrowRight />Продолжить</Button><Button variant="outline" onClick={() => { if (window.confirm('Начать заново? Текущая история будет потеряна.')) restart(); }}><RotateCcw />Начать заново</Button></div></>}
      {panel === 'about' && <><div className="eyebrow">Белое небо · До и после</div><p className="modal-prose">Художественная история мирного жителя Мариуполя с 17 февраля по 12 марта 2022 года. Герой, личные сообщения, маршруты, даты локальных событий и обстоятельства финала вымышлены. Изображения созданы искусственным интеллектом: это реконструкции, а не документальные снимки.</p><p className="modal-prose">Сводки пересказывают общий исторический контекст; это не архивные выпуски и не дословные обращения. Выбор уехать относится только к этой истории: он не означает, что все реальные люди могли безопасно покинуть город. Ответственность за гибель мирных жителей не лежит на тех, кто остался.</p><p className="modal-prose">Содержит сцены войны, неявное изображение гибели людей и трагический финал. Прогресс сохраняется только до закрытия страницы.</p><p className="modal-prose">В память о людях, чья обычная жизнь оборвалась из-за войны.</p></>}
    </section></div>}
  </main>;
}
