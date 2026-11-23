// Bloque 1 · Me and My World — "ME TOWN" (S1–S8)
// Content taken from the class materials: S1 Presentation Stations, S2 Question Master,
// S3 Describe It!, S5 My Day, S6 Your Day vs My Day, S7 I Like It Because, S8 Bloque 1 Show.
// Extra practice of present simple 3rd person (he wakes up, she likes, does/doesn't),
// the weakest point in the results.
import { runGame } from '../engine.js';

// ---------- S1 · Presentation Stations ----------
const STATIONS = [
  { label: 'WHO I AM', say: '<b>I am</b> ... <b>I am</b> ... years old.' },
  { label: 'MY WORLD', say: '<b>I live in</b> ... <b>I go to</b> ...' },
  { label: 'WHAT I LOVE', say: '<b>I like</b> ... <b>because</b> ... <b>My favorite</b> ... <b>is</b> ...' },
];

// ---------- S2 · Question Master: friends to interview ----------
const FRIENDS = [
  { name: 'Leo', qs: [["Do you like dogs?", "Yes, I do! I have a dog. His name is Max."], ["Do you play the guitar?", "No, I don't. I play soccer."], ["What is your favorite food?", "My favorite food is pizza!"]], she: false, facts: "Hi! I'm Leo. I like pizza. I play soccer. My favorite color is blue.",
    report: [
      { s: 'Leo ___ pizza.', a: ['likes', 'like', 'liking'] },
      { s: 'Leo ___ soccer.', a: ['plays', 'play', 'playing'] },
      { s: "Leo's favorite color ___ blue.", a: ['is', 'are', 'do'] },
    ] },
  { name: 'Mia', qs: [["Do you like dogs?", "No, I don't. I like cats."], ["Do you play soccer?", "No, I don't. I play the piano."], ["What is your favorite color?", "My favorite color is purple."]], she: true, facts: "Hi! I'm Mia. I like cats. I play the piano. My favorite food is ice cream.",
    report: [
      { s: 'Mia ___ cats.', a: ['likes', 'like', 'liking'] },
      { s: 'Mia ___ the piano.', a: ['plays', 'play', 'playing'] },
      { s: "Mia's favorite food ___ ice cream.", a: ['is', 'are', 'does'] },
    ] },
  { name: 'Tom', qs: [["Do you like video games?", "Yes, I do! I play Minecraft."], ["Do you play tennis?", "No, I don't. I play basketball."], ["What is your favorite food?", "My favorite food is hamburgers."]], she: false, facts: "Hi! I'm Tom. I like Minecraft. I play basketball. My favorite animal is the dog.",
    report: [
      { s: 'Tom ___ Minecraft.', a: ['likes', 'like', 'liking'] },
      { s: 'Tom ___ basketball.', a: ['plays', 'play', 'playing'] },
      { s: '___ Tom like dogs? Yes, he does.', a: ['Does', 'Do', 'Is'] },
    ] },
  { name: 'Sara', qs: [["Do you like music?", "Yes, I do! I love pop music."], ["Do you play basketball?", "No, I don't. I play tennis."], ["What is your favorite animal?", "My favorite animal is the rabbit."]], she: true, facts: "Hi! I'm Sara. I like music. I play tennis. My favorite color is pink.",
    report: [
      { s: 'Sara ___ music.', a: ['likes', 'like', 'liking'] },
      { s: 'Sara ___ tennis.', a: ['plays', 'play', 'playing'] },
      { s: "Sara's favorite color ___ pink.", a: ['is', 'are', 'do'] },
    ] },
  { name: 'Ben', qs: [["Do you like math?", "Yes, I do! Math is my favorite subject."], ["Do you play soccer?", "No, I don't. I play video games."], ["What is your favorite food?", "My favorite food is arepas."]], she: false, facts: "Hi! I'm Ben. I like reggaeton. I play video games. My favorite subject is math.",
    report: [
      { s: 'Ben ___ reggaeton.', a: ['likes', 'like', 'liking'] },
      { s: 'Ben ___ video games.', a: ['plays', 'play', 'playing'] },
      { s: "Ben's favorite subject ___ math.", a: ['is', 'are', 'does'] },
    ] },
  { name: 'Ana', qs: [["Do you like horses?", "Yes, I do! I love horses."], ["Do you play volleyball?", "Yes, I do! I play on Saturdays."], ["What is your favorite color?", "My favorite color is red."]], she: true, facts: "Hi! I'm Ana. I like horses. I play volleyball. My favorite food is chicken.",
    report: [
      { s: 'Ana ___ horses.', a: ['likes', 'like', 'liking'] },
      { s: 'Ana ___ volleyball.', a: ['plays', 'play', 'playing'] },
      { s: '___ Ana like chicken? Yes, she does.', a: ['Does', 'Do', 'Is'] },
    ] },
];

