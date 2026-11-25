import { describe, expect, it } from 'vitest';
import { act, initialState } from '../lib/game';
describe('survival decisions', () => {
  it('search adds one food and takes twenty minutes', () => {
    const state = act(initialState, { type: 'search' });
    expect(state.inventory.food).toBe(2);
    expect(state.minutes).toBe(542);
  });
  it('cannot loot a location twice', () => {
    const state = act(initialState, { type: 'search' });
    expect(act(state, { type: 'search' })).toBe(state);
  });
  it('consuming food removes one can and restores thirty satiety', () => {
    const state = act(initialState, { type: 'use', item: 'food' });
    expect(state.inventory.food).toBe(0);
    expect(state.hunger).toBe(92);
  });
  it('cannot use absent items', () => {
    const state = { ...initialState, inventory: { water: 0, food: 0, bandage: 0 } };
    expect(act(state, { type: 'use', item: 'water' })).toBe(state);
  });
  it('shelter restores thirty energy over one hour', () => {
    const state = act({ ...initialState, place: 'shelter' }, { type: 'rest' });
    expect(state.energy).toBe(78);
    expect(state.minutes).toBe(582);
  });
  it('evacuation is unavailable until the clinic clue is found', () => {
    expect(act(initialState, { type: 'travel', place: 'exit' })).toBe(initialState);
    const clinic = act(initialState, { type: 'travel', place: 'clinic' });
    expect(clinic.knowsExit).toBe(true);
    expect(act(clinic, { type: 'travel', place: 'exit' }).ending).toBe('rescued');
  });
});
