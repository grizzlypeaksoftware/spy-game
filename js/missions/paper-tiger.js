// Operation Paper Tiger: the private bank.
//
// Map legend
//   #  wall            .  floor
//   c  low cover       C  tall block
//   D  door            1  blue keycard door     2  red keycard door
//   P  player start    X  extraction point
const MAP = [
  '########################################', //  0
  '#...........#...............#..........#', //  1
  '#..CC....c..#.CC.CC...CC.CC.#..cc..C...#', //  2
  '#X.CC.......#...............#..........#', //  3
  '#........c..#.CC.CC...CC.CC.#.c....cc..#', //  4
  '#...c.......#...............#..........#', //  5
  '#...........#...............#..........#', //  6
  '####D######D########2#############1#####', //  7
  '#........#....................#........#', //  8
  '#.CC..CC.#..C....C....C....C..#.cc.....#', //  9
  '#........#....................#........#', // 10
  '#.CC..CC.#....cccc....cccc....#.....cc.#', // 11
  '#........#....................#........#', // 12
  '#........D..C..............C..#.C......#', // 13
  '#.CC..c..#....................D........#', // 14
  '#........#....cccc....cccc....#....cc..#', // 15
  '#.cc..CC.#....................#........#', // 16
  '#........#..C....C....C....C..#.c......#', // 17
  '#........#....................#........#', // 18
  '################D#################D#####', // 19
  '#.........#.............#..............#', // 20
  '#..CC.....#.cc...cc...c.#..CC..cc..CC..#', // 21
  '#..CC..c..#.............D..............#', // 22
  '#.........D.............#..cc......cc..#', // 23
  '#.c.......#.cc...cc..C..#..............#', // 24
  '#.P...CC..#.............#..CC..cc..CC..#', // 25
  '#.........#.............#..............#', // 26
  '########################################', // 27
];

