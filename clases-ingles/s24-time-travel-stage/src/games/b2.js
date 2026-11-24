// Bloque 2 · My World Around Me — "MY WORLD" (S9–S16 + Bonus)
// Content from the class materials: S9 Where Is It? (prepositions), S10 There is / There are,
// S11 My Dream Room, S13 Giving Directions, S14 My Neighborhood, S15 Bigger, Smaller, Better,
// Bonus The Right Order (Opinion → Size → Age → Color → Noun), S16 Tour Guide Show.
// S12 (review) is the final show.
import { runGame } from '../engine.js';

// ---------- S9 · Where is it? (a little scene on the stage) ----------
const WHERE_IS = [
  { s: 'The cat is ___ the table.', a: ['under', 'on', 'behind'], scene: { thing: 'cat', ref: 'table', prep: 'under' } },
  { s: 'The cat is ___ the bed.', a: ['on', 'under', 'next to'], scene: { thing: 'cat', ref: 'bed', prep: 'on' } },
  { s: 'The cat is ___ the box.', a: ['in', 'on', 'next to'], scene: { thing: 'cat', ref: 'box', prep: 'in', thingSize: 1.6 } },
  { s: 'The ball is ___ the sofa.', a: ['next to', 'under', 'in'], scene: { thing: 'ball', ref: 'sofa', prep: 'next to' } },
  { s: 'The dog is ___ the chair.', a: ['behind', 'in', 'on'], scene: { thing: 'dog', ref: 'chair', prep: 'behind', thingSize: 1.6 } },
  { s: 'The cat is ___ the lamp and the TV.', a: ['between', 'next to', 'under'], scene: { thing: 'cat', ref: 'lamp', ref2: 'tv', prep: 'between' } },
  { s: 'The book is ___ the table.', a: ['on', 'under', 'between'], scene: { thing: 'book', ref: 'table', prep: 'on', thingSize: 0.9 } },
];

// ---------- S9/S10 · Put it there! (carry it in MY HOUSE) ----------
const PUT_IT = [
  { thing: 'ball', prep: 'under', ref: 'table' },
  { thing: 'book', prep: 'on', ref: 'table' },
  { thing: 'cat', prep: 'on', ref: 'bed' },
  { thing: 'cat', prep: 'in', ref: 'box' },
  { thing: 'ball', prep: 'next to', ref: 'sofa' },
  { thing: 'dog', prep: 'next to', ref: 'bed' },
  { thing: 'book', prep: 'on', ref: 'chair' },
  { thing: 'ball', prep: 'under', ref: 'chair' },
];

// ---------- S10 · There is or there are? ----------
const two = (id) => ({ a: id, as: 1.9, b: id, bs: 1.9 });
const THERE = [
  { s: '___ a cat on the bed.', z: 0, scene: { thing: 'cat', ref: 'bed', prep: 'on', refSize: 2.4 } },
  { s: '___ a TV in my room.', z: 0, obj: 'tv' },
  { s: '___ a ball under the table.', z: 0, scene: { thing: 'ball', ref: 'table', prep: 'under', refSize: 2.4 } },
  { s: '___ a big sofa in the living room.', z: 0, obj: 'sofa' },
  { s: '___ two lamps in my room.', z: 1, cmp: two('lamp') },
  { s: '___ two chairs next to the table.', z: 1, cmp: two('chair') },
  { s: '___ two cats in the house.', z: 1, cmp: two('cat') },
  { s: '___ three books on the table.', z: 1, obj: 'book' },
];

// ---------- S11 · My Dream Room (pick 3 things and describe the room) ----------
const DREAM_ROOM = [
  { id: 'bed', label: 'A big bed', say: 'There is a big bed in my dream room.' },
  { id: 'sofa', label: 'A blue sofa', say: 'There is a blue sofa next to the window.' },
  { id: 'tv', label: 'A TV', say: 'There is a TV on the wall.' },
  { id: 'guitar', label: 'A guitar', say: 'There is a guitar next to my bed.' },
  { id: 'robot', label: 'A robot', say: 'There is a robot on my desk.' },
  { id: 'dog', label: 'A dog', say: 'There is a dog under my bed!' },
  { id: 'lamp', label: 'Two lamps', say: 'There are two lamps in my room.' },
  { id: 'ball', label: 'Three balls', say: 'There are three balls in a box.' },
];

// ---------- S14 · Where is the hospital? (true in the town map) ----------
const TOWN_Q = [
  { s: 'The school is ___ the library and the hospital.', a: ['between', 'next to', 'under'] },
  { s: 'The park is ___ the bank and the bakery.', a: ['between', 'on', 'in'] },
  { s: 'The bank is ___ the park.', a: ['next to', 'between', 'under'] },
  { s: 'The bakery is ___ the park.', a: ['next to', 'on', 'between'] },
  { s: 'The library is ___ the school.', a: ['next to', 'in', 'under'] },
  { s: 'There ___ a hospital in my neighborhood.', a: ['is', 'are', 'am'] },
  { s: 'There ___ two schools in my city.', a: ['are', 'is', 'be'] },
];

