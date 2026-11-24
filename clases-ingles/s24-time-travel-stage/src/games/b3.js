// Bloque 3 · My Stories — "STORY TOWN" (S5–S12)
// S5 Yesterday! (regular past -ED), S6 Irregular Rebels (went, ate, saw, had, was/were; no "goed"),
// S7 What Happened? (Did you...? What did you do? Where did you go?), S8 review,
// S9 First, Then, Finally (sequence), S10 My Best Day, S11-S12 the final show
// (who I am, my world, my best day: Bloques 1-3 together).
import { runGame } from '../engine.js';

const pick = (arr, n) => arr.slice().sort(() => Math.random() - 0.5).slice(0, n);

// ---------- S5 + S6 · Regular or Rebel? (run to the right zone) ----------
const REG_REBEL = [
  { s: 'PLAY → ___', z: 0 }, { s: 'WATCH → ___', z: 0 }, { s: 'COOK → ___', z: 0 }, { s: 'WALK → ___', z: 0 },
  { s: 'CLEAN → ___', z: 0 }, { s: 'DANCE → ___', z: 0 }, { s: 'JUMP → ___', z: 0 }, { s: 'LISTEN → ___', z: 0 },
  { s: 'GO → ___', z: 1 }, { s: 'EAT → ___', z: 1 }, { s: 'SEE → ___', z: 1 }, { s: 'HAVE → ___', z: 1 },
  { s: 'IS → ___', z: 1 }, { s: 'RUN → ___', z: 1 }, { s: 'DRINK → ___', z: 1 }, { s: 'MAKE → ___', z: 1 },
];

// ---------- S5 + S6 · Time Machine Track (say it on every step) ----------
const TIME_TRACK = [
  { label: 'play → played', say: 'Yesterday I <u>played</u> soccer.' },
  { label: 'go → went', say: 'Yesterday I <u>went</u> to the park.' },
  { label: 'watch → watched', say: 'Yesterday I <u>watched</u> a movie.' },
  { label: 'eat → ate', say: 'Yesterday I <u>ate</u> pizza.' },
  { label: 'cook → cooked', say: 'Yesterday I <u>cooked</u> with my mom.' },
  { label: 'see → saw', say: 'Yesterday I <u>saw</u> a big dog.' },
];

// ---------- S6 · Yesterday Stones (watch out for "goed"!) ----------
const YESTERDAY_Q = [
  { s: 'Yesterday I ___ to the park.', a: ['went', 'goed', 'go'], obj: 'ball' },
  { s: 'Yesterday I ___ a pizza.', a: ['ate', 'eated', 'eat'] },
  { s: 'Yesterday I ___ a big elephant!', a: ['saw', 'seed', 'see'], obj: 'elephant' },
  { s: 'Yesterday I ___ a new bike.', a: ['had', 'haved', 'have'], obj: 'bike' },
  { s: 'Yesterday I ___ soccer with my friends.', a: ['played', 'plaid', 'play'], obj: 'ball' },
  { s: 'Yesterday we ___ a movie.', a: ['watched', 'watch', 'watching'] },
  { s: 'Yesterday it ___ very cold.', a: ['was', 'were', 'is'], obj: 'ice' },
  { s: 'Yesterday my friends ___ at my house.', a: ['were', 'was', 'are'], obj: 'house' },
  { s: 'Yesterday I ___ dinner with my dad.', a: ['cooked', 'cook', 'cookt'], obj: 'chef' },
];

