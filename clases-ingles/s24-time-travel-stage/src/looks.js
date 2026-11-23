// "My Look": what a traveler can wear. Every item has an English name the kid reads and hears.
// Free items are always there; shop items cost time crystals (gems).

export const COLORS = [
  { id: 'red', hex: '#E53935' },
  { id: 'blue', hex: '#1E88E5' },
  { id: 'navy blue', hex: '#145389' },
  { id: 'green', hex: '#43A047' },
  { id: 'yellow', hex: '#FDD835' },
  { id: 'orange', hex: '#F57C00' },
  { id: 'purple', hex: '#8E24AA' },
  { id: 'pink', hex: '#EC407A' },
  { id: 'black', hex: '#263238' },
  { id: 'white', hex: '#F7FAFC' },
  { id: 'brown', hex: '#6D4C41' },
  { id: 'gray', hex: '#90A4AE' },
];
const SKINS = ['#F6D2B5', '#E9B48A', '#C98B5E', '#A0663F', '#6F4429'];
const HAIRS = [
  { id: 'black', hex: '#1F1A17' },
  { id: 'brown', hex: '#5A3A22' },
  { id: 'dark brown', hex: '#3B2A20' },
  { id: 'blond', hex: '#E5C066' },
  { id: 'red', hex: '#B5452A' },
  { id: 'blue', hex: '#1E88E5' },
  { id: 'pink', hex: '#EC407A' },
];

// slot -> how the item is chosen. "color" slots pick a color; "item" slots pick a thing.
export const SLOTS = [
  { id: 'hairStyle', label: 'Hair', kind: 'item' },
  { id: 'hair', label: 'Hair color', kind: 'color', noun: 'hair', colors: HAIRS },
  { id: 'skin', label: 'Skin', kind: 'skin' },
  { id: 'shirt', label: 'T-shirt', kind: 'color', noun: 'T-shirt', colors: COLORS },
  { id: 'print', label: 'T-shirt picture', kind: 'item' },
  { id: 'pants', label: 'Pants', kind: 'color', noun: 'pants', colors: COLORS },
  { id: 'shoes', label: 'Shoes', kind: 'color', noun: 'shoes', colors: COLORS },
  { id: 'scarf', label: 'Scarf', kind: 'color', noun: 'scarf', colors: COLORS, none: true },
  { id: 'hat', label: 'Hats', kind: 'item' },
  { id: 'glasses', label: 'Glasses', kind: 'item' },
  { id: 'back', label: 'On my back', kind: 'item' },
  { id: 'ears', label: 'Ears', kind: 'item' },
];
export { SKINS };

// shop and free items for the "item" slots. price 0 = free.
export const ITEMS = [
  { id: 'hair-short', slot: 'hairStyle', value: 'short', name: 'short hair', price: 0 },
  { id: 'hair-long', slot: 'hairStyle', value: 'long', name: 'long hair', price: 0 },
  { id: 'hair-spiky', slot: 'hairStyle', value: 'spiky', name: 'spiky hair', price: 0 },
  { id: 'hair-curly', slot: 'hairStyle', value: 'curly', name: 'curly hair', price: 20 },
  { id: 'print-none', slot: 'print', value: 'none', name: 'plain T-shirt', price: 0 },
  { id: 'print-star', slot: 'print', value: 'star', name: 'star T-shirt', price: 20 },
  { id: 'print-heart', slot: 'print', value: 'heart', name: 'heart T-shirt', price: 20 },
  { id: 'print-bolt', slot: 'print', value: 'bolt', name: 'lightning T-shirt', price: 25 },
  { id: 'hat-none', slot: 'hat', value: 'none', name: 'no hat', price: 0 },
  { id: 'hat-cap', slot: 'hat', value: 'cap', name: 'red cap', price: 25 },
  { id: 'hat-beanie', slot: 'hat', value: 'beanie', name: 'purple beanie', price: 25 },
  { id: 'hat-sun', slot: 'hat', value: 'sunhat', name: 'sun hat', price: 30 },
  { id: 'hat-crown', slot: 'hat', value: 'crown', name: 'gold crown', price: 60 },
  { id: 'glasses-none', slot: 'glasses', value: 'none', name: 'no glasses', price: 0 },
  { id: 'glasses-goggles', slot: 'glasses', value: 'goggles', name: 'time goggles', price: 0 },
  { id: 'glasses-round', slot: 'glasses', value: 'round', name: 'round glasses', price: 20 },
  { id: 'glasses-sun', slot: 'glasses', value: 'sunglasses', name: 'sunglasses', price: 25 },
  { id: 'back-none', slot: 'back', value: 'none', name: 'nothing', price: 0 },
  { id: 'back-clock', slot: 'back', value: 'clockpack', name: 'time backpack', price: 0 },
  { id: 'back-pack', slot: 'back', value: 'backpack', name: 'green backpack', price: 30 },
  { id: 'back-cape', slot: 'back', value: 'cape', name: 'hero cape', price: 50 },
  { id: 'ears-none', slot: 'ears', value: 'none', name: 'nothing', price: 0 },
  { id: 'ears-phones', slot: 'ears', value: 'headphones', name: 'headphones', price: 35 },
];
// special colors cost crystals
export const PAID_COLORS = { 'shirt:gold': 40, 'pants:gold': 40 };
export const GOLD = { id: 'gold', hex: '#D4A017' };

export function defaultLook(P) {
  return {
    skin: P.skin || '#E9B48A', hair: P.hair, hairStyle: P.long ? 'long' : 'short',
    shirt: P.suit, pants: '#1D3F54', shoes: '#F7FAFC', scarf: P.scarf,
    print: 'none', hat: 'none', glasses: 'goggles', back: 'clockpack', ears: 'none',
  };
}
export const itemById = (id) => ITEMS.find((i) => i.id === id);
export const colorName = (list, hex) => (list.find((c) => c.hex.toLowerCase() === String(hex).toLowerCase()) || {}).id || '';
