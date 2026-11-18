// Operation Gilt Frame: the auction house.
//
// Map legend
//   #  wall            .  floor
//   c  low cover       C  tall block
//   D  door            1  blue keycard door     2  red keycard door
//   P  player start    X  extraction point
const MAP = [
  '########################################', //  0
  '#.............#....X.....#......#.C..C.#', //  1
  '#.C...cc.cc...#..........#..cc..#......#', //  2
  '#.....cc.cc...#.C......C.#......#.c..c.#', //  3
  '#.c...........#..........#......#......#', //  4
  '#.....cc.cc...#...cc.....#c....c#.C..C.#', //  5
  '#.C...cc.cc...#.C......C.#......#......#', //  6
  '#.............#..........#......#......#', //  7
  '###########D#####D####D#####1######2####', //  8
  '#.......#.......................#......#', //  9
  '#.CC..c.#.....C....C.C....C.....#......#', // 10
  '#.CC....#.......................#.cc...#', // 11
  '#.......#....cc...........cc....#......#', // 12
  '#.......D...........C...........#......#', // 13
  '#.c..CC.#...........C...........D......#', // 14
  '#....CC.#....cc...........cc....#...cc.#', // 15
  '#.......#.......................#......#', // 16
  '#.cc....#.....C....C.C....C.....#.c....#', // 17
  '#.......#.......................#......#', // 18
  '####D###############D###############D###', // 19
  '#............#............#............#', // 20
  '#..cc....CC..#.cc.....cc..#.CC..CC..C..#', // 21
  '#........CC..#............#.CC..CC.....#', // 22
  '#............D............D............#', // 23
  '#..C.....cc..#..ccc..ccc..#.CC..CC..cc.#', // 24
  '#.P..........#............#.CC..CC.....#', // 25
  '#............#............#............#', // 26
  '########################################', // 27
];

