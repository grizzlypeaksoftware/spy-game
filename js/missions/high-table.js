// Operation High Table: the casino.
//
// Map legend
//   #  wall            .  floor
//   c  low cover       C  tall block
//   D  door            1  blue keycard door     2  red keycard door
//   P  player start    X  extraction point
const MAP = [
  '########################################', //  0
  '#.........#..................#.........#', //  1
  '#.ccccc...#.CCC..CCC..CCC....#..ccc....#', //  2
  '#.........#..................#..ccc....#', //  3
  '#......c..#...cc....cc....c..2.........#', //  4
  '#.........D...cc....cc.......#......C..#', //  5
  '#.c..c....#..................#.c.......#', //  6
  '#.........#......C.....C.....#.........#', //  7
  '#.c..c..C.#..................#.........#', //  8
  '#.........#..cc....cc....cc..###########', //  9
  '#.........#..cc....cc....cc..#.........#', // 10
  '#####D#####..................#.cc..CC..#', // 11
  '#.........#......C.....C.....#.........#', // 12
  '#.cc.cc.C.#..................1.........#', // 13
  '#.........#...cc....cc....c..#.cc..CC..#', // 14
  '#.cc.cc...D...cc....cc.......#.........#', // 15
  '#.........#..................#...c.....#', // 16
  '#.CC...c..#..................#.........#', // 17
  '#.........#####D########D###############', // 18
  '#####D#####..................#.........#', // 19
  '#.........#.C..............C.#.cc..cc..#', // 20
  '#..CC.....#......cccc........#.........#', // 21
  '#..CC..c..#..................D.........#', // 22
  '#.........#.C..............C.#.cc..C...#', // 23
  '#.c....CC.#..................#.........#', // 24
  '#.P....CC.#..................#......c..#', // 25
  '#.........#........X.........#.........#', // 26
  '########################################', // 27
];