// ---------- S15 · Bigger or smaller? (run to the right zone) ----------
const BIGGER = [
  { s: 'The elephant is ___ than the dog.', labels: ['BIGGER', 'SMALLER'], z: 0, cmp: { a: 'elephant', as: 3.2, b: 'dog', bs: 1.2 } },
  { s: 'The ant is ___ than the dog.', labels: ['BIGGER', 'SMALLER'], z: 1, cmp: { a: 'ant', as: 0.6, b: 'dog', bs: 1.2 } },
  { s: 'The giraffe is ___ than the dog.', labels: ['TALLER', 'SHORTER'], z: 0, cmp: { a: 'giraffe', as: 3.4, b: 'dog', bs: 1.2 } },
  { s: 'The car is ___ than the turtle.', labels: ['FASTER', 'SLOWER'], z: 0, cmp: { a: 'car', as: 2, b: 'turtle', bs: 1.1 } },
  { s: 'The turtle is ___ than the car.', labels: ['FASTER', 'SLOWER'], z: 1, cmp: { a: 'turtle', as: 1.1, b: 'car', bs: 2 } },
  { s: 'The house is ___ than the car.', labels: ['BIGGER', 'SMALLER'], z: 0, cmp: { a: 'house', as: 3, b: 'car', bs: 1.6 } },
  { s: 'The feather is ___ than the weight.', labels: ['LIGHTER', 'HEAVIER'], z: 0, cmp: { a: 'feather', as: 1.3, b: 'dumbbell', bs: 1.4, bn: 'weight' } },
  { s: 'The ice is ___ than the coffee.', labels: ['COLDER', 'HOTTER'], z: 0, cmp: { a: 'ice', as: 1, b: 'coffee', bs: 1.2 } },
];

// ---------- S15 · -er or more? (long and irregular comparatives) ----------
const MORE_ER = [
  { s: 'A car is ___ than a bike.', a: ['more expensive', 'expensiver', 'more cheap'], cmp: { a: 'car', as: 2.2, b: 'bike', bs: 1.6 } },
  { s: 'A flower is ___ than a bug.', a: ['more beautiful', 'beautifuler', 'beautiful'], cmp: { a: 'flower', as: 1.8, b: 'bug', bs: 1.2 } },
  { s: 'Pizza is ___ than broccoli. (I think!)', a: ['better', 'gooder', 'more good'] },
  { s: 'A rainy day is ___ than a sunny day. (I think!)', a: ['worse', 'badder', 'more bad'], obj: 'rain' },
  { s: 'The elephant is ___ than the ant.', a: ['bigger', 'more big', 'biger'], cmp: { a: 'elephant', as: 3, b: 'ant', bs: 0.6 } },
  { s: 'A rocket is ___ than a plane.', a: ['faster', 'more fast', 'fastest'], cmp: { a: 'rocket', as: 2.4, b: 'plane', bs: 2 } },
  { s: 'The giraffe is ___ than the elephant.', a: ['taller', 'more tall', 'tallest'], cmp: { a: 'giraffe', as: 3.6, b: 'elephant', bs: 2.6 } },
];

// ---------- Bonus · The Right Order: Opinion → Size → Age → Color → NOUN ----------
const RUNWAY = [
  { s: 'A ___ big old blue sofa.', a: ['beautiful', 'small', 'red'], obj: 'sofa' },
  { s: 'A beautiful ___ old blue sofa.', a: ['big', 'nice', 'green'], obj: 'sofa' },
  { s: 'A beautiful big ___ blue sofa.', a: ['old', 'ugly', 'yellow'], obj: 'sofa' },
  { s: 'A beautiful big old ___ sofa.', a: ['blue', 'new', 'small'], obj: 'sofa' },
  { s: 'An ___ small new red car.', a: ['amazing', 'old', 'big'], obj: 'car' },
  { s: 'A cool ___ old brown guitar.', a: ['small', 'red', 'nice'], obj: 'guitar' },
  { s: 'A nice big ___ white house.', a: ['new', 'ugly', 'green'], obj: 'house' },
  { s: 'A lovely little old ___ dog.', a: ['brown', 'big', 'cool'], obj: 'dog' },
];