const QUESTION_Q = [
  { s: '___ you like pizza?', a: ['Do', 'Does', 'Are'] },
  { s: '___ you play soccer?', a: ['Do', 'Does', 'Is'] },
  { s: 'What ___ your favorite color?', a: ['is', 'are', 'do'] },
  { s: '___ she like cats?', a: ['Does', 'Do', 'Is'] },
  { s: '___ he play video games?', a: ['Does', 'Do', 'Are'] },
  { s: 'Do you like dogs? Yes, I ___.', a: ['do', 'does', 'am'] },
  { s: "Does he like music? No, he ___.", a: ["doesn't", "don't", "isn't"] },
  { s: 'Which question is correct?', a: ['Do you like cats?', 'You like cats?', 'Does you like cats?'] },
];

// ---------- S3 · Describe It! (6 adjective pairs from the station cards) ----------
const OPPOSITES = [
  { obj: 'elephant', s: 'The elephant is ...', labels: ['BIG', 'SMALL'], z: 0 },
  { obj: 'ant', s: 'The ant is ...', labels: ['BIG', 'SMALL'], z: 1 },
  { obj: 'car', s: 'The car is ...', labels: ['FAST', 'SLOW'], z: 0 },
  { obj: 'turtle', s: 'The turtle is ...', labels: ['FAST', 'SLOW'], z: 1 },
  { obj: 'phone', s: 'My phone is ...', labels: ['NEW', 'OLD'], z: 0 },
  { obj: 'book', s: 'This book is ...', labels: ['NEW', 'OLD'], z: 1 },
  { obj: 'dumbbell', s: 'The weight is ...', labels: ['HEAVY', 'LIGHT'], z: 0 },
  { obj: 'feather', s: 'The feather is ...', labels: ['HEAVY', 'LIGHT'], z: 1 },
  { obj: 'flower', s: 'The flower is ...', labels: ['BEAUTIFUL', 'UGLY'], z: 0 },
  { obj: 'bug', s: 'The bug is ...', labels: ['BEAUTIFUL', 'UGLY'], z: 1 },
  { obj: 'coffee', s: 'The coffee is ...', labels: ['HOT', 'COLD'], z: 0 },
  { obj: 'ice', s: 'The ice is ...', labels: ['HOT', 'COLD'], z: 1 },
];

const DESCRIBE_Q = [
  { s: 'The elephant is big ___ heavy.', a: ['and', 'but', 'because'], obj: 'elephant' },
  { s: 'Is it big ___ small?', a: ['or', 'and', 'because'], obj: 'ant' },
  { s: 'The turtle is ___. It is not fast.', a: ['slow', 'fast', 'hot'], obj: 'turtle' },
  { s: 'I like it ___ it is beautiful.', a: ['because', 'but', 'or'], obj: 'flower' },
  { s: 'The car is red ___ fast.', a: ['and', 'or', 'because'], obj: 'car' },
  { s: 'The ice is very ___.', a: ['cold', 'hot', 'heavy'], obj: 'ice' },
  { s: 'It ___ new and small.', a: ['is', 'are', 'do'], obj: 'phone' },
  { s: 'The feather is ___. It is not heavy.', a: ['light', 'heavy', 'old'], obj: 'feather' },
];

// ---------- S7 · I Like It Because... ----------
const LIKE_PAIRS = [
  { a: 'Pizza', b: 'Hamburgers' },
  { a: 'Dogs', b: 'Cats', ia: 'dog' },
  { a: 'Soccer', b: 'Basketball', ia: 'ball' },
  { a: 'Video games', b: 'Books', ib: 'book' },
  { a: 'Cars', b: 'Bikes', ia: 'car', ib: 'bike' },
  { a: 'Ice cream', b: 'Chocolate' },
  { a: 'Music', b: 'Movies', ia: 'guitar' },
  { a: 'The beach', b: 'The mountains' },
];

// ---------- S5 · My Day (action cards + FIRST / THEN / AFTER THAT posters) ----------
const ROUTINE = [
  { label: 'wake up', say: '<b>FIRST</b>, I <u>wake up</u>.' },
  { label: 'brush teeth', say: '<b>THEN</b>, I <u>brush my teeth</u>.' },
  { label: 'eat breakfast', say: '<b>AFTER THAT</b>, I <u>eat breakfast</u>.' },
  { label: 'get dressed', say: '<b>THEN</b>, I <u>get dressed</u>.' },
  { label: 'go to school', say: '<b>AFTER THAT</b>, I <u>go to school</u>.' },
  { label: 'do homework', say: '<b>FINALLY</b>, I <u>do my homework</u>.' },
];

