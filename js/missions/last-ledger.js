// Operation Last Ledger: the estate.
//
// Map legend
//   #  wall            .  floor
//   c  low cover       C  tall block
//   D  door            1  blue keycard door     2  red keycard door
//   P  player start    X  extraction point
const MAP = [
  '########################################', //  0
  '#......................................#', //  1
  '#..CC....cc......CCCC......cc......X...#', //  2
  '#..CC......................c...........#', //  3
  '#..........c...........................#', //  4
  '#......................................#', //  5
  '#........###############D######........#', //  6
  '#..CC....#........#...........#....CC..#', //  7
  '#..CC....#.cc..C..#.C.C...C.C.#....CC..#', //  8
  '#........1........#.C.C...C.C.#........#', //  9
  '#....c...#........D...........#.c......#', // 10
  '#........#.c..cc..#....ccc....#........#', // 11
  '#.C......#........#...........#...cc...#', // 12
  '#.C...c..####1#######2#########........#', // 13
  '#........#........#......#....#......C.#', // 14
  '#...CC...#.C....C.#.cc...#.C..#......C.#', // 15
  '#...CC...#........#......#....#........#', // 16
  '#........#...cc...#......D....#..c.....#', // 17
  '#.c......#........#...cc.#..c.#........#', // 18
  '#......c.#.C....C.#......#....#....CC..#', // 19
  '#........#........#......#....#....CC..#', // 20
  '#........#####D################........#', // 21
  '#......................................#', // 22
  '#....CC......c.........CCCC.....c......#', // 23
  '#....CC................................#', // 24
  '#.P..........cc..............cc........#', // 25
  '#......................................#', // 26
  '########################################', // 27
];