export default {
  id: 'paper-tiger',
  codename: 'PAPER TIGER',
  location: 'Brandt & Lowe private bank, Kessler Square, Vellmark',
  time: '01:20 local',
  briefing: [
    'Voss got out of Sable Point before we arrived, but his money did not. Everything he earns passes through one private bank, and he keeps a deposit box in its vault.',
    'Photograph his account file in the manager\'s office, then empty the box. The duty manager carries the red vault card: navy coat, red cap, in his office behind the security room. The blue card for that office is kept in the counting room.',
    'One warning. If the alarm sounds, the vault goes onto a time lock and seals. You will have a couple of minutes to reach the box, no more.',
    'Leave by the front door onto the side street.',
  ],
  signoff: 'Director Hale, the Lantern Office',

  map: MAP,
  startYaw: 0,
  menuCam: [20, 13],
  exitName: 'Side street',
  exitTex: 'exitDoors',
  debrief: 'The box held a consignment note: a sealed wagon on tonight\'s mail train out of Kessler Junction.',

  radio: {
    start: [
      ['HALE: You are in the alley behind the bank. The staff door is on your right.', 1.2],
      ['HALE: Keep the alarm quiet. If it sounds, the vault seals on a timer.', 6.5],
    ],
    alarm: 'HALE: The bank has called its response team. They will come in from the alley.',
    exitOpen: 'HALE: That is everything. Front door, north-west corner of the banking hall, then the side street.',
    doorBlue: "HALE: The manager's office takes a blue card. It is kept in the counting room, south-east corner.",
    doorRed: 'HALE: The vault takes the red card. The duty manager has it: navy coat, red cap, in his office.',
    keyBlue: "HALE: Blue card. The manager's office is north of the security room.",
    keyRed: 'HALE: Red card. The vault door is in the middle of the north wall of the banking hall.',
  },

  // The alarm starts this clock; emptying the box stops it.
  countdown: {
    on: 'alarm',
    until: 'box',
    seconds: [170, 140, 115],
    label: 'TIME LOCK',
    radio: 'HALE: The vault is on its time lock. Get to the box before it seals.',
    stopped: 'The box is out. The time lock no longer matters.',
    fail: 'The time lock sealed the vault with the box still inside.',
  },

  zones: [
    { name: 'Side street', c0: 1, r0: 1, c1: 11, r1: 6, floor: 'asphalt', wall: 'brick', ceil: false, prop: 'crate' },
    { name: 'Vault', c0: 13, r0: 1, c1: 27, r1: 6, floor: 'grate', wall: 'vault', ceil: true, prop: 'deposit' },
    { name: "Manager's office", c0: 29, r0: 1, c1: 38, r1: 6, floor: 'carpet', wall: 'office', ceil: true, prop: 'desk', propTall: 'shelf' },
    { name: 'Wire room', c0: 1, r0: 8, c1: 8, r1: 18, floor: 'tile', wall: 'panel', ceil: true, prop: 'desk', propTall: 'rack' },
    { name: 'Banking hall', c0: 10, r0: 8, c1: 29, r1: 18, floor: 'marble', wall: 'plaster', ceil: true, prop: 'plinth' },
    { name: 'Security room', c0: 31, r0: 8, c1: 38, r1: 18, floor: 'tile', wall: 'security', ceil: true, prop: 'desk', propTall: 'rack' },
    { name: 'Alley', c0: 1, r0: 20, c1: 9, r1: 26, floor: 'cobble', wall: 'brick', ceil: false, prop: 'crate' },
    { name: 'Back office', c0: 11, r0: 20, c1: 23, r1: 26, floor: 'carpet', wall: 'office', ceil: true, prop: 'desk', propTall: 'shelf' },
    { name: 'Counting room', c0: 25, r0: 20, c1: 38, r1: 26, floor: 'concrete', wall: 'metal', ceil: true, prop: 'desk', propTall: 'deposit' },
  ],
  defaultZone: { name: 'Doorway', floor: 'tile', wall: 'trim', ceil: true, prop: 'crate' },

  lights: [
    { c: 5, r: 23, color: 0x6f8fd0, i: 0.5, rad: 12 },
    { c: 9, r: 22, color: 0xffb060, i: 0.8, rad: 7 },
    { c: 14, r: 22, color: 0xfff2c8, i: 0.9, rad: 10 },
    { c: 21, r: 25, color: 0xfff2c8, i: 0.8, rad: 9 },
    { c: 29, r: 22, color: 0xbfd8ff, i: 0.9, rad: 10 },
    { c: 36, r: 24, color: 0xbfd8ff, i: 0.8, rad: 9 },
    // The hall is lit over the counters; the edges are dim.
    { c: 15, r: 13, color: 0xffe2b0, i: 0.9, rad: 9 },
    { c: 24, r: 13, color: 0xffe2b0, i: 0.9, rad: 9 },
    { c: 20, r: 9, color: 0xffe2b0, i: 0.7, rad: 8 },
    { c: 20, r: 18, color: 0xffe2b0, i: 0.6, rad: 8 },
    { c: 4, r: 10, color: 0x9fd8ff, i: 0.8, rad: 9 },
    { c: 4, r: 17, color: 0x9fd8ff, i: 0.7, rad: 9 },
    { c: 35, r: 10, color: 0xbfd8ff, i: 1.0, rad: 10 },
    { c: 34, r: 16, color: 0xbfd8ff, i: 0.7, rad: 8 },
    { c: 33, r: 3, color: 0xffe2b0, i: 1.0, rad: 10 },
    { c: 20, r: 3, color: 0x60d8ff, i: 0.9, rad: 12 },
    { c: 14, r: 5, color: 0x60d8ff, i: 0.5, rad: 7 },
    { c: 6, r: 3, color: 0x6f8fd0, i: 0.55, rad: 13 },
    { c: 11, r: 5, color: 0xffb060, i: 0.7, rad: 6 },
  ],

  // facing: 0 = south, PI/2 = east, PI = north, -PI/2 = west
  guards: [
    { type: 'guard', patrol: [[12, 20], [22, 20], [22, 26], [12, 26]] },
    { type: 'guard', patrol: [[17, 23]], facing: Math.PI / 2 },
    { type: 'guard', patrol: [[26, 22], [37, 22]], runner: true },
    { type: 'guard', patrol: [[31, 24]], facing: Math.PI },
    { type: 'guard', patrol: [[31, 8], [38, 8], [38, 18], [31, 18]] },
    { type: 'guard', patrol: [[36, 12]], facing: -Math.PI / 2, runner: true },
    { type: 'officer', patrol: [[30, 3], [37, 3], [37, 5], [30, 5]], drops: 'keyRed' },
    { type: 'guard', patrol: [[10, 8], [29, 8], [29, 18], [10, 18]], runner: true },
    { type: 'guard', patrol: [[13, 12], [26, 12], [26, 14], [13, 14]] },
    { type: 'guard', patrol: [[20, 9]], facing: 0 },
    { type: 'guard', patrol: [[11, 10]], facing: Math.PI / 2 },
    { type: 'guard', patrol: [[1, 8], [8, 8], [8, 18], [1, 18]] },
    { type: 'guard', patrol: [[13, 1], [27, 1], [27, 6], [13, 6]] },
    { type: 'heavy', patrol: [[20, 3]], facing: 0 },
    { type: 'guard', patrol: [[5, 1], [10, 1], [10, 6], [5, 6]] },
  ],

  cameras: [
    { c: 29, r: 8, ox: 0.8, oz: -0.8, yaw: -Math.PI / 4, sweep: 0.6, range: 17 },
    { c: 10, r: 18, ox: -0.8, oz: 0.8, yaw: Math.PI * 0.75, sweep: 0.6, range: 17 },
    { c: 27, r: 1, ox: 0.8, oz: -0.8, yaw: -Math.PI / 4, sweep: 0.5, range: 13 },
    { c: 38, r: 20, ox: 0.8, oz: -0.8, yaw: -Math.PI / 4, sweep: 0.5, range: 12 },
  ],

  panels: [
    { c: 10, r: 10, side: 'w' },
    { c: 29, r: 11, side: 'e' },
    { c: 11, r: 25, side: 'w' },
    { c: 31, r: 16, side: 'w' },
    { c: 13, r: 3, side: 'w' },
  ],

  pickups: [
    { kind: 'grenade', c: 25, r: 26 },
    { kind: 'keyBlue', c: 38, r: 26 },
    { kind: 'armor', c: 9, r: 26 },
    { kind: 'armor', c: 38, r: 1 },
    { kind: 'armor', c: 1, r: 18 },
    { kind: 'ammoPistol', c: 1, r: 20 },
    { kind: 'ammoPistol', c: 23, r: 26 },
    { kind: 'ammoPistol', c: 29, r: 18 },
    { kind: 'ammoPistol', c: 13, r: 6 },
    { kind: 'ammoSmg', c: 38, r: 18 },
  ],

  interactables: [
    { id: 'accounts', kind: 'photo', objective: 'accounts', c: 31, r: 3, side: 'n', style: 'papers', hold: 1.5, label: "Photograph Voss's account file" },
    { id: 'box', kind: 'use', objective: 'box', c: 16, r: 1, side: 'n', style: 'safe', hold: 3, label: 'Open deposit box 44' },
    { id: 'wire', kind: 'plant', objective: 'wire', c: 1, r: 12, side: 'w', style: 'tag', hold: 2.5, label: 'Fit the tap to the wire terminal' },
    {
      id: 'archive', kind: 'download', objective: 'archive', c: 5, r: 18, side: 's', style: 'console', hold: 1.2,
      label: 'Copy the transfer archive', time: 12,
      progress: 'COPYING TRANSFER ARCHIVE', lost: 'SIGNAL LOST. RETURN TO THE WIRE ROOM',
      radio: 'HALE: Copy is running. Stay in the wire room until it finishes.',
      company: 'HALE: That terminal reports to the security desk. Someone is coming.',
    },
    { id: 'breaker', kind: 'breaker', objective: 'grid', c: 38, r: 10, side: 'e', style: 'breaker', hold: 1.8, label: 'Cut the alarm grid' },
  ],

  objectives: [
    { id: 'wire', min: 1, text: 'Tap the wire room terminal' },
    { id: 'archive', min: 2, text: 'Copy the transfer archive' },
    { id: 'accounts', min: 0, text: "Photograph Voss's account file" },
    { id: 'box', min: 0, text: 'Empty his deposit box in the vault' },
    { id: 'extract', min: 0, text: 'Leave by the side street' },
  ],

  reinforce: [[1, 20], [3, 20], [1, 23], [6, 26]],
};
