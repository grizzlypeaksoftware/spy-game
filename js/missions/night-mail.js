// Operation Night Mail: the marshalling yard.
//
// Map legend
//   #  wall            .  floor
//   c  low cover       C  tall block
//   D  door            1  blue keycard door     2  red keycard door
//   P  player start    X  extraction point
const MAP = [
  '########################################', //  0
  '#.........#.......X.......#............#', //  1
  '#.cc...C..#.CC..CC...CC.c.#.cc....cc...#', //  2
  '#.........#.CC..CC...CC...#............#', //  3
  '#...cc....#...............#....C.......#', //  4
  '#.........#...cc....CC....#.cc.....cc..#', //  5
  '#.C....c..#.C.......CC..c.#............#', //  6
  '#.........#...............#............#', //  7
  '#####1########D#######D#########2#######', //  8
  '#......................................#', //  9
  '#..c..........c...........c........c...#', // 10
  '#...CCCCC..CCCCC...CCCCC....CCCCC..CC..#', // 11
  '#......................................#', // 12
  '#.c......cc.........c.........cc.......#', // 13
  '#......................................#', // 14
  '#..CCCCC...CCCCC..CCCCC...CCCCC...CCC..#', // 15
  '#..........c............c..............#', // 16
  '#......................................#', // 17
  '######D#########D#######D########D######', // 18
  '#..........#................#..........#', // 19
  '#..CC......#.CCCC......CCCC.#.cc...cc..#', // 20
  '#..CC...c..#.CCCC..cc..CCCC.#..........#', // 21
  '#..........D................#....C.....#', // 22
  '#....c.....#................D..........#', // 23
  '#.......CC.#.CCCC..cc..CCCC.#.cc...cc..#', // 24
  '#.P.....CC.#.CCCC......CCCC.#..........#', // 25
  '#..........#................#..........#', // 26
  '########################################', // 27
];