// ---------- S7 · Detective City: who did it? ----------
// Each case has 3 suspects; the kid asks both questions to each one, then solves it.
const CASES = [
  {
    key: 'cake', title: 'Who ate the chocolate cake?', culprit: 'Ana',
    suspects: [
      { name: 'Mia', she: true, facts: "Hi! I'm Mia. Yesterday I was at the park.",
        qs: [['Did you eat the cake?', "No, I didn't! I ate an apple."], ['Where did you go yesterday?', 'I went to the park with my dog.']] },
      { name: 'Leo', she: false, facts: "Hi! I'm Leo. Yesterday I was at home.",
        qs: [['Did you eat the cake?', "No, I didn't. I don't like chocolate!"], ['What did you do yesterday?', 'I watched TV and I played video games.']] },
      { name: 'Ana', she: true, facts: "Hi! I'm Ana. Yesterday I was in the kitchen...",
        qs: [['Did you eat the cake?', "Hmm... no, I didn't... (She has chocolate on her face!)"], ['What did you eat yesterday?', 'I ate... chocolate cake. Oops!']] },
    ],
    solve: [
      { s: 'Who ate the cake? ___ ate the cake!', a: ['Ana', 'Mia', 'Leo'] },
      { s: 'Mia ___ to the park with her dog.', a: ['went', 'goed', 'go'] },
      { s: 'Leo ___ TV and played video games.', a: ['watched', 'watch', 'watching'] },
    ],
  },
  {
    key: 'ball', title: 'Who took the soccer ball?', culprit: 'Tom',
    suspects: [
      { name: 'Sara', she: true, facts: "Hi! I'm Sara. Yesterday I was at school.",
        qs: [['Did you take the ball?', "No, I didn't. I played the piano."], ['Where did you go yesterday?', 'I went to school and then I went home.']] },
      { name: 'Tom', she: false, facts: "Hi! I'm Tom. Yesterday I was at the soccer field.",
        qs: [['Did you take the ball?', 'Mmm... I saw a ball... I played with it!'], ['What did you do yesterday?', 'I played soccer all day. Sorry!']] },
      { name: 'Ben', she: false, facts: "Hi! I'm Ben. Yesterday I was at my grandma's house.",
        qs: [['Did you take the ball?', "No, I didn't. I was at my grandma's house."], ['What did you eat yesterday?', 'I ate arepas with my grandma.']] },
    ],
    solve: [
      { s: 'Who took the ball? ___ took the ball!', a: ['Tom', 'Sara', 'Ben'] },
      { s: 'Ben ___ arepas with his grandma.', a: ['ate', 'eated', 'eat'] },
      { s: 'Sara ___ to school and then home.', a: ['went', 'goed', 'go'] },
    ],
  },
];
let CASE = CASES[0];

// ---------- S7 · Question Stones (asking in the past) ----------
const QUESTION_PAST = [
  { s: '___ you go to the park yesterday?', a: ['Did', 'Do', 'Were'] },
  { s: 'What did you ___ yesterday?', a: ['eat', 'ate', 'eated'] },
  { s: 'Where ___ you go?', a: ['did', 'do', 'was'] },
  { s: 'Did you see the cake? Yes, I ___.', a: ['did', 'saw', 'do'] },
  { s: "Did you eat the cake? No, I ___.", a: ["didn't", "don't", "wasn't"] },
  { s: 'What did you ___ yesterday? I played soccer.', a: ['do', 'did', 'done'] },
];

// ---------- S9 · Story Order (no hints: think what happened first) ----------
const STORIES = [
  { title: 'A day at the beach', lines: ['I woke up early.', 'I went to the beach with my family.', 'I swam in the sea.', 'I ate ice cream and went home.'] },
  { title: 'My birthday', lines: ['I opened my eyes and saw balloons.', 'My friends came to my house.', 'We ate a big cake.', 'I went to bed very happy.'] },
  { title: 'The soccer game', lines: ['I put on my soccer shoes.', 'I went to the field.', 'I played and I scored a goal!', 'My team won the game.'] },
  { title: 'A rainy day', lines: ['It was a rainy morning.', 'I stayed at home.', 'I watched a movie with my brother.', 'In the evening, the sun came out.'] },
];

// ---------- S10 · My Best Day (pick 3; the game adds First, Then, Finally) ----------
const BEST_DAY = [
  { id: 'bike', label: 'I rode my bike', say: 'I rode my bike in the park.' },
  { id: 'ball', label: 'I played soccer', say: 'I played soccer with my friends.' },
  { id: 'plane', label: 'I traveled', say: 'I traveled by plane to the beach.' },
  { id: 'dog', label: 'I played with my dog', say: 'I played with my dog.' },
  { id: 'chef', label: 'I cooked', say: 'I cooked pizza with my family.' },
  { id: 'guitar', label: 'I played music', say: 'I played the guitar.' },
  { id: 'book', label: 'I read a book', say: 'I read a great book.' },
  { id: 'trophy', label: 'I won a game', say: 'I won a game and I was very happy!' },
];

