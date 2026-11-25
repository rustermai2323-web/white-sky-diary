import { describe, expect, it } from 'vitest';
import { chapters, chapterAt, clockLabel, decide, opening, transitionTime, type ChronicleState } from '../lib/chronicle';
function reach(id: string) { let state: ChronicleState = opening; for (let i = 0; i < chapters.length && chapterAt(state).id !== id; i++) state = decide(state, { type: 'continue' }); return state; }
describe('dated chronicle', () => {
  it('starts one week before February 24', () => { expect(chapterAt(opening).at).toBe('2022-02-17T18:10:00Z'); });
  it('moves from 04:00 through the first alarms to 08:00 on February 24', () => {
    let state = reach('four'); const times = [clockLabel(chapterAt(state).at)];
    for (let i = 0; i < 3; i++) { state = decide(state, { type: 'continue' }); times.push(clockLabel(chapterAt(state).at)); }
    expect(times).toEqual(['04:00', '04:15', '05:30', '08:00']); expect(chapterAt(state).at.slice(0, 10)).toBe('2022-02-24');
  });
  it('allows the civilian to survive by leaving on February 25, 26 or 27', () => { for (const id of ['departure-one', 'departure-two', 'last-chance']) expect(decide(reach(id), { type: 'escape' }).ending).toBe('escaped'); });
  it('does not allow early or late evacuation', () => { expect(decide(opening, { type: 'escape' })).toBe(opening); const closed = reach('closed'); expect(decide(closed, { type: 'escape' })).toBe(closed); });
  it('staying ends with death from the scripted strike on March 12 at 08:42', () => { const state = reach('impact'); expect(state.ending).toBe('killed'); expect(state.health).toBe(0); expect(chapterAt(state).at).toBe('2022-03-12T08:42:00Z'); });
  it('locks either ending against further decisions', () => { for (const state of [decide(reach('last-chance'), { type: 'escape' }), reach('impact')]) expect(decide(state, { type: 'continue' })).toBe(state); });
  it('preparation adds one item once per scene', () => { const state = decide(opening, { type: 'prepare' }); expect(state.inventory.food).toBe(2); expect(decide(state, { type: 'prepare' })).toBe(state); });
  it('consumes available supplies and applies their exact effects', () => { const state = { ...opening, health: 40, hunger: 40, energy: 40 }; expect(decide(state, { type: 'use', item: 'food' }).hunger).toBe(70); expect(decide(state, { type: 'use', item: 'water' }).energy).toBe(52); expect(decide(state, { type: 'use', item: 'bandage' }).health).toBe(65); expect(decide(state, { type: 'use', item: 'food' }).inventory.food).toBe(0); });
  it('cannot consume an empty supply', () => { const state = { ...opening, inventory: { water: 0, food: 0, bandage: 0 } }; expect(decide(state, { type: 'use', item: 'water' })).toBe(state); });
  it('accelerates the clock and arrives exactly at the next event', () => { expect(transitionTime(0, 240, .5)).toBe(30); expect(transitionTime(0, 240, 1)).toBe(240); expect(transitionTime(0, 240, .75) - transitionTime(0, 240, .5)).toBeGreaterThan(transitionTime(0, 240, .5) - transitionTime(0, 240, .25)); });
  it('story dates always move forward', () => { for (let i = 1; i < chapters.length; i++) expect(Date.parse(chapters[i]?.at ?? '')).toBeGreaterThan(Date.parse(chapters[i - 1]?.at ?? '')); });
});
