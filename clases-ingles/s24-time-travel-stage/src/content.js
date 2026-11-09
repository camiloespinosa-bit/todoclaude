// Bloque 4 content, taken from the class materials (S13–S22) of Jero & Luciana.
// Every bank lists the correct answer FIRST; the game shuffles the options.

// S13 · What Are You Doing? (12 action cards)
export const ACTIONS = [
  'running', 'jumping', 'eating', 'drinking', 'dancing', 'singing',
  'sleeping', 'reading', 'writing', 'swimming', 'clapping', 'cooking',
];

// S14 · Right Now vs Every Day (10 scene cards). z: 0 = EVERY DAY, 1 = RIGHT NOW
export const EVERY_RIGHT = [
  { s: 'I brush my teeth every day.', z: 0 },
  { s: 'Look! He is playing soccer right now.', z: 1 },
  { s: 'I always walk the dog.', z: 0 },
  { s: 'I am eating lunch right now.', z: 1 },
  { s: 'He usually watches TV.', z: 0 },
  { s: 'Look! She is taking a shower right now.', z: 1 },
  { s: 'My mom drinks coffee every morning.', z: 0 },
  { s: 'He is using the phone right now.', z: 1 },
  { s: 'We go to school every day.', z: 0 },
  { s: 'Look! It is raining right now.', z: 1 },
];

// S15 · What's Going to Happen? Prediction Track verbs + TODAY / TOMORROW hoops
export const LADDER_VERBS = ['jump', 'run', 'eat', 'sleep', 'dance', 'read', 'swim', 'cook'];
export const TODAY_TOMORROW = [
  { s: 'I am going to jump.', z: 1 },
  { s: 'She is eating now.', z: 0 },
  { s: 'We are going to visit Peru.', z: 1 },
  { s: 'I play soccer every day.', z: 0 },
  { s: 'He is going to play basketball.', z: 1 },
  { s: 'Look! It is raining.', z: 0 },
  { s: 'They are going to cook dinner.', z: 1 },
  { s: 'I am reading a book.', z: 0 },
];

// S17 · Can You? Can I? (abilities + permissions)
export const CAN_Q = [
  { s: 'I ___ ride a bike.', a: ['can', 'cans', 'can to'] },
  { s: '___ you whistle?', a: ['Can', 'Cans', 'Is'] },
  { s: 'She ___ dance very well.', a: ['can', 'cans', 'can to'] },
  { s: 'Can you ___ your toes?', a: ['touch', 'touching', 'touches'] },
  { s: '___ I open the window, please?', a: ['Can', 'Am', 'Cans'] },
  { s: 'Can I ___ some water?', a: ['drink', 'drinking', 'drinks'] },
  { s: 'Can I ___ the dog?', a: ['pet', 'petting', 'pets'] },
  { s: 'Can you jump ___?', a: ['rope', 'ropes', 'roping'] },
];

// S18 · You Should / You Shouldn't (The Advice Clinic problem cards)
export const ADVICE_Q = [
  { p: 'I have a headache.', a: ['You should rest.', 'You should to rest.', 'You can headache.'] },
  { p: 'I am very tired.', a: ['You should sleep.', 'You should sleeping.', "You shouldn't sleep."] },
  { p: 'I have a toothache.', a: ['You should see a dentist.', 'You should seeing a dentist.', 'You should eat candy.'] },
  { p: 'I am hungry.', a: ['You should eat a sandwich.', "You shouldn't eat.", 'You should eats.'] },
  { p: 'I have a cold.', a: ['You should drink hot tea.', 'You should play in the rain.', 'You should drinks tea.'] },
  { p: 'My room is very messy.', a: ['You should clean it.', 'You should cleaning it.', "You shouldn't clean it."] },
  { p: 'I am nervous about a test.', a: ['You should study.', "You shouldn't study.", 'You should studying.'] },
  { p: "I can't sleep.", a: ["You shouldn't drink coffee.", 'You should drink coffee.', "You shouldn't to drink coffee."] },
  { p: 'I lost my toy.', a: ['You should look for it.', 'You should looking for it.', "You shouldn't look for it."] },
  { p: 'I am bored.', a: ['You should play a game.', 'You should to play.', "You shouldn't play."] },
];

