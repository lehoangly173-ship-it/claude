export const C = {
  bg: '#F6F2EA',
  card: '#FFFFFF',
  ink: '#1D2A22',
  sub: '#6B7468',
  faint: '#A3A99F',
  line: '#ECE6DA',
  forest: '#1F3B2C',
  forest2: '#2C5040',
  gold: '#E8B44A',
  goldSoft: '#FBF0D5',
  green: '#3E9B5E',
  greenSoft: '#E3F3E7',
  amber: '#C98A12',
  amberSoft: '#FDF1D6',
  tan: '#A8724A',
  tanSoft: '#F5E8DC',
  purple: '#7556C9',
  purpleSoft: '#EEE8FB',
  blue: '#3477C5',
  blueSoft: '#E4EEFA',
  red: '#C8473B',
  redSoft: '#FBE5E2',
};

export const R = { sm: 8, md: 12, lg: 16, xl: 22 };

export type Tone = 'green' | 'amber' | 'tan' | 'purple' | 'blue' | 'red' | 'gray' | 'gold';

export const tone = (t: Tone) => {
  switch (t) {
    case 'green': return { fg: C.green, bg: C.greenSoft };
    case 'amber': return { fg: C.amber, bg: C.amberSoft };
    case 'tan': return { fg: C.tan, bg: C.tanSoft };
    case 'purple': return { fg: C.purple, bg: C.purpleSoft };
    case 'blue': return { fg: C.blue, bg: C.blueSoft };
    case 'red': return { fg: C.red, bg: C.redSoft };
    case 'gold': return { fg: '#8A6410', bg: C.goldSoft };
    default: return { fg: C.sub, bg: '#F0ECE4' };
  }
};