export default {
  id: 'night-mail',
  codename: 'NIGHT MAIL',
  location: 'Kessler Junction marshalling yard, east of Vellmark',
  time: '03:10 local',
  briefing: [
    'The consignment note puts Voss\'s finished units in a sealed wagon on tonight\'s mail train. We do not want the wagon. We want to know where it goes.',
    'Fix a tracker to it before the train leaves. The wagon stands at the east end of the yard on the northern track, and the clock is already running.',
    'After that, photograph the waybill in the yardmaster\'s office. The yardmaster carries its red card: navy coat, red cap, in the goods shed. A blue card for the signal box is kept in the engine shed.',
    'Leave by the north gate of the goods shed.',
  ],
  signoff: 'Director Hale, the Lantern Office',

  map: MAP,
  startYaw: 0,
  menuCam: [19, 13],
  exitName: 'North gate',
  debrief: 'The tracker rode the wagon into the mountains and stopped at a relay station on Karst Ridge.',

  radio: {
    start: [
      ['HALE: You are on the embankment south of the yard. The train leaves in a few minutes.', 1.2],
      ['HALE: The wagon is at the east end, northern track. Tracker first, everything else after.', 6.5],
    ],
    alarm: 'HALE: The railway police are on their way. They will come up the embankment.',
    exitOpen: 'HALE: Good. The north gate is at the back of the goods shed.',
    doorBlue: 'HALE: The signal box takes a blue card. There is one in the engine shed, south side of the yard.',
    doorRed: "HALE: The yardmaster's office. He carries the red card: navy coat, red cap, in the goods shed.",
    keyBlue: 'HALE: Blue card. The signal box is at the north-west corner of the yard.',
    keyRed: "HALE: Red card. The yardmaster's office is at the north-east corner of the yard.",
  },

  // The train leaves on time unless the tracker is already on the wagon.
  countdown: {
    on: 'start',
    until: 'tracker',
    seconds: [300, 250, 210],
    label: 'DEPARTURE',
    stopped: 'The tracker is riding with the wagon.',
    fail: 'The mail train left without the tracker.',
  },

  zones: [
    { name: 'Signal box', c0: 1, r0: 1, c1: 9, r1: 7, floor: 'plank', wall: 'panel', ceil: true, prop: 'desk', propTall: 'machine' },
    { name: 'Goods shed', c0: 11, r0: 1, c1: 25, r1: 7, floor: 'concrete', wall: 'brick', ceil: true, prop: 'crate' },
    { name: "Yardmaster's office", c0: 27, r0: 1, c1: 38, r1: 7, floor: 'carpet', wall: 'office', ceil: true, prop: 'desk', propTall: 'shelf' },
    { name: 'Marshalling yard', c0: 1, r0: 9, c1: 38, r1: 17, floor: 'ballast', wall: 'brick', ceil: false, prop: 'crate', propTall: 'wagon' },
    { name: 'Embankment', c0: 1, r0: 19, c1: 10, r1: 26, floor: 'gravel', wall: 'rust', ceil: false, prop: 'crate' },
    { name: 'Engine shed', c0: 12, r0: 19, c1: 27, r1: 26, floor: 'grate', wall: 'metal', ceil: true, prop: 'machine', propTall: 'wagon' },
    { name: 'Mail office', c0: 29, r0: 19, c1: 38, r1: 26, floor: 'tile', wall: 'panel', ceil: true, prop: 'desk', propTall: 'rack' },
  ],
  defaultZone: { name: 'Doorway', floor: 'concrete', wall: 'trim', ceil: true, prop: 'crate' },

  lights: [
    { c: 5, r: 24, color: 0x6f8fd0, i: 0.5, rad: 13 },
    { c: 6, r: 19, color: 0xffb060, i: 0.7, rad: 6 },
    // Yard lamps stand between the tracks; the wagons throw long shadows.
    { c: 6, r: 13, color: 0xdfe8ff, i: 0.9, rad: 10 },
    { c: 16, r: 13, color: 0xdfe8ff, i: 0.9, rad: 10 },
    { c: 27, r: 13, color: 0xdfe8ff, i: 0.9, rad: 10 },
    { c: 36, r: 13, color: 0xdfe8ff, i: 0.8, rad: 9 },
    { c: 20, r: 9, color: 0xffb060, i: 0.6, rad: 8 },
    { c: 20, r: 17, color: 0xffb060, i: 0.6, rad: 8 },
    { c: 5, r: 3, color: 0xffe2b0, i: 0.9, rad: 9 },
    { c: 4, r: 6, color: 0xffe2b0, i: 0.6, rad: 7 },
    { c: 14, r: 4, color: 0xfff2c8, i: 0.9, rad: 10 },
    { c: 22, r: 4, color: 0xfff2c8, i: 0.9, rad: 10 },
    { c: 32, r: 3, color: 0xffe2b0, i: 1.0, rad: 11 },
    { c: 36, r: 6, color: 0xffe2b0, i: 0.6, rad: 7 },
    { c: 19, r: 22, color: 0xfff2c8, i: 1.0, rad: 12 },
    { c: 13, r: 26, color: 0xfff2c8, i: 0.6, rad: 8 },
    { c: 26, r: 19, color: 0xfff2c8, i: 0.6, rad: 8 },
    { c: 34, r: 22, color: 0xbfd8ff, i: 1.0, rad: 10 },
    { c: 36, r: 26, color: 0xbfd8ff, i: 0.6, rad: 7 },
  ],

  // facing: 0 = south, PI/2 = east, PI = north, -PI/2 = west
  guards: [
    { type: 'guard', patrol: [[1, 9], [38, 9]], runner: true },
    { type: 'guard', patrol: [[38, 17], [1, 17]] },
    { type: 'guard', patrol: [[2, 12], [37, 12], [37, 14], [2, 14]] },
    { type: 'guard', patrol: [[22, 13]], facing: -Math.PI / 2 },
    { type: 'guard', patrol: [[33, 12]], facing: -Math.PI / 2, runner: true },
    { type: 'guard', patrol: [[12, 22], [27, 22], [27, 23], [12, 23]] },
    { type: 'guard', patrol: [[19, 19]], facing: 0 },
    { type: 'guard', patrol: [[29, 21], [38, 21], [38, 25], [29, 25]] },
    { type: 'guard', patrol: [[33, 23]], facing: -Math.PI / 2, runner: true },
    { type: 'officer', patrol: [[13, 4], [23, 4], [23, 7], [13, 7]], drops: 'keyRed' },
    { type: 'guard', patrol: [[11, 1], [25, 1], [25, 7], [11, 7]] },
    { type: 'guard', patrol: [[18, 4]], facing: 0 },
    { type: 'guard', patrol: [[1, 1], [9, 1], [9, 7], [1, 7]] },
    { type: 'guard', patrol: [[5, 3]], facing: 0 },
    { type: 'guard', patrol: [[27, 6], [38, 6], [38, 1], [27, 1]] },
    { type: 'heavy', patrol: [[33, 4]], facing: 0 },
  ],

  cameras: [
    { c: 38, r: 9, ox: 0.8, oz: -0.8, yaw: -Math.PI / 4, sweep: 0.6, range: 17 },
    { c: 1, r: 17, ox: -0.8, oz: 0.8, yaw: Math.PI * 0.75, sweep: 0.6, range: 17 },
    { c: 27, r: 19, ox: 0.8, oz: -0.8, yaw: -Math.PI / 4, sweep: 0.5, range: 13 },
    { c: 38, r: 1, ox: 0.8, oz: -0.8, yaw: -Math.PI / 4, sweep: 0.4, range: 11 },
    { c: 11, r: 1, ox: -0.8, oz: -0.8, yaw: Math.PI / 4, sweep: 0.5, range: 13 },
  ],

  panels: [
    { c: 1, r: 13, side: 'w' },
    { c: 38, r: 13, side: 'e' },
    { c: 12, r: 20, side: 'w' },
    { c: 29, r: 26, side: 'w' },
    { c: 11, r: 4, side: 'w' },
  ],

  pickups: [
    { kind: 'shotgun', c: 27, r: 22 },
    { kind: 'ammoShells', c: 12, r: 19 },
    { kind: 'grenade', c: 29, r: 19 },
    { kind: 'keyBlue', c: 12, r: 26 },
    { kind: 'armor', c: 10, r: 26 },
    { kind: 'armor', c: 38, r: 17 },
    { kind: 'armor', c: 25, r: 7 },
    { kind: 'ammoPistol', c: 1, r: 19 },
    { kind: 'ammoPistol', c: 1, r: 9 },
    { kind: 'ammoPistol', c: 27, r: 26 },
    { kind: 'ammoPistol', c: 38, r: 26 },
    { kind: 'ammoSmg', c: 9, r: 1 },
    { kind: 'ammoSmg', c: 38, r: 7 },
  ],

  interactables: [
    { id: 'tracker', kind: 'plant', objective: 'tracker', c: 30, r: 12, side: 'n', style: 'tag', hold: 2.5, label: 'Fix the tracker to the sealed wagon' },
    { id: 'waybill', kind: 'photo', objective: 'waybill', c: 28, r: 3, side: 'n', style: 'papers', hold: 1.5, label: 'Photograph the waybill' },
    { id: 'points', kind: 'use', objective: 'points', c: 1, r: 4, side: 'w', style: 'console', hold: 3, label: 'Set the points for the slow line' },
    {
      id: 'manifest', kind: 'download', objective: 'manifest', c: 38, r: 22, side: 'e', style: 'console', hold: 1.2,
      label: 'Copy the freight manifests', time: 12,
      progress: 'COPYING MANIFESTS', lost: 'SIGNAL LOST. RETURN TO THE MAIL OFFICE',
      radio: 'HALE: Copy is running. Stay in the mail office until it finishes.',
      company: 'HALE: The dispatcher has noticed the terminal. Expect a visit.',
    },
    { id: 'breaker', kind: 'breaker', objective: 'grid', c: 27, r: 26, side: 'e', style: 'breaker', hold: 1.8, label: 'Cut the alarm grid' },
  ],

  objectives: [
    { id: 'tracker', min: 0, text: 'Fix a tracker to the sealed wagon' },
    { id: 'points', min: 1, text: 'Set the points in the signal box' },
    { id: 'manifest', min: 2, text: 'Copy the manifests in the mail office' },
    { id: 'waybill', min: 0, text: "Photograph the yardmaster's waybill" },
    { id: 'extract', min: 0, text: 'Leave by the north gate' },
  ],

  reinforce: [[1, 26], [4, 26], [1, 22], [6, 23]],
};