const WORLDS = [
  {
    key: 'house', theme: 'present', landmark: 'magnifier', short: 'House', name: 'MY HOUSE', tense: 'Where is it? There is... there are...',
    color: '#57A6B5', light: '#B2E0E8', ground: '#8BC98F', ground2: '#6DB374', path: '#F1F8E9', rock: '#2C5F7C', rock2: '#1D3F54',
    skyTop: '#5DB3C9', skyBottom: '#EAF6F8', fog: '#DDEFF3', hemi: ['#FFFFFF', '#6E9A7A', 2.0], sun: ['#FFFFFF', 2.3],
    music: [392.0, 440.0, 493.9, 587.3, 659.3, 784.0],
    frames: [],
    quests: [
      { type: 'stones', name: 'Where is it?', short: 'Where is it?', title: 'Where Is It?', bank: WHERE_IS, count: 4, showcase: 'wide' },
      { type: 'carry', name: 'Put it there!', short: 'Put it there', bank: PUT_IT, count: 4 },
      { type: 'zones', name: 'There is or there are?', short: 'There is / are', labels: ['THERE IS', 'THERE ARE'], subs: ['one: a cat', 'two, three: cats'], bank: THERE, count: 4 },
      { type: 'collect', name: 'My Dream Room', short: 'Dream room', items: DREAM_ROOM, hint: 'Walk to things for your dream room! Pick 3.', sayLab: 'Dream room' },
      { type: 'portal', name: 'Go into the portal' },
    ],
  },
  {
    key: 'town', theme: 'town', landmark: 'none', short: 'Neighborhood', name: 'MY NEIGHBORHOOD', tense: 'Go straight, turn left... It is next to the park.',
    color: '#F57C00', light: '#FFCC80', ground: '#E9C46A', ground2: '#DDB45A', path: '#FFF3E0', rock: '#8D5A2B', rock2: '#5D3A1A',
    skyTop: '#6EC3D6', skyBottom: '#FFF3E0', fog: '#F4E6D0', hemi: ['#FFF8E1', '#A1887F', 2.0], sun: ['#FFF3E0', 2.3],
    music: [329.6, 392.0, 440.0, 523.3, 587.3, 659.3],
    frames: [],
    quests: [
      { type: 'places', name: 'Find the places', short: 'Places', count: 3 },
      { type: 'follow', name: 'Follow the directions', short: 'Follow', count: 3 },
      { type: 'guide', name: 'Give directions', short: 'Give directions', count: 3 },
      { type: 'stones', name: 'Where is the hospital?', short: 'Where is...?', title: 'Where Is The Hospital?', bank: TOWN_Q, count: 4 },
      { type: 'portal', name: 'Go into the portal' },
    ],
  },
  {
    key: 'compare', theme: 'past', landmark: 'trophy', short: 'Compare', name: 'COMPARE CITY', tense: 'Bigger, smaller, better!',
    color: '#7CB342', light: '#C5E1A5', ground: '#A5C77F', ground2: '#8DB565', path: '#FFF8E1', rock: '#6D4C41', rock2: '#4E342E',
    skyTop: '#F7A072', skyBottom: '#FFF1D6', fog: '#FBE3CC', hemi: ['#FFF3E0', '#9E8A6A', 1.9], sun: ['#FFE0B2', 2.4],
    music: [261.6, 293.7, 329.6, 392.0, 440.0, 523.3],
    frames: [
      'Welcome to <b>my world</b>! I am your tour guide.',
      '<b>There is</b> a ... <b>There are</b> two ...',
      'The cat is <b>under / on / next to</b> the ...',
      '<b>Go straight</b> and <b>turn left</b>. The hospital is <b>next to</b> the park.',
      'The elephant is <b>bigger than</b> the dog.',
      'A <b>beautiful big old blue</b> sofa!',
    ],
    quests: [
      { type: 'zones', name: 'Bigger or smaller?', short: 'Bigger / smaller', labels: ['', ''], subs: ['', ''], bank: BIGGER, count: 5, perItem: true },
      { type: 'stones', name: '-er or more?', short: '-er / more', title: '-er Or More?', bank: MORE_ER, count: 4, showcase: 'wide' },
      { type: 'stones', name: 'Adjective Runway', short: 'Adjective order', title: 'Opinion · Size · Age · Color', bank: RUNWAY, count: 4, showcase: 'wide' },
      { type: 'talk', name: 'Tour Guide Show' },
      { type: 'portal', name: 'Go to the Tour Guide stage', final: true },
    ],
  },
];

runGame({
  id: 'b2',
  title: 'My World · Bloque 2',
  brand: 'CCA · Bloque 2 · My World Around Me',
  h1: '<span class="n">My</span> <span class="p">World</span>',
  ask: 'Who is playing today?',
  briefLine: 'Welcome to My World! Visit 3 places.',
  finaleTitle: 'You are a great tour guide, {name}!',
  finaleStage: 'THE TOUR GUIDE STAGE',
  csvPrefix: 'Bloque2_MyWorld',
  titleWorld: 0,
  worlds: WORLDS,
});
