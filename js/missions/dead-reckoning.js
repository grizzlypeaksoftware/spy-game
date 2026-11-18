// Operation Dead Reckoning: the breaking yard.
//
// Map legend
//   #  wall            .  floor
//   c  low cover       C  tall block
//   D  door            1  blue keycard door     2  red keycard door
//   P  player start    X  extraction point
const MAP = [
  '########################################', //  0
  '#..........#................#..........#', //  1
  '#.P..CC....#..CCC.....cc....#.cc....cc.#', //  2
  '#....CC..c.#..CCC...........#..........#', //  3
  '#..........D.........CC.....#.cc....cc.#', //  4
  '#..c.......#...c.....CC...c.D..........#', //  5
  '#......CC..#................#.cc....C..#', //  6
  '#..cc..CC..#.....CCCC.......#.......C..#', //  7
  '#..........#.............C..#..........#', //  8
  '#####D######..cc.........C..#####D######', //  9
  '#..........#................#..........#', // 10
  '#.CC....c..#.......cc.......D..cc..cc..#', // 11
  '#.CC.......#................#..........#', // 12
  '#......CC..#####1############..cc..cc..#', // 13
  '#......CC..#................#..........#', // 14
  '#..........#..CC....CC......#.c......c.#', // 15
  '#.c........1..CC....CC...cc.#..........#', // 16
  '#....cc....#................#..........#', // 17
  '#..........#......cc........#####2######', // 18
  '############..............C.#..........#', // 19
  '#..........#..CC....CC....C.#..........#', // 20
  '#..cc......#..CC....CC......#...cc.....#', // 21
  '#......C...#................#..........#', // 22
  '#......C...D.....cc.....cc..#.C......C.#', // 23
  '#..........#................#..........#', // 24
  '#X....c....#..cc......CC....#..cc......#', // 25
  '#..........#..........CC....#..........#', // 26
  '########################################', // 27
];