// S19 Dream Agency + S20 Future Plan cards. obj = 3D icon id from objects.js
export const DREAMS = [
  { label: 'be a pilot', say: "I'd like to be a pilot.", obj: 'plane' },
  { label: 'be an astronaut', say: 'I want to be an astronaut.', obj: 'rocket' },
  { label: 'be a chef', say: "I'd like to be a chef.", obj: 'chef' },
  { label: 'be a doctor', say: "Someday, I'm going to be a doctor.", obj: 'doctor' },
  { label: 'build robots', say: "Someday, I'm going to build robots.", obj: 'robot' },
  { label: 'have a big house', say: "Someday, I'm going to have a big house.", obj: 'house' },
  { label: 'play the guitar', say: "I'd like to play the guitar.", obj: 'guitar' },
  { label: 'buy a bike', say: 'I want to buy a bike.', obj: 'bike' },
  { label: 'have a dog', say: "I'd like to have a dog.", obj: 'dog' },
  { label: 'write a book', say: "Someday, I'm going to write a book.", obj: 'book' },
  { label: 'play basketball', say: "Someday, I'm going to play basketball.", obj: 'ball' },
  { label: 'run a marathon', say: "Someday, I'm going to run a marathon.", obj: 'trophy' },
  { label: 'be an artist', say: "Someday, I'm going to be an artist.", obj: 'palette' },
  { label: 'be a singer', say: "Someday, I'm going to be a singer.", obj: 'mic' },
];

// S21 · The World Around Us (opinion pairs). icon = optional 3D object id
export const OPINIONS = [
  { a: 'Dogs', b: 'Cats', ia: 'dog' },
  { a: 'Lions', b: 'Elephants' },
  { a: 'Birds', b: 'Fish' },
  { a: 'Forests', b: 'Oceans' },
  { a: 'Mountains', b: 'Beaches' },
  { a: 'Sunny days', b: 'Rainy days', ib: 'rain' },
  { a: 'Robots', b: 'Phones', ia: 'robot' },
  { a: 'Video games', b: 'Books', ib: 'book' },
  { a: 'Cars', b: 'Bicycles', ib: 'bike' },
];

// Past review (Yesterday Land) for the integrated show
export const PAST_Q = [
  { s: 'Yesterday, I ___ soccer.', a: ['played', 'play', 'playing'] },
  { s: 'Last year, I ___ to the beach.', a: ['went', 'go', 'going'] },
  { s: 'Yesterday, I ___ my bike.', a: ['rode', 'ride', 'riding'] },
  { s: 'Last week, I ___ a big pizza.', a: ['ate', 'eat', 'eating'] },
  { s: 'Last year, I ___ a dog.', a: ['had', 'have', 'having'] },
  { s: 'Yesterday, I ___ very happy.', a: ['was', 'am', 'be'] },
];

// S16 Grammar Tournament + S22 Ultimate Challenge (mixed review)
export const MIX_Q = [
  { s: 'Look! It ___ raining!', a: ['is', 'are', 'does'] },
  { s: 'She usually ___ soccer.', a: ['plays', 'play', 'is play'] },
  { s: 'I ___ lunch right now.', a: ['am eating', 'eat', 'eating'] },
  { s: 'Next year, I ___ travel.', a: ['am going to', 'going', 'am go'] },
  { s: 'I ___ swim very fast.', a: ['can', 'can to', 'should to'] },
  { s: 'You ___ eat vegetables.', a: ['should', 'should to', 'shoulds'] },
  { s: "I'd like ___ visit Japan.", a: ['to', 'for', 'at'] },
  { s: 'I think dogs are better ___ they are loyal.', a: ['because', 'but', 'the'] },
  { s: 'Yesterday, I ___ to the park.', a: ['went', 'go', 'going'] },
  { s: 'What ___ you going to do?', a: ['are', 'is', 'do'] },
  { s: 'He ___ to school every day.', a: ['goes', 'go', 'going'] },
  { s: "I want ___ a pilot.", a: ['to be', 'be', 'to being'] },
];
