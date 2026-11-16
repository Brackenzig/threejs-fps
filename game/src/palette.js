// RELAY / NINE — warm aggregate, oxidised teal steel and signal amber.
// The original semantic names remain available to weapons, targets and the HUD.
export const PALETTE = {
  canvas: '#d2bea0',
  surface: '#c1ae90',
  hairline: '#344a49',
  ink: '#f7edd9',
  muted: '#8c9c96',
  accent: '#f2b544',
  concrete: '#c9b699',
  concreteDark: '#9e927d',
  teal: '#286b68',
  tealLight: '#458884',
  tealDark: '#183f41',
  steel: '#495553',
  rust: '#ad6948',
  glass: '#244c55',
  sky: '#e8c994',
  fog: '#dbc5a1',
  lamp: '#ffe2a1',
};

export function shade(name) {
  return PALETTE[name];
}