// ---------- S6 · Your Day vs My Day (interview cards) ----------
const NEIGHBORS = [
  { name: 'Pablo', qs: [["What time do you wake up?", "I wake up at six."], ["How do you go to school?", "I go to school by bus."], ["What do you do after school?", "I play soccer."]], she: false, facts: 'I wake up at six. I go to school by bus. After school, I play soccer.',
    report: [
      { s: 'Pablo ___ up at six.', a: ['wakes', 'wake', 'waking'] },
      { s: 'Pablo ___ to school by bus.', a: ['goes', 'go', 'going'] },
      { s: 'After school, Pablo ___ soccer.', a: ['plays', 'play', 'playing'] },
    ] },
  { name: 'Emma', qs: [["What time do you wake up?", "I wake up at seven."], ["What do you eat for breakfast?", "I eat cereal."], ["What time do you go to bed?", "I go to bed at nine."]], she: true, facts: 'I wake up at seven. I eat cereal for breakfast. I go to bed at nine.',
    report: [
      { s: 'Emma ___ up at seven.', a: ['wakes', 'wake', 'waking'] },
      { s: 'Emma ___ cereal for breakfast.', a: ['eats', 'eat', 'eating'] },
      { s: 'Emma ___ to bed at nine.', a: ['goes', 'go', 'going'] },
    ] },
  { name: 'Sam', qs: [["What time do you wake up?", "I wake up at half past six."], ["How do you go to school?", "I walk to school."], ["What do you do after school?", "I do my homework."]], she: false, facts: 'I wake up at half past six. I walk to school. After school, I do my homework.',
    report: [
      { s: 'Sam ___ to school.', a: ['walks', 'walk', 'walking'] },
      { s: 'After school, Sam ___ his homework.', a: ['does', 'do', 'doing'] },
      { s: "Sam ___ go to school by car.", a: ["doesn't", "don't", "isn't"] },
    ] },
  { name: 'Lucy', qs: [["What time do you wake up?", "I wake up at eight."], ["When do you take a shower?", "I take a shower in the morning."], ["What do you do after school?", "I watch TV."]], she: true, facts: 'I wake up at eight. I take a shower in the morning. I watch TV after school.',
    report: [
      { s: 'Lucy ___ a shower in the morning.', a: ['takes', 'take', 'taking'] },
      { s: 'Lucy ___ TV after school.', a: ['watches', 'watch', 'watching'] },
      { s: '___ Lucy wake up at eight? Yes, she does.', a: ['Does', 'Do', 'Is'] },
    ] },
];

const THIRD_PERSON_Q = [
  { s: 'I wake up at seven BUT he ___ up at six.', a: ['wakes', 'wake', 'waking'] },
  { s: '___ she eat breakfast at home?', a: ['Does', 'Do', 'Is'] },
  { s: "He ___ go to school by car. He walks.", a: ["doesn't", "don't", "isn't"] },
  { s: "I ___ watch TV in the morning.", a: ["don't", "doesn't", 'not'] },
  { s: 'My mom ___ dinner every night.', a: ['cooks', 'cook', 'cooking'] },
  { s: '___ you do your homework after school?', a: ['Do', 'Does', 'Are'] },
];

const I_OR_HE = [
  { s: '___ wakes up at six.', z: 1 },
  { s: '___ go to school by bus.', z: 0 },
  { s: '___ eats breakfast at seven.', z: 1 },
  { s: '___ brush my teeth.', z: 0 },
  { s: '___ watches TV after school.', z: 1 },
  { s: '___ do my homework.', z: 0 },
  { s: '___ plays outside.', z: 1 },
  { s: '___ go to bed at nine.', z: 0 },
];

const pick = (arr, n) => arr.slice().sort(() => Math.random() - 0.5).slice(0, n);