export default {
  id: 'dead-reckoning',
  codename: 'DEAD RECKONING',
  location: 'Sable Point breaking yard, north of Vellmark',
  time: '04:05 local',
  briefing: [
    'Every lot 44 went to one buyer: Voss himself, through a shipbreaking yard at Sable Point. He is not selling stolen guidance units. He is building his own, and the workshop there has three on test.',
    'Take the guidance core from the safe in his office, then set charges on all three test rigs. The charges run on a short fuse, so set them last. A boat is waiting at the slipway behind the workshop.',
    'The workshop takes a blue card, kept in the barracks on the east side of the yard. The yard foreman carries the red card for Voss\'s office: navy coat, red cap, on the workshop floor.',
    'This is his home ground. Expect more men, and better ones.',
  ],
  signoff: 'Director Hale, the Lantern Office',

  map: MAP,
  startYaw: -Math.PI / 2, // facing east
  menuCam: [20, 6],
  exitName: 'Slipway gate',
  debrief: 'Sable Point is burning and the core is on its way home. Voss was not in the yard.',

  radio: {
    start: [
      ['HALE: You are over the fence at the north-west corner. The yard is through the gate to your east.', 1.2],
      ['HALE: Remember, the charges go last. Once they are armed you will be on a clock.', 6.5],
    ],
    alarm: 'HALE: The yard has woken up. More men are coming over from the gatehouse.',
    exitOpen: 'HALE: That is all of it. Slipway, west door of the workshop. The boat is waiting.',
    doorBlue: 'HALE: Blue card for that one. It is kept in the barracks, east side of the yard.',
    doorRed: "HALE: Voss's office. The foreman has the red card: navy coat, red cap, on the workshop floor.",
    keyBlue: 'HALE: Blue card. The workshop door is on the south side of the yard.',
    keyRed: "HALE: Red card. Voss's office is through the drawing office, east of the yard.",
  },

  // Finishing this objective starts the clock. Seconds by difficulty level.
  countdown: {
    after: 'charges',
    seconds: [130, 110, 95],
    label: 'DETONATION',
    radio: 'HALE: Charges are live. Whatever is left, do it now and get to the boat.',
    fail: 'The charges went off with you still inside.',
  },

  zones: [
    { name: 'Scrap lot', c0: 1, r0: 1, c1: 10, r1: 8, floor: 'gravel', wall: 'rust', ceil: false, prop: 'hull' },
    { name: 'Breaking yard', c0: 12, r0: 1, c1: 27, r1: 12, floor: 'gravel', wall: 'rust', ceil: false, prop: 'hull' },
    { name: 'Barracks', c0: 29, r0: 1, c1: 38, r1: 8, floor: 'concrete', wall: 'brick', ceil: true, prop: 'crate' },
    { name: 'Generator shed', c0: 1, r0: 10, c1: 10, r1: 18, floor: 'grate', wall: 'metal', ceil: true, prop: 'machine' },
    { name: 'Drawing office', c0: 29, r0: 10, c1: 38, r1: 17, floor: 'carpet', wall: 'office', ceil: true, prop: 'desk' },
    { name: 'Workshop', c0: 12, r0: 14, c1: 27, r1: 26, floor: 'concrete', wall: 'metal', ceil: true, prop: 'machine' },
    { name: 'Slipway', c0: 1, r0: 20, c1: 10, r1: 26, floor: 'plank', wall: 'rust', ceil: false, prop: 'crate' },
    { name: "Voss's office", c0: 29, r0: 19, c1: 38, r1: 26, floor: 'parquet', wall: 'gallery', ceil: true, prop: 'desk' },
  ],
  defaultZone: { name: 'Doorway', floor: 'concrete', wall: 'trim', ceil: true, prop: 'crate' },

  lights: [
    { c: 5, r: 5, color: 0x6f8fd0, i: 0.5, rad: 13 },
    { c: 10, r: 3, color: 0xffb060, i: 0.7, rad: 7 },
    // Floodlights over the yard leave the corners dark.
    { c: 15, r: 6, color: 0xdfe8ff, i: 1.0, rad: 11 },
    { c: 24, r: 2, color: 0xdfe8ff, i: 0.9, rad: 10 },
    { c: 20, r: 10, color: 0xdfe8ff, i: 0.9, rad: 10 },
    { c: 33, r: 3, color: 0xffe2b0, i: 0.9, rad: 10 },
    { c: 36, r: 8, color: 0xffe2b0, i: 0.5, rad: 7 },
    { c: 5, r: 15, color: 0xffb060, i: 0.8, rad: 10 },
    { c: 6, r: 11, color: 0xffb060, i: 0.6, rad: 8 },
    { c: 33, r: 12, color: 0xffe2b0, i: 1.0, rad: 10 },
    { c: 36, r: 16, color: 0xffe2b0, i: 0.6, rad: 8 },
    { c: 18, r: 17, color: 0xfff2c8, i: 1.0, rad: 12 },
    { c: 24, r: 22, color: 0xfff2c8, i: 1.0, rad: 12 },
    { c: 13, r: 24, color: 0xfff2c8, i: 0.7, rad: 9 },
    { c: 25, r: 14, color: 0xfff2c8, i: 0.7, rad: 9 },
    { c: 5, r: 23, color: 0x6f8fd0, i: 0.55, rad: 13 },
    { c: 2, r: 20, color: 0xffb060, i: 0.6, rad: 7 },
    { c: 33, r: 22, color: 0xffe2b0, i: 1.0, rad: 10 },
    { c: 36, r: 25, color: 0xffe2b0, i: 0.6, rad: 8 },
  ],

  // facing: 0 = south, PI/2 = east, PI = north, -PI/2 = west
  guards: [
    { type: 'guard', patrol: [[10, 1], [10, 8]] },
    { type: 'guard', patrol: [[13, 1], [26, 1], [26, 12], [13, 12]], runner: true },
    { type: 'guard', patrol: [[18, 5], [18, 10], [23, 10], [23, 6]] },
    { type: 'guard', patrol: [[17, 11]], facing: Math.PI },
    { type: 'guard', patrol: [[30, 1], [37, 1], [37, 8], [30, 8]] },
    { type: 'guard', patrol: [[34, 5]], facing: -Math.PI / 2, runner: true },
    { type: 'guard', patrol: [[1, 10], [10, 10], [10, 18], [1, 18]] },
    { type: 'guard', patrol: [[5, 14]], facing: Math.PI },
    { type: 'guard', patrol: [[30, 10], [37, 10], [37, 17], [30, 17]] },
    { type: 'officer', patrol: [[17, 18], [23, 18], [23, 22], [17, 22]], drops: 'keyRed' },
    { type: 'guard', patrol: [[12, 14], [27, 14], [27, 26], [12, 26]], runner: true },
    { type: 'guard', patrol: [[18, 24], [13, 17]] },
    { type: 'guard', patrol: [[24, 17]], facing: 0 },
    { type: 'guard', patrol: [[3, 20], [9, 20], [9, 26], [3, 26]] },
    { type: 'guard', patrol: [[4, 24]], facing: Math.PI / 2 },
    { type: 'heavy', patrol: [[33, 22]], facing: Math.PI },
    { type: 'guard', patrol: [[30, 19], [37, 19], [37, 26], [30, 26]] },
  ],

  cameras: [
    { c: 27, r: 1, ox: 0.8, oz: -0.8, yaw: -Math.PI / 4, sweep: 0.6, range: 17 },
    { c: 12, r: 12, ox: -0.8, oz: 0.8, yaw: Math.PI * 0.75, sweep: 0.5, range: 14 },
    { c: 27, r: 14, ox: 0.8, oz: -0.8, yaw: -Math.PI / 4, sweep: 0.6, range: 16 },
    { c: 38, r: 19, ox: 0.8, oz: -0.8, yaw: -Math.PI / 4, sweep: 0.4, range: 11 },
    { c: 10, r: 20, ox: 0.8, oz: -0.8, yaw: -Math.PI / 4, sweep: 0.5, range: 12 },
  ],

  panels: [
    { c: 12, r: 6, side: 'w' },
    { c: 29, r: 3, side: 'w' },
    { c: 12, r: 20, side: 'w' },
    { c: 27, r: 24, side: 'e' },
    { c: 1, r: 14, side: 'w' },
  ],

  pickups: [
    { kind: 'shotgun', c: 29, r: 1 },
    { kind: 'ammoShells', c: 38, r: 8 },
    { kind: 'grenade', c: 10, r: 18 },
    { kind: 'keyBlue', c: 38, r: 1 },
    { kind: 'armor', c: 1, r: 8 },
    { kind: 'armor', c: 38, r: 17 },
    { kind: 'armor', c: 1, r: 18 },
    { kind: 'armor', c: 27, r: 26 },
    { kind: 'ammoPistol', c: 1, r: 1 },
    { kind: 'ammoPistol', c: 27, r: 12 },
    { kind: 'ammoPistol', c: 38, r: 10 },
    { kind: 'ammoPistol', c: 12, r: 26 },
    { kind: 'ammoSmg', c: 29, r: 8 },
    { kind: 'ammoSmg', c: 10, r: 26 },
  ],

  interactables: [
    { id: 'plans', kind: 'photo', objective: 'plans', c: 32, r: 12, side: 'n', style: 'papers', hold: 1.5, label: 'Photograph the assembly drawings' },
    {
      id: 'clients', kind: 'download', objective: 'clients', c: 33, r: 26, side: 's', style: 'console', hold: 1.2,
      label: "Copy Voss's client list", time: 12,
      progress: 'COPYING CLIENT LIST', lost: 'SIGNAL LOST. RETURN TO THE TERMINAL',
      radio: 'HALE: Copy is running. Stay in the office until it finishes.',
      company: 'HALE: His terminal has phoned home. Expect someone at the door.',
    },
    { id: 'core', kind: 'use', objective: 'core', c: 38, r: 21, side: 'e', style: 'safe', hold: 3, label: 'Open the safe and take the guidance core' },
    { id: 'charge1', kind: 'plant', objective: 'charges', c: 16, r: 15, side: 'w', style: 'charge', hold: 2.2, label: 'Set a charge on the test rig' },
    { id: 'charge2', kind: 'plant', objective: 'charges', c: 22, r: 16, side: 'w', style: 'charge', hold: 2.2, label: 'Set a charge on the test rig' },
    { id: 'charge3', kind: 'plant', objective: 'charges', c: 19, r: 21, side: 'e', style: 'charge', hold: 2.2, label: 'Set a charge on the test rig' },
    { id: 'breaker', kind: 'breaker', objective: 'grid', c: 1, r: 12, side: 'w', style: 'breaker', hold: 1.8, label: 'Cut the alarm grid' },
  ],

  objectives: [
    { id: 'plans', min: 1, text: 'Photograph the assembly drawings' },
    { id: 'clients', min: 2, text: "Copy the client list in Voss's office" },
    { id: 'core', min: 0, text: "Take the guidance core from Voss's safe" },
    { id: 'charges', min: 0, text: 'Set charges on the three test rigs' },
    { id: 'extract', min: 0, text: 'Leave by the boat at the slipway' },
  ],

  reinforce: [[1, 1], [3, 1], [1, 4], [1, 6]],
};