export default {
  id: 'gilt-frame',
  codename: 'GILT FRAME',
  location: 'Auberon House auction rooms, Kessler Square, Vellmark',
  time: '23:40 local',
  briefing: [
    'The ledger shows Voss collecting through Auberon House. His hardware goes under the hammer as "lot 44", crated as sculpture, at private sales the catalogue never mentions.',
    'We need to know who is bidding. The director keeps a private sale register in his office, and lot 44 is in the strongroom awaiting collection. Photograph the register, scan the lot, and leave by the front doors.',
    'The night steward carries the blue card for the director\'s office: navy coat, red cap, walking between the foyer and the gallery. The red strongroom card is in the director\'s office.',
    'The gallery is wide, open, and watched by two cameras. Stay behind the plinths.',
  ],
  signoff: 'Director Hale, the Lantern Office',

  map: MAP,
  startYaw: 0,
  menuCam: [20, 16],
  exitName: 'Front doors',
  exitTex: 'exitDoors',
  debrief: 'The register lists one buyer for every lot 44: a breaking yard at Sable Point.',

  radio: {
    start: [
      ['HALE: You are in the service yard behind the house. One man walks the far wall.', 1.2],
      ['HALE: The steward with the blue card is up by the foyer. Hold Tab for your map.', 6.5],
    ],
    alarm: 'HALE: The house has called its security firm. They are coming in through the yard.',
    exitOpen: 'HALE: We have what we need. Front doors, north side of the foyer. Walk out.',
    doorBlue: 'HALE: Blue card. The night steward has it: navy coat, red cap, between the foyer and the gallery.',
    doorRed: 'HALE: The strongroom takes the red card. The director keeps it in his office.',
    keyBlue: 'HALE: That is the director\'s office card. North side of the gallery, east of the foyer.',
    keyRed: 'HALE: Red card. The strongroom door is at the north end of the security room.',
  },

  zones: [
    { name: 'Service yard', c0: 1, r0: 20, c1: 12, r1: 26, floor: 'cobble', wall: 'brick', ceil: false, prop: 'crate' },
    { name: 'Packing room', c0: 1, r0: 9, c1: 7, r1: 18, floor: 'concrete', wall: 'plaster', ceil: true, prop: 'crate' },
    { name: 'Gallery', c0: 9, r0: 9, c1: 31, r1: 18, floor: 'parquet', wall: 'gallery', ceil: true, prop: 'plinth' },
    { name: 'Viewing room', c0: 1, r0: 1, c1: 13, r1: 7, floor: 'carpet', wall: 'gallery', ceil: true, prop: 'plinth' },
    { name: 'Foyer', c0: 15, r0: 1, c1: 24, r1: 7, floor: 'marble', wall: 'plaster', ceil: true, prop: 'plinth' },
    { name: "Director's office", c0: 26, r0: 1, c1: 31, r1: 7, floor: 'carpet', wall: 'office', ceil: true, prop: 'desk' },
    { name: 'Strongroom', c0: 33, r0: 1, c1: 38, r1: 7, floor: 'serverFloor', wall: 'security', ceil: true, prop: 'crate' },
    { name: 'Security room', c0: 33, r0: 9, c1: 38, r1: 18, floor: 'tile', wall: 'security', ceil: true, prop: 'desk' },
    { name: 'Cataloguing office', c0: 14, r0: 20, c1: 25, r1: 26, floor: 'tile', wall: 'panel', ceil: true, prop: 'desk' },
    { name: 'Cellar stores', c0: 27, r0: 20, c1: 38, r1: 26, floor: 'concrete', wall: 'brick', ceil: true, prop: 'crate' },
  ],
  defaultZone: { name: 'Doorway', floor: 'tile', wall: 'trim', ceil: true, prop: 'crate' },

  lights: [
    { c: 5, r: 23, color: 0x6f8fd0, i: 0.5, rad: 14 },
    { c: 12, r: 22, color: 0xffb060, i: 0.9, rad: 8 },
    { c: 4, r: 12, color: 0xfff0d0, i: 0.9, rad: 11 },
    { c: 3, r: 16, color: 0xfff0d0, i: 0.7, rad: 9 },
    // The gallery is lit only by spots over the exhibits.
    { c: 13, r: 13, color: 0xffe2b0, i: 0.85, rad: 8 },
    { c: 27, r: 13, color: 0xffe2b0, i: 0.85, rad: 8 },
    { c: 20, r: 11, color: 0xffe2b0, i: 0.85, rad: 8 },
    { c: 20, r: 16, color: 0xffe2b0, i: 0.85, rad: 8 },
    { c: 4, r: 4, color: 0xffe2b0, i: 0.9, rad: 10 },
    { c: 11, r: 4, color: 0xffe2b0, i: 0.8, rad: 9 },
    { c: 19, r: 3, color: 0xfff2c8, i: 1.0, rad: 11 },
    { c: 20, r: 6, color: 0xfff2c8, i: 0.7, rad: 8 },
    { c: 29, r: 4, color: 0xffe2b0, i: 1.0, rad: 9 },
    { c: 35, r: 4, color: 0x60d8ff, i: 0.9, rad: 10 },
    { c: 35, r: 13, color: 0xbfd8ff, i: 1.0, rad: 11 },
    { c: 36, r: 17, color: 0xbfd8ff, i: 0.6, rad: 8 },
    { c: 17, r: 22, color: 0xfff2c8, i: 0.9, rad: 10 },
    { c: 23, r: 25, color: 0xfff2c8, i: 0.9, rad: 10 },
    { c: 31, r: 23, color: 0xffb870, i: 0.8, rad: 10 },
    { c: 36, r: 23, color: 0xffb870, i: 0.6, rad: 8 },
  ],

  // facing: 0 = south, PI/2 = east, PI = north, -PI/2 = west
  guards: [
    { type: 'guard', patrol: [[11, 20], [11, 26]] },
    { type: 'guard', patrol: [[1, 9], [7, 9], [7, 12], [1, 12]] },
    { type: 'guard', patrol: [[4, 16], [1, 18], [7, 18]] },
    { type: 'guard', patrol: [[10, 9], [30, 9], [30, 18], [10, 18]], runner: true },
    { type: 'guard', patrol: [[15, 11], [25, 11], [25, 16], [15, 16]] },
    { type: 'officer', patrol: [[19, 6], [17, 9], [22, 9], [20, 4]], drops: 'keyBlue' },
    { type: 'guard', patrol: [[18, 4]], facing: 0 },
    { type: 'guard', patrol: [[3, 7], [12, 7], [12, 1], [4, 1]] },
    { type: 'guard', patrol: [[35, 12]], facing: -Math.PI / 2 },
    { type: 'guard', patrol: [[33, 9], [38, 9], [38, 18], [33, 18]], runner: true },
    { type: 'guard', patrol: [[14, 20], [25, 20], [25, 26], [14, 26]] },
    { type: 'guard', patrol: [[27, 23], [38, 23]], runner: true },
    { type: 'guard', patrol: [[33, 2], [38, 2], [38, 7], [33, 7]] },
    { type: 'guard', patrol: [[30, 6]], facing: -Math.PI / 2 },
    { type: 'guard', patrol: [[30, 14]], facing: -Math.PI / 2, runner: true },
  ],

  cameras: [
    { c: 24, r: 1, ox: 0.8, oz: -0.8, yaw: -Math.PI / 4, sweep: 0.5, range: 13 },
    { c: 31, r: 9, ox: 0.8, oz: -0.8, yaw: -Math.PI / 4, sweep: 0.6, range: 17 },
    { c: 9, r: 18, ox: -0.8, oz: 0.8, yaw: Math.PI * 0.75, sweep: 0.6, range: 17 },
    { c: 33, r: 9, ox: -0.8, oz: -0.8, yaw: Math.PI / 4, sweep: 0.5, range: 12 },
  ],

  panels: [
    { c: 9, r: 11, side: 'w' },
    { c: 31, r: 11, side: 'e' },
    { c: 15, r: 4, side: 'w' },
    { c: 14, r: 25, side: 'w' },
    { c: 33, r: 16, side: 'w' },
  ],

  pickups: [
    { kind: 'grenade', c: 38, r: 9 },
    { kind: 'keyRed', c: 30, r: 1 },
    { kind: 'armor', c: 7, r: 10 },
    { kind: 'armor', c: 26, r: 7 },
    { kind: 'armor', c: 38, r: 20 },
    { kind: 'ammoPistol', c: 1, r: 26 },
    { kind: 'ammoPistol', c: 13, r: 1 },
    { kind: 'ammoPistol', c: 25, r: 26 },
    { kind: 'ammoSmg', c: 33, r: 18 },
  ],

  interactables: [
    { id: 'register', kind: 'photo', objective: 'register', c: 28, r: 3, side: 'n', style: 'papers', hold: 1.5, label: 'Photograph the sale register' },
    { id: 'bug', kind: 'plant', objective: 'bug', c: 1, r: 4, side: 'w', style: 'tag', hold: 2.5, label: 'Plant the listening device' },
    { id: 'tapes', kind: 'use', objective: 'tapes', c: 38, r: 12, side: 'e', style: 'console', hold: 3, label: 'Wipe the camera recordings' },
    {
      id: 'lot', kind: 'download', objective: 'lot', c: 35, r: 1, side: 'w', style: 'tag', hold: 1.2,
      label: 'Fix the scanner to lot 44', time: 12,
      progress: 'SCANNING LOT 44', lost: 'OUT OF RANGE. RETURN TO THE STRONGROOM',
      radio: 'HALE: Scanner is reading. Stay in the strongroom until it is done.',
      company: 'HALE: That door logs every opening. Someone will come to check.',
    },
    { id: 'breaker', kind: 'breaker', objective: 'grid', c: 38, r: 26, side: 'e', style: 'breaker', hold: 1.8, label: 'Cut the alarm grid' },
  ],

  objectives: [
    { id: 'bug', min: 1, text: 'Bug the rostrum in the viewing room' },
    { id: 'tapes', min: 2, text: 'Wipe the security camera recordings' },
    { id: 'register', min: 0, text: "Photograph the director's sale register" },
    { id: 'lot', min: 0, text: 'Scan lot 44 in the strongroom' },
    { id: 'extract', min: 0, text: 'Leave by the front doors' },
  ],

  reinforce: [[1, 20], [3, 26], [6, 26], [1, 23]],
};