const WORLDS = [
  {
    key: 'hello', theme: 'present', landmark: 'hello', short: 'Hello', name: 'HELLO PARK', tense: 'Who are you? Ask questions!',
    color: '#57A6B5', light: '#B2E0E8', ground: '#8BC98F', ground2: '#6DB374', path: '#F1F8E9', rock: '#2C5F7C', rock2: '#1D3F54',
    skyTop: '#5DB3C9', skyBottom: '#EAF6F8', fog: '#DDEFF3', hemi: ['#FFFFFF', '#6E9A7A', 2.0], sun: ['#FFFFFF', 2.3],
    music: [392.0, 440.0, 493.9, 587.3, 659.3, 784.0],
    frames: [],
    quests: [
      { type: 'stations', name: 'Presentation Stations', short: 'Stations', title: 'Presentation Stations', items: STATIONS },
      { type: 'interview', name: 'Meet 3 new friends', short: 'Friends', people: () => pick(FRIENDS, 3),
        asks: 2 },
      { type: 'stones', name: 'Question Stones', short: 'Questions', title: 'Question Stones', bank: QUESTION_Q, count: 4 },
      { type: 'stones', name: 'Report Stones', short: 'He / She likes', title: 'Report Stones', count: 3,
        bank: (met) => (met.length ? met : pick(FRIENDS, 3)).map((p) => pick(p.report, 1)[0]) },
      { type: 'portal', name: 'Go into the portal' },
    ],
  },
  {
    key: 'describe', theme: 'town', landmark: 'magnifier', short: 'Describe', name: 'DESCRIBE IT TOWN', tense: 'Big or small? Fast or slow?',
    color: '#F57C00', light: '#FFCC80', ground: '#E9C46A', ground2: '#DDB45A', path: '#FFF3E0', rock: '#8D5A2B', rock2: '#5D3A1A',
    skyTop: '#6EC3D6', skyBottom: '#FFF3E0', fog: '#F4E6D0', hemi: ['#FFF8E1', '#A1887F', 2.0], sun: ['#FFF3E0', 2.3],
    music: [329.6, 392.0, 440.0, 523.3, 587.3, 659.3],
    frames: [],
    quests: [
      { type: 'zones', name: 'Opposites Run', short: 'Opposites', labels: ['', ''], subs: ['', ''], bank: OPPOSITES, count: 5, perItem: true },
      { type: 'stones', name: 'Describe Stones', short: 'Describe', title: 'Describe Stones', bank: DESCRIBE_Q, count: 4, showcase: true },
      { type: 'opinion', name: 'I Like It Because...', short: 'Because', count: 2, pairs: LIKE_PAIRS, frame: 'I like <u>{x}</u> because ...' },
      { type: 'portal', name: 'Go into the portal' },
    ],
  },
  {
    key: 'myday', theme: 'past', landmark: 'sun', short: 'My Day', name: 'MY DAY STREET', tense: 'First I wake up... then I...',
    color: '#7CB342', light: '#C5E1A5', ground: '#A5C77F', ground2: '#8DB565', path: '#FFF8E1', rock: '#6D4C41', rock2: '#4E342E',
    skyTop: '#F7A072', skyBottom: '#FFF1D6', fog: '#FBE3CC', hemi: ['#FFF3E0', '#9E8A6A', 1.9], sun: ['#FFE0B2', 2.4],
    music: [261.6, 293.7, 329.6, 392.0, 440.0, 523.3],
    frames: [
      '<b>I am</b> ... <b>I am</b> ... years old.',
      '<b>Do you like</b> ...?',
      'It is <b>big and</b> ...',
      '<b>FIRST</b> I ... <b>THEN</b> I ...',
      'I ... <b>BUT</b> he / she ...',
      'I like ... <b>BECAUSE</b> ...',
    ],
    quests: [
      { type: 'ladder', name: 'My Day Track', short: 'My Day', sign: 'MY DAY TRACK', steps: ROUTINE },
      { type: 'interview', name: 'Your Day: meet 3 neighbors', short: 'Neighbors', people: () => pick(NEIGHBORS, 3),
        asks: 2 },
      { type: 'zones', name: 'I or He / She?', short: 'I / He', labels: ['I', 'HE / SHE'], subs: ['MY DAY', 'YOUR DAY'], bank: I_OR_HE, count: 4 },
      { type: 'stones', name: 'He Wakes Up!', short: 'He wakes up', title: 'He Wakes Up!', count: 4,
        bank: (met) => [...(met.length ? met : pick(NEIGHBORS, 2)).slice(0, 2).map((p) => pick(p.report, 1)[0]), ...pick(THIRD_PERSON_Q, 2)] },
      { type: 'talk', name: 'My 1-Minute Show' },
      { type: 'portal', name: 'Go to the Me Town stage', final: true },
    ],
  },
];

runGame({
  id: 'b1',
  title: 'Me Town · Bloque 1',
  brand: 'CCA · Bloque 1 · Me and My World',
  h1: '<span class="n">Me</span> <span class="p">Town</span>',
  ask: 'Who is playing today?',
  briefLine: 'Welcome to Me Town! Visit 3 places.',
  finaleTitle: 'Great job in Me Town, {name}!',
  finaleStage: 'THE ME TOWN STAGE',
  csvPrefix: 'Bloque1_MeTown',
  titleWorld: 0,
  worlds: WORLDS,
});