export default {
  id: 'high-table',
  codename: 'HIGH TABLE',
  location: 'Hotel Corvane casino, Port Selene',
  time: '00:50 local',
  briefing: [
    'Anton Roth buys weapons for three armies, and he is Voss\'s guest of honour. Tonight he is playing cards in the private salon of the Hotel Corvane while he waits for the demonstration.',
    'Roth does not leave Port Selene. He is the man in the pale suit, and he keeps two bodyguards at the table. Before you deal with him, photograph the markers book in the cashier\'s cage: it lists what he has already paid Voss.',
    'The pit boss carries the red salon card: navy coat, red cap, on the casino floor. The blue card for the cage is in the surveillance room.',
    'Come in through the kitchen. Walk out through the lobby.',
  ],
  signoff: 'Director Hale, the Lantern Office',

  map: MAP,
  startYaw: 0,
  menuCam: [19, 8],
  exitName: 'Lobby doors',
  exitTex: 'exitDoors',
  debrief: 'Roth is out of the game. His markers paid for a laboratory: Orrin Laboratories, on the coast road.',

  radio: {
    start: [
      ['HALE: You are in the loading bay behind the hotel. The kitchen door is ahead of you.', 1.2],
      ['HALE: Roth is in the private salon, north-east corner. Pale suit. Do the quiet work first.', 6.5],
    ],
    alarm: 'HALE: Hotel security has called for help. They will come through the loading bay.',
    exitOpen: 'HALE: It is done. Lobby, south of the casino floor. Straight out of the front.',
    doorBlue: "HALE: The cashier's cage takes a blue card. It is in the surveillance room, off the lobby.",
    doorRed: 'HALE: The private salon. The pit boss has the red card: navy coat, red cap, on the casino floor.',
    keyBlue: "HALE: Blue card. The cashier's cage is on the east side of the casino floor.",
    keyRed: 'HALE: Red card. The salon door is at the north-east corner of the casino floor.',
  },

  zones: [
    { name: 'Lounge bar', c0: 1, r0: 1, c1: 9, r1: 10, floor: 'parquet', wall: 'velvet', ceil: true, prop: 'table', propTall: 'shelf' },
    { name: 'Kitchen', c0: 1, r0: 12, c1: 9, r1: 18, floor: 'tile', wall: 'metal', ceil: true, prop: 'bench', propTall: 'tank' },
    { name: 'Loading bay', c0: 1, r0: 20, c1: 9, r1: 26, floor: 'asphalt', wall: 'brick', ceil: false, prop: 'crate' },
    { name: 'Casino floor', c0: 11, r0: 1, c1: 28, r1: 17, floor: 'carpetRed', wall: 'velvet', ceil: true, prop: 'table', propTall: 'slot' },
    { name: 'Lobby', c0: 11, r0: 19, c1: 28, r1: 26, floor: 'marble', wall: 'plaster', ceil: true, prop: 'plinth' },
    { name: 'Private salon', c0: 30, r0: 1, c1: 38, r1: 8, floor: 'carpetRed', wall: 'gallery', ceil: true, prop: 'table', propTall: 'plinth' },
    { name: "Cashier's cage", c0: 30, r0: 10, c1: 38, r1: 17, floor: 'tile', wall: 'vault', ceil: true, prop: 'desk', propTall: 'deposit' },
    { name: 'Surveillance room', c0: 30, r0: 19, c1: 38, r1: 26, floor: 'tile', wall: 'security', ceil: true, prop: 'desk', propTall: 'rack' },
  ],
  defaultZone: { name: 'Doorway', floor: 'tile', wall: 'trim', ceil: true, prop: 'crate' },

  lights: [
    { c: 5, r: 23, color: 0x6f8fd0, i: 0.5, rad: 11 },
    { c: 5, r: 20, color: 0xffb060, i: 0.7, rad: 6 },
    { c: 5, r: 14, color: 0xeaf4ff, i: 1.0, rad: 10 },
    { c: 4, r: 4, color: 0xffb870, i: 0.7, rad: 9 },
    { c: 6, r: 9, color: 0xffb870, i: 0.6, rad: 8 },
    // Each table has its own lamp; the aisles between are dim.
    { c: 16, r: 6, color: 0xffd9a0, i: 0.9, rad: 8 },
    { c: 23, r: 6, color: 0xffd9a0, i: 0.9, rad: 8 },
    { c: 15, r: 11, color: 0xffd9a0, i: 0.9, rad: 8 },
    { c: 24, r: 11, color: 0xffd9a0, i: 0.9, rad: 8 },
    { c: 16, r: 16, color: 0xffd9a0, i: 0.8, rad: 8 },
    { c: 23, r: 16, color: 0xffd9a0, i: 0.8, rad: 8 },
    { c: 19, r: 1, color: 0xff7a9a, i: 0.6, rad: 9 },
    { c: 19, r: 22, color: 0xfff2c8, i: 1.0, rad: 12 },
    { c: 13, r: 25, color: 0xfff2c8, i: 0.6, rad: 8 },
    { c: 26, r: 25, color: 0xfff2c8, i: 0.6, rad: 8 },
    { c: 34, r: 5, color: 0xffd9a0, i: 1.0, rad: 9 },
    { c: 34, r: 13, color: 0xbfd8ff, i: 0.9, rad: 9 },
    { c: 34, r: 22, color: 0x9fd8ff, i: 0.9, rad: 9 },
  ],

  // facing: 0 = south, PI/2 = east, PI = north, -PI/2 = west
  guards: [
    { type: 'guard', patrol: [[1, 12], [9, 12], [9, 16], [1, 16]] },
    { type: 'guard', patrol: [[4, 14]], facing: Math.PI },
    { type: 'guard', patrol: [[1, 3], [9, 3], [9, 9], [1, 9]] },
    { type: 'guard', patrol: [[3, 1]], facing: 0 },
    { type: 'officer', patrol: [[17, 6], [22, 6], [22, 11], [17, 11]], drops: 'keyRed' },
    { type: 'guard', patrol: [[11, 1], [28, 1], [28, 17], [11, 17]], runner: true },
    { type: 'guard', patrol: [[12, 8], [27, 8]] },
    { type: 'guard', patrol: [[27, 13], [12, 13]] },
    { type: 'guard', patrol: [[27, 3]], facing: -Math.PI / 2 },
    { type: 'guard', patrol: [[12, 19], [27, 19], [27, 25], [12, 25]] },
    { type: 'guard', patrol: [[19, 23]], facing: Math.PI },
    { type: 'guard', patrol: [[30, 10], [38, 10], [38, 17], [30, 17]] },
    { type: 'guard', patrol: [[34, 13]], facing: -Math.PI / 2, runner: true },
    { type: 'guard', patrol: [[30, 19], [38, 19], [38, 22], [30, 22]] },
    { type: 'guard', patrol: [[34, 24]], facing: Math.PI },
    { type: 'target', patrol: [[32, 7], [37, 7], [37, 1], [33, 1]], objective: 'roth' },
    { type: 'heavy', patrol: [[34, 5]], facing: -Math.PI / 2 },
    { type: 'heavy', patrol: [[36, 3]], facing: -Math.PI / 2 },
  ],

  cameras: [
    { c: 28, r: 1, ox: 0.8, oz: -0.8, yaw: -Math.PI / 4, sweep: 0.6, range: 17 },
    { c: 11, r: 17, ox: -0.8, oz: 0.8, yaw: Math.PI * 0.75, sweep: 0.6, range: 17 },
    { c: 28, r: 19, ox: 0.8, oz: -0.8, yaw: -Math.PI / 4, sweep: 0.5, range: 13 },
    { c: 38, r: 17, ox: 0.8, oz: 0.8, yaw: -Math.PI * 0.75, sweep: 0.4, range: 10 },
    { c: 1, r: 1, ox: -0.8, oz: -0.8, yaw: Math.PI / 4, sweep: 0.5, range: 11 },
  ],

  panels: [
    { c: 11, r: 8, side: 'w' },
    { c: 28, r: 10, side: 'e' },
    { c: 1, r: 14, side: 'w' },
    { c: 11, r: 24, side: 'w' },
    { c: 30, r: 24, side: 'w' },
  ],

  pickups: [
    { kind: 'shotgun', c: 1, r: 1 },
    { kind: 'ammoShells', c: 9, r: 12 },
    { kind: 'grenade', c: 30, r: 19 },
    { kind: 'keyBlue', c: 38, r: 19 },
    { kind: 'armor', c: 9, r: 26 },
    { kind: 'armor', c: 1, r: 10 },
    { kind: 'armor', c: 28, r: 17 },
    { kind: 'armor', c: 30, r: 26 },
    { kind: 'ammoPistol', c: 1, r: 20 },
    { kind: 'ammoPistol', c: 9, r: 18 },
    { kind: 'ammoPistol', c: 11, r: 26 },
    { kind: 'ammoPistol', c: 38, r: 8 },
    { kind: 'ammoSmg', c: 30, r: 17 },
    { kind: 'ammoSmg', c: 28, r: 26 },
  ],

  interactables: [
    { id: 'book', kind: 'photo', objective: 'book', c: 31, r: 12, side: 'n', style: 'papers', hold: 1.5, label: 'Photograph the markers book' },
    { id: 'bug', kind: 'plant', objective: 'bug', c: 32, r: 4, side: 'n', style: 'tag', hold: 2.5, label: 'Plant the listening device under the table' },
    { id: 'tapes', kind: 'use', objective: 'tapes', c: 38, r: 21, side: 'e', style: 'console', hold: 3, label: 'Wipe the casino recordings' },
    { id: 'breaker', kind: 'breaker', objective: 'grid', c: 38, r: 10, side: 'e', style: 'breaker', hold: 1.8, label: 'Cut the alarm grid' },
  ],

  objectives: [
    { id: 'bug', min: 1, text: 'Bug the high table in the private salon' },
    { id: 'tapes', min: 2, text: 'Wipe the casino recordings' },
    { id: 'book', min: 0, text: "Photograph the cashier's markers book" },
    { id: 'roth', min: 0, text: 'Deal with Anton Roth in the private salon' },
    { id: 'extract', min: 0, text: 'Walk out through the lobby' },
  ],

  reinforce: [[1, 26], [4, 26], [1, 23], [4, 23]],
};