const WORLDS = [
  {
    key: 'yesterday', theme: 'past', landmark: 'hourglass', short: 'Yesterday', name: 'YESTERDAY TOWN', tense: 'Yesterday I played... I went...',
    color: '#F57C00', light: '#FFCC80', ground: '#E9C46A', ground2: '#DDB45A', path: '#FFF3E0', rock: '#8D5A2B', rock2: '#5D3A1A',
    skyTop: '#F7A072', skyBottom: '#FFF1D6', fog: '#FBE3CC', hemi: ['#FFF3E0', '#9E8A6A', 1.9], sun: ['#FFE0B2', 2.4],
    music: [261.6, 293.7, 329.6, 392.0, 440.0, 523.3],
    frames: [],
    quests: [
      { type: 'zones', name: 'Regular or Rebel?', short: 'Regular / Rebel', labels: ['-ED', 'REBEL!'], subs: ['play → played', 'go → went'], bank: REG_REBEL, count: 6 },
      { type: 'ladder', name: 'Time Machine Track', short: 'Time track', sign: 'TIME MACHINE TRACK', steps: TIME_TRACK },
      { type: 'stones', name: 'Yesterday Stones', short: 'Yesterday', title: 'Yesterday Stones', bank: YESTERDAY_Q, count: 5, showcase: true },
      { type: 'portal', name: 'Go into the portal' },
    ],
  },
  {
    key: 'detective', theme: 'town', landmark: 'magnifier', short: 'Detective', name: 'DETECTIVE CITY', tense: 'Did you...? What did you do?',
    color: '#57A6B5', light: '#B2E0E8', ground: '#8BC98F', ground2: '#6DB374', path: '#F1F8E9', rock: '#2C5F7C', rock2: '#1D3F54',
    skyTop: '#5DB3C9', skyBottom: '#EAF6F8', fog: '#DDEFF3', hemi: ['#FFFFFF', '#6E9A7A', 2.0], sun: ['#FFFFFF', 2.3],
    music: [392.0, 440.0, 493.9, 587.3, 659.3, 784.0],
    frames: [],
    quests: [
      { type: 'interview', name: 'Ask the witnesses', short: 'Witnesses', asks: 2, listen: 6,
        people: () => {
          CASE = pick(CASES, 1)[0];
          return CASE.suspects.slice();
        } },
      { type: 'stones', name: 'Question Stones', short: 'Questions', title: 'Question Stones', bank: QUESTION_PAST, count: 4 },
      { type: 'stones', name: 'Solve the mystery!', short: 'Mystery', title: 'Solve The Mystery!', count: 3, bank: () => CASE.solve },
      { type: 'portal', name: 'Go into the portal' },
    ],
  },
  {
    key: 'story', theme: 'present', landmark: 'trophy', short: 'Story', name: 'STORY STREET', tense: 'First... then... finally!',
    color: '#7CB342', light: '#C5E1A5', ground: '#A5C77F', ground2: '#8DB565', path: '#FFF8E1', rock: '#6D4C41', rock2: '#4E342E',
    skyTop: '#6EC3D6', skyBottom: '#FFF3E0', fog: '#F4E6D0', hemi: ['#FFF8E1', '#A1887F', 2.0], sun: ['#FFF3E0', 2.3],
    music: [329.6, 392.0, 440.0, 523.3, 587.3, 659.3],
    frames: [
      '<b>I am</b> ... <b>I am</b> ... years old. <b>I like</b> ... because ...',
      'In my house <b>there is</b> ... My house is <b>next to</b> ...',
      'My best day was ... <b>First</b>, I ...',
      '<b>Then</b>, I ... <b>After that</b>, I ...',
      '<b>Finally</b>, I ... It <b>was</b> amazing!',
    ],
    quests: [
      { type: 'order', name: 'Story Order', short: 'Story order', sign: 'STORY ORDER', bank: STORIES, count: 2 },
      { type: 'collect', name: 'My Best Day', short: 'Best day', items: BEST_DAY, seq: true, hint: 'What did you do on your best day? Pick 3!', sayLab: 'My best day' },
      { type: 'talk', name: 'My Stories Show' },
      { type: 'portal', name: 'Go to the My Stories stage', final: true },
    ],
  },
];

runGame({
  id: 'b3',
  title: 'My Stories · Bloque 3',
  brand: 'CCA · Bloque 3 · My Stories',
  h1: '<span class="n">My</span> <span class="p">Stories</span>',
  ask: 'Who is playing today?',
  briefLine: 'Welcome to Story Town! Visit 3 places.',
  finaleTitle: 'What a great storyteller, {name}!',
  finaleStage: 'THE MY STORIES STAGE',
  csvPrefix: 'Bloque3_MyStories',
  titleWorld: 0,
  worlds: WORLDS,
});
