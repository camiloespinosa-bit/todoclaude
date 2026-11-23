// Bloque 4 · The World is Mine — "The Time Travel Stage" (S24 show)
import { runGame } from '../engine.js';
import { EVERY_RIGHT, TODAY_TOMORROW, CAN_Q, ADVICE_Q, PAST_Q, MIX_Q } from '../content.js';

// ---------- Worlds ----------
const WORLDS = [
  {
    key: 'past', short: 'Past', name: 'YESTERDAY LAND', tense: 'This is the PAST.',
    color: '#F57C00', light: '#FFCC80', ground: '#E8A15A', ground2: '#D98A3E', path: '#F6D2A2', rock: '#7A4A2A', rock2: '#5B3820',
    skyTop: '#F4A259', skyBottom: '#FDEBD3', fog: '#F9DDBF', hemi: ['#FFF3E0', '#B07A4E', 1.9], sun: ['#FFE0B2', 2.4],
    music: [261.6, 293.7, 329.6, 392.0, 440.0, 523.3],
    frames: ['<b>Yesterday</b>, I ...', '<b>Last year</b>, I <b>went</b> to ...'],
    quests: [
      { type: 'collect', name: 'Find 3 things', short: 'Things', items: ['bike', 'ball', 'dog', 'plane', 'rain', 'book'] },
      { type: 'stones', name: 'Word Stones', short: 'Words', title: 'Word Stones', bank: PAST_Q, count: 3 },
      { type: 'talk', name: 'Talk on the stage' },
      { type: 'portal', name: 'Go into the portal' },
    ],
  },
  {
    key: 'present', short: 'Present', name: 'TODAY TOWN', tense: 'This is the PRESENT.',
    color: '#57A6B5', light: '#B2E0E8', ground: '#7CC08A', ground2: '#5FA56E', path: '#E6EEF2', rock: '#2C5F7C', rock2: '#1D3F54',
    skyTop: '#62B6CB', skyBottom: '#EAF6F8', fog: '#DDEFF3', hemi: ['#FFFFFF', '#6E9A7A', 2.0], sun: ['#FFFFFF', 2.3],
    music: [392.0, 440.0, 493.9, 587.3, 659.3, 784.0],
    frames: ['<b>Right now</b>, I <b>am</b> ...<b>ing</b>', '<b>Every day</b>, I ...', 'I <b>can</b> ...', 'I <b>think</b> ... <b>because</b> ...'],
    quests: [
      { type: 'actions', name: 'What are they doing?', short: 'Actions' },
      { type: 'zones', name: 'Every day or right now?', short: 'Every day / Right now', labels: ['EVERY DAY', 'RIGHT NOW'], subs: ['always · usually · every day', 'now · right now · Look!'], bank: EVERY_RIGHT, count: 4 },
      { type: 'stones', name: 'Can Stones', short: 'Can', title: 'Can Stones', bank: CAN_Q, count: 3 },
      { type: 'opinion', name: 'Opinion Corner', short: 'Opinions', count: 2 },
      { type: 'talk', name: 'Talk on the stage' },
      { type: 'portal', name: 'Go into the portal' },
    ],
  },
  {
    key: 'future', short: 'Future', name: 'TOMORROW CITY', tense: 'This is the FUTURE.',
    color: '#7CB342', light: '#C5E1A5', ground: '#3E6B7E', ground2: '#2F5566', path: '#7FD3C4', rock: '#1D3F54', rock2: '#122A38',
    skyTop: '#10273A', skyBottom: '#2E6F78', fog: '#24525E', hemi: ['#B3E5FC', '#1D3F54', 1.5], sun: ['#C8F7FF', 1.6],
    music: [220.0, 261.6, 293.7, 329.6, 392.0, 440.0],
    frames: ["<b>Someday</b>, I'm <b>going to</b> ...", "<b>I'd like to</b> ... <b>because</b> ...", '<b>Next year</b>, I <b>am going to</b> ...', 'If you are tired, you <b>should</b> ...'],
    quests: [
      { type: 'collect', name: 'Pick 3 dreams', short: 'Dreams', dreams: true },
      { type: 'ladder', name: 'Prediction Track', short: 'Prediction Track' },
      { type: 'zones', name: 'Today or tomorrow?', short: 'Today / Tomorrow', labels: ['TODAY', 'TOMORROW'], subs: ['I play · I am playing', 'I am going to play'], bank: TODAY_TOMORROW, count: 3 },
      { type: 'stones', name: 'Advice Clinic', short: 'Advice', title: 'Advice Clinic', bank: ADVICE_Q, count: 3, advice: true },
      { type: 'talk', name: 'Talk on the stage' },
      { type: 'portal', name: 'Go into the portal' },
    ],
  },
  {
    key: 'arena', short: 'Ultimate', name: 'ULTIMATE CHALLENGE', tense: 'Everything together!',
    color: '#FDD835', light: '#FFF59D', ground: '#E9C46A', ground2: '#D9AE4C', path: '#FFF3C4', rock: '#145389', rock2: '#0E3A63',
    skyTop: '#145389', skyBottom: '#F9C784', fog: '#E9CFA0', hemi: ['#FFF8E1', '#145389', 1.9], sun: ['#FFF3C4', 2.3],
    music: [329.6, 392.0, 440.0, 523.3, 587.3, 659.3],
    frames: [],
    quests: [
      { type: 'stones', name: 'Ultimate Stones', short: 'Mixed review', title: 'Ultimate Stones', bank: MIX_Q, count: 5 },
      { type: 'portal', name: 'Go to the Time Master stage', final: true },
    ],
  },
];

runGame({
  id: 'b4',
  title: 'The Time Travel Stage · S24 Game',
  brand: 'CCA · Show Bloque 4',
  h1: 'The <span class="p">Time</span> <span class="n">Travel</span> <span class="f">Stage</span>',
  ask: 'Who is the Time Traveler today?',
  briefLine: 'You are a Time Traveler. Visit 4 worlds!',
  finaleTitle: 'You are a Time Master, {name}!',
  finaleStage: 'THE TIME MASTER STAGE',
  csvPrefix: 'S24_TimeTravel',
  titleWorld: 1,
  worlds: WORLDS,
});