export default {
  id: 'last-ledger',
  codename: 'LAST LEDGER',
  location: "Casimir Voss's estate, Cape Arden",
  time: '05:55 local',
  briefing: [
    'This is where it ends. Voss is in the study of his house on Cape Arden, with two bodyguards and a helicopter warming up on the north lawn. He wears a red jacket. He does not get on that helicopter.',
    'His master ledger is in the study safe: every sale, every buyer. Bring it home.',
    'The inner rooms take a blue card, kept in the east garden. His head of security carries the red study card: navy coat, red cap, in the library.',
    'If the alarm sounds, Voss runs for the helicopter, and you will have very little time to stop him. When it is done, the pad is yours.',
  ],
  signoff: 'Director Hale, the Lantern Office',

  map: MAP,
  startYaw: 0,
  menuCam: [20, 24],
  exitName: 'Helicopter pad',
  sky: 0x0d1420,
  ambient: [0.1, 0.12, 0.15],
  debrief: 'The ledger is closed. Come home.',

  radio: {
    start: [
      ['HALE: You are inside the wall at the south-west corner. The house is ahead; the front door is on its south side.', 1.2],
      ['HALE: Quietly. If he hears the alarm, he runs.', 6.5],
    ],
    alarm: 'HALE: He has called in the men from the gatehouse. They are coming across the south lawn.',
    exitOpen: 'HALE: It is finished. Helicopter pad, north lawn, east end. The pilot now works for us.',
    doorBlue: 'HALE: The inner rooms take a blue card. There is one in the east garden, south end.',
    doorRed: 'HALE: The study. His head of security has the red card: navy coat, red cap, in the library.',
    keyBlue: 'HALE: Blue card. It opens the drawing room, from the hall or from the west terrace.',
    keyRed: 'HALE: Red card. The study door is in the south wall of the library.',
  },

  // The alarm sends Voss to his helicopter; stopping him stops the clock.
  countdown: {
    on: 'alarm',
    until: 'voss',
    seconds: [170, 140, 115],
    label: 'VOSS ESCAPING',
    radio: 'HALE: He is going for the helicopter. Get to the study, now.',
    stopped: 'Voss is not going anywhere.',
    fail: 'Voss reached his helicopter.',
  },

  zones: [
    { name: 'Drawing room', c0: 10, r0: 7, c1: 17, r1: 12, floor: 'parquet', wall: 'gallery', ceil: true, prop: 'table', propTall: 'plinth' },
    { name: 'Library', c0: 19, r0: 7, c1: 29, r1: 12, floor: 'carpet', wall: 'panel', ceil: true, prop: 'desk', propTall: 'shelf' },
    { name: 'Hall', c0: 10, r0: 14, c1: 17, r1: 20, floor: 'terracotta', wall: 'plaster', ceil: true, prop: 'plinth' },
    { name: 'Study', c0: 19, r0: 14, c1: 24, r1: 20, floor: 'parquet', wall: 'office', ceil: true, prop: 'desk' },
    { name: 'Radio room', c0: 26, r0: 14, c1: 29, r1: 20, floor: 'tile', wall: 'security', ceil: true, prop: 'desk', propTall: 'rack' },
    { name: 'North lawn', c0: 1, r0: 1, c1: 38, r1: 5, floor: 'lawn', wall: 'stucco', ceil: false, prop: 'hedge' },
    { name: 'South lawn', c0: 1, r0: 22, c1: 38, r1: 26, floor: 'lawn', wall: 'stucco', ceil: false, prop: 'hedge' },
    { name: 'West terrace', c0: 1, r0: 6, c1: 8, r1: 21, floor: 'terracotta', wall: 'stucco', ceil: false, prop: 'hedge' },
    { name: 'East garden', c0: 31, r0: 6, c1: 38, r1: 21, floor: 'lawn', wall: 'stucco', ceil: false, prop: 'hedge' },
  ],
  defaultZone: { name: 'Doorway', floor: 'terracotta', wall: 'trim', ceil: true, prop: 'crate' },

  lights: [
    { c: 4, r: 24, color: 0x6f8fd0, i: 0.45, rad: 12 },
    { c: 14, r: 22, color: 0xffc070, i: 0.9, rad: 8 },
    { c: 24, r: 24, color: 0x6f8fd0, i: 0.45, rad: 12 },
    { c: 34, r: 24, color: 0x6f8fd0, i: 0.4, rad: 10 },
    { c: 8, r: 9, color: 0xffc070, i: 0.8, rad: 7 },
    { c: 4, r: 17, color: 0x6f8fd0, i: 0.4, rad: 10 },
    { c: 34, r: 11, color: 0x6f8fd0, i: 0.4, rad: 10 },
    { c: 35, r: 18, color: 0xffc070, i: 0.6, rad: 7 },
    { c: 24, r: 5, color: 0xffc070, i: 0.8, rad: 7 },
    { c: 8, r: 3, color: 0x6f8fd0, i: 0.4, rad: 11 },
    // The pad lights.
    { c: 33, r: 1, color: 0xff7060, i: 0.8, rad: 9 },
    { c: 37, r: 4, color: 0xff7060, i: 0.8, rad: 9 },
    { c: 13, r: 16, color: 0xffe2b0, i: 1.0, rad: 9 },
    { c: 13, r: 9, color: 0xffd9a0, i: 0.9, rad: 9 },
    { c: 24, r: 10, color: 0xffd9a0, i: 0.9, rad: 10 },
    { c: 21, r: 17, color: 0xffe2b0, i: 1.0, rad: 8 },
    { c: 28, r: 17, color: 0x9fd8ff, i: 0.9, rad: 7 },
  ],

  // facing: 0 = south, PI/2 = east, PI = north, -PI/2 = west
  guards: [
    { type: 'guard', patrol: [[12, 22], [34, 22], [34, 26], [12, 26]] },
    { type: 'guard', patrol: [[1, 6], [8, 6], [8, 13], [1, 13]] },
    { type: 'guard', patrol: [[1, 1], [38, 1], [38, 5], [1, 5]], runner: true },
    { type: 'guard', patrol: [[24, 4]], facing: 0 },
    { type: 'guard', patrol: [[31, 6], [38, 6], [38, 21], [31, 21]] },
    { type: 'guard', patrol: [[34, 16]], facing: -Math.PI / 2 },
    { type: 'heavy', patrol: [[33, 3]], facing: -Math.PI / 2 },
    { type: 'guard', patrol: [[10, 14], [17, 14], [17, 20], [10, 20]] },
    { type: 'guard', patrol: [[14, 16]], facing: 0, runner: true },
    { type: 'guard', patrol: [[10, 7], [17, 7], [17, 12], [10, 12]] },
    { type: 'guard', patrol: [[13, 9]], facing: -Math.PI / 2 },
    { type: 'officer', patrol: [[19, 7], [29, 7], [29, 12], [19, 12]], drops: 'keyRed' },
    { type: 'guard', patrol: [[23, 10], [29, 10]], runner: true },
    { type: 'boss', patrol: [[20, 16], [23, 16], [23, 20], [20, 20]], objective: 'voss' },
    { type: 'heavy', patrol: [[23, 15]], facing: -Math.PI / 2 },
    { type: 'heavy', patrol: [[20, 17]], facing: Math.PI },
    { type: 'guard', patrol: [[27, 19]], facing: Math.PI },
  ],

  cameras: [
    { c: 9, r: 22, ox: 0, oz: -0.8, yaw: Math.PI / 2, sweep: 0.35, range: 16 },
    { c: 31, r: 5, ox: 0, oz: 0.8, yaw: -Math.PI / 2, sweep: 0.35, range: 16 },
    { c: 17, r: 14, ox: 0.8, oz: -0.8, yaw: -Math.PI / 4, sweep: 0.5, range: 10 },
    { c: 29, r: 7, ox: 0.8, oz: -0.8, yaw: -Math.PI / 4, sweep: 0.5, range: 12 },
    { c: 24, r: 14, ox: 0.8, oz: -0.8, yaw: -Math.PI / 4, sweep: 0.4, range: 8 },
  ],

  panels: [
    { c: 10, r: 15, side: 'w' },
    { c: 29, r: 9, side: 'e' },
    { c: 10, r: 8, side: 'w' },
    { c: 26, r: 20, side: 's' },
    { c: 38, r: 9, side: 'e' },
  ],

  pickups: [
    { kind: 'rifle', c: 1, r: 6 },
    { kind: 'shotgun', c: 10, r: 14 },
    { kind: 'ammoShells', c: 17, r: 12 },
    { kind: 'ammoRifle', c: 38, r: 1 },
    { kind: 'grenade', c: 31, r: 21 },
    { kind: 'grenade', c: 10, r: 7 },
    { kind: 'keyBlue', c: 38, r: 21 },
    { kind: 'armor', c: 1, r: 21 },
    { kind: 'armor', c: 38, r: 26 },
    { kind: 'armor', c: 17, r: 20 },
    { kind: 'armor', c: 29, r: 12 },
    { kind: 'armor', c: 1, r: 1 },
    { kind: 'ammoPistol', c: 1, r: 26 },
    { kind: 'ammoPistol', c: 8, r: 21 },
    { kind: 'ammoPistol', c: 10, r: 20 },
    { kind: 'ammoPistol', c: 17, r: 7 },
    { kind: 'ammoSmg', c: 38, r: 6 },
    { kind: 'ammoSmg', c: 29, r: 20 },
  ],

  interactables: [
    { id: 'ledger', kind: 'use', objective: 'ledger', c: 19, r: 19, side: 'w', style: 'safe', hold: 3, label: 'Open the safe and take the master ledger' },
    { id: 'phones', kind: 'use', objective: 'phones', c: 10, r: 17, side: 'w', style: 'console', hold: 3, label: 'Cut the estate telephone exchange' },
    {
      id: 'network', kind: 'download', objective: 'network', c: 29, r: 15, side: 'e', style: 'console', hold: 1.2,
      label: 'Copy the buyer network', time: 12,
      progress: 'COPYING BUYER NETWORK', lost: 'SIGNAL LOST. RETURN TO THE RADIO ROOM',
      radio: 'HALE: Copy is running. Stay in the radio room until it finishes.',
      company: 'HALE: The set has stopped answering the gatehouse. They will send someone.',
    },
    { id: 'breaker', kind: 'breaker', objective: 'grid', c: 38, r: 12, side: 'e', style: 'breaker', hold: 1.8, label: 'Cut the alarm grid' },
  ],

  objectives: [
    { id: 'phones', min: 1, text: 'Cut the telephone exchange in the hall' },
    { id: 'network', min: 2, text: 'Copy the buyer network in the radio room' },
    { id: 'ledger', min: 0, text: 'Take the master ledger from the safe' },
    { id: 'voss', min: 0, text: 'Stop Casimir Voss' },
    { id: 'extract', min: 0, text: 'Reach the helicopter pad' },
  ],

  reinforce: [[1, 22], [3, 22], [1, 24], [6, 26]],
};
