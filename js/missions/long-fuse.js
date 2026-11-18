// Operation Long Fuse: the coastal battery.
//
// Map legend
//   #  wall            .  floor
//   c  low cover       C  tall block
//   D  door            1  blue keycard door     2  red keycard door
//   P  player start    X  extraction point
const MAP = [
  '########################################', //  0
  '#............#............#............#', //  1
  '#.cc..cc..cc.#.cccc..cccc.#..CC....CC..#', //  2
  '#............#............#..CC....CC..#', //  3
  '#.cc..cc..C..#............#..CC....CC..#', //  4
  '#............#.cc......cc.#............#', //  5
  '#...C........#............#.....c......#', //  6
  '#........cc..#.....CC.....#............#', //  7
  '#............#............#..c......c..#', //  8
  '######D#######.cc......cc.#............#', //  9
  '#............#............#.....CC.....#', // 10
  '#.CC.CC.CC...#............#.....CC.....#', // 11
  '#.CC.CC.CC...######2#######.....CC.....#', // 12
  '#............#............#............#', // 13
  '#............#.CC..CC..CC.#..c......c..#', // 14
  '#.CC.CC.c....D............1............#', // 15
  '#.CC.CC......#.CC..CC..CC.#......c.....#', // 16
  '#............#............#............#', // 17
  '######D#######............######1#######', // 18
  '#............######D#######............#', // 19
  '#..CC....c...#............#..c.....CC..#', // 20
  '#..CC........#.CCC....cc..#........CC..#', // 21
  '#............#.CCC........#............#', // 22
  '#.....c......D............D............#', // 23
  '#........CC..#....cc..CCC.#..CC........#', // 24
  '#.P......CC..#........CCC.#..CC.....X..#', // 25
  '#............#............#............#', // 26
  '########################################', // 27
];

export default {
  id: 'long-fuse',
  codename: 'LONG FUSE',
  location: 'Tern Rock coastal battery, off Cape Arden',
  time: '04:40 local',
  briefing: [
    'Voss is not waiting for his buyers. The demonstration is tonight, from the old battery on Tern Rock, and the first round is aimed at the harbour at Vellmark. The launch clock is already running.',
    'Get into the control bunker and abort the launch. The launch officer carries its red card: navy coat, red cap, out on the apron. The apron takes a blue card, kept in the crew quarters.',
    'Once the launch is stopped, set charges on all three launch rails. They run on a short fuse, as before.',
    'A helicopter will hold off the pad south of the apron for as long as it can.',
  ],
  signoff: 'Director Hale, the Lantern Office',

  map: MAP,
  startYaw: 0,
  menuCam: [32, 7],
  exitName: 'Helicopter pad',
  sky: 0x0a0f18,
  debrief: 'Tern Rock is gone and the harbour never knew. Voss watched it from his estate on Cape Arden.',

  radio: {
    start: [
      ['HALE: You are on the landing at the south-west corner. The launch clock is running. Move.', 1.2],
      ['HALE: Blue card from the crew quarters, red card from the officer on the apron, then the bunker.', 6.5],
    ],
    alarm: 'HALE: The garrison is turning out. Their boat is coming round to the landing.',
    exitOpen: 'HALE: That is all of it. Helicopter pad, south end of the apron. Run.',
    doorBlue: 'HALE: The apron takes a blue card. It is in the crew quarters, north-west corner.',
    doorRed: 'HALE: Control bunker. The launch officer has the red card: navy coat, red cap, on the apron.',
    keyBlue: 'HALE: Blue card. The apron door is on the east side of the fuel store.',
    keyRed: 'HALE: Red card. The bunker door is on the north side of the fuel store.',
  },

  // Two clocks: the launch runs from the start until it is aborted, and the
  // charges start their own once all three are set.
  countdown: [
    {
      on: 'start', until: 'abort',
      seconds: [480, 400, 340],
      label: 'LAUNCH',
      stopped: 'Launch aborted. The rails are still armed.',
      fail: 'The launch went ahead.',
    },
    {
      after: 'charges',
      seconds: [130, 110, 95],
      label: 'DETONATION',
      radio: 'HALE: Charges are live. Get to the pad.',
      fail: 'The charges went off with you still on the rock.',
    },
  ],

  zones: [
    { name: 'Crew quarters', c0: 1, r0: 1, c1: 12, r1: 8, floor: 'concrete', wall: 'bunker', ceil: true, prop: 'crate' },
    { name: 'Magazine', c0: 1, r0: 10, c1: 12, r1: 17, floor: 'grate', wall: 'bunker', ceil: true, prop: 'crate', propTall: 'hull' },
    { name: 'Landing', c0: 1, r0: 19, c1: 12, r1: 26, floor: 'plank', wall: 'rock', ceil: false, prop: 'crate' },
    { name: 'Control bunker', c0: 14, r0: 1, c1: 25, r1: 11, floor: 'tile', wall: 'security', ceil: true, prop: 'desk', propTall: 'rack' },
    { name: 'Fuel store', c0: 14, r0: 13, c1: 25, r1: 18, floor: 'grate', wall: 'metal', ceil: true, prop: 'machine', propTall: 'tank' },
    { name: 'Assembly hall', c0: 14, r0: 20, c1: 25, r1: 26, floor: 'concrete', wall: 'metal', ceil: true, prop: 'machine' },
    { name: 'Launch apron', c0: 27, r0: 1, c1: 38, r1: 17, floor: 'deck', wall: 'bunker', ceil: false, prop: 'crate', propTall: 'rail' },
    { name: 'Helicopter pad', c0: 27, r0: 19, c1: 38, r1: 26, floor: 'deck', wall: 'rock', ceil: false, prop: 'crate' },
  ],
  defaultZone: { name: 'Doorway', floor: 'concrete', wall: 'trim', ceil: true, prop: 'crate' },

  lights: [
    { c: 5, r: 23, color: 0x6f8fd0, i: 0.5, rad: 13 },
    { c: 6, r: 19, color: 0xffb060, i: 0.7, rad: 6 },
    { c: 4, r: 13, color: 0xffb060, i: 0.8, rad: 10 },
    { c: 10, r: 14, color: 0xffb060, i: 0.6, rad: 8 },
    { c: 4, r: 5, color: 0xffe2b0, i: 0.8, rad: 10 },
    { c: 10, r: 3, color: 0xffe2b0, i: 0.7, rad: 8 },
    { c: 19, r: 3, color: 0xbfd8ff, i: 1.0, rad: 11 },
    { c: 19, r: 10, color: 0xbfd8ff, i: 0.7, rad: 9 },
    { c: 19, r: 15, color: 0xffb060, i: 0.8, rad: 10 },
    { c: 19, r: 23, color: 0xfff2c8, i: 1.0, rad: 11 },
    { c: 24, r: 20, color: 0xfff2c8, i: 0.6, rad: 7 },
    // Floodlights on the rails.
    { c: 31, r: 3, color: 0xe6f0ff, i: 1.0, rad: 9 },
    { c: 34, r: 3, color: 0xe6f0ff, i: 1.0, rad: 9 },
    { c: 32, r: 13, color: 0xe6f0ff, i: 1.0, rad: 9 },
    { c: 28, r: 15, color: 0xffb060, i: 0.6, rad: 7 },
    { c: 32, r: 22, color: 0xff7060, i: 0.7, rad: 10 },
    { c: 36, r: 24, color: 0xff7060, i: 0.6, rad: 7 },
  ],

  // facing: 0 = south, PI/2 = east, PI = north, -PI/2 = west
  guards: [
    { type: 'guard', patrol: [[10, 19]], facing: Math.PI },
    { type: 'guard', patrol: [[1, 13], [12, 13], [12, 14], [1, 14]] },
    { type: 'guard', patrol: [[10, 11]], facing: -Math.PI / 2 },
    { type: 'guard', patrol: [[1, 1], [12, 1], [12, 8], [1, 8]] },
    { type: 'guard', patrol: [[6, 5]], facing: 0 },
    { type: 'guard', patrol: [[1, 3], [12, 3], [12, 5], [1, 5]] },
    { type: 'heavy', patrol: [[19, 4]], facing: 0 },
    { type: 'guard', patrol: [[14, 1], [25, 1], [25, 11], [14, 11]] },
    { type: 'guard', patrol: [[22, 10]], facing: -Math.PI / 2 },
    { type: 'guard', patrol: [[14, 13], [25, 13], [25, 18], [14, 18]], runner: true },
    { type: 'guard', patrol: [[14, 20], [25, 20], [25, 26], [14, 26]] },
    { type: 'guard', patrol: [[20, 23]], facing: -Math.PI / 2 },
    { type: 'officer', patrol: [[28, 7], [37, 7], [37, 9], [28, 9]], drops: 'keyRed' },
    { type: 'guard', patrol: [[27, 1], [38, 1], [38, 17], [27, 17]], runner: true },
    { type: 'guard', patrol: [[32, 5]], facing: 0 },
    { type: 'guard', patrol: [[34, 15]], facing: -Math.PI / 2 },
    { type: 'guard', patrol: [[31, 13], [31, 5], [34, 5], [34, 13]] },
    { type: 'guard', patrol: [[27, 19], [38, 19], [38, 22], [27, 22]] },
    { type: 'heavy', patrol: [[33, 24]], facing: Math.PI },
  ],

  cameras: [
    { c: 38, r: 1, ox: 0.8, oz: -0.8, yaw: -Math.PI / 4, sweep: 0.6, range: 17 },
    { c: 27, r: 17, ox: -0.8, oz: 0.8, yaw: Math.PI * 0.75, sweep: 0.6, range: 17 },
    { c: 25, r: 1, ox: 0.8, oz: -0.8, yaw: -Math.PI / 4, sweep: 0.5, range: 12 },
    { c: 14, r: 26, ox: -0.8, oz: 0.8, yaw: Math.PI * 0.75, sweep: 0.5, range: 12 },
    { c: 12, r: 10, ox: 0.8, oz: -0.8, yaw: -Math.PI / 4, sweep: 0.5, range: 12 },
  ],

  panels: [
    { c: 27, r: 10, side: 'w' },
    { c: 38, r: 12, side: 'e' },
    { c: 14, r: 3, side: 'w' },
    { c: 14, r: 22, side: 'w' },
    { c: 1, r: 3, side: 'w' },
  ],

  pickups: [
    { kind: 'rifle', c: 1, r: 1 },
    { kind: 'ammoRifle', c: 12, r: 10 },
    { kind: 'grenade', c: 25, r: 13 },
    { kind: 'grenade', c: 14, r: 20 },
    { kind: 'keyBlue', c: 12, r: 1 },
    { kind: 'armor', c: 12, r: 26 },
    { kind: 'armor', c: 1, r: 17 },
    { kind: 'armor', c: 25, r: 11 },
    { kind: 'armor', c: 27, r: 26 },
    { kind: 'armor', c: 38, r: 17 },
    { kind: 'ammoPistol', c: 1, r: 19 },
    { kind: 'ammoPistol', c: 1, r: 8 },
    { kind: 'ammoPistol', c: 14, r: 18 },
    { kind: 'ammoPistol', c: 27, r: 1 },
    { kind: 'ammoSmg', c: 25, r: 26 },
    { kind: 'ammoSmg', c: 14, r: 11 },
  ],

  interactables: [
    { id: 'abort', kind: 'use', objective: 'abort', c: 19, r: 1, side: 'n', style: 'console', hold: 3, label: 'Abort the launch' },
    { id: 'charge1', kind: 'plant', objective: 'charges', c: 28, r: 3, side: 'e', style: 'charge', hold: 2.2, label: 'Set a charge on the launch rail' },
    { id: 'charge2', kind: 'plant', objective: 'charges', c: 37, r: 3, side: 'w', style: 'charge', hold: 2.2, label: 'Set a charge on the launch rail' },
    { id: 'charge3', kind: 'plant', objective: 'charges', c: 32, r: 13, side: 'n', style: 'charge', hold: 2.2, label: 'Set a charge on the launch rail' },
    { id: 'orders', kind: 'photo', objective: 'orders', c: 2, r: 3, side: 'n', style: 'papers', hold: 1.5, label: 'Photograph the launch orders' },
    {
      id: 'telemetry', kind: 'download', objective: 'telemetry', c: 25, r: 6, side: 'e', style: 'console', hold: 1.2,
      label: 'Copy the targeting telemetry', time: 12,
      progress: 'COPYING TELEMETRY', lost: 'SIGNAL LOST. RETURN TO THE BUNKER',
      radio: 'HALE: Copy is running. Stay in the bunker until it finishes.',
      company: 'HALE: The bunker has reported the copy. They are sending men.',
    },
    { id: 'breaker', kind: 'breaker', objective: 'grid', c: 1, r: 13, side: 'w', style: 'breaker', hold: 1.8, label: 'Cut the alarm grid' },
  ],

  objectives: [
    { id: 'orders', min: 1, text: 'Photograph the launch orders' },
    { id: 'telemetry', min: 2, text: 'Copy the bunker targeting telemetry' },
    { id: 'abort', min: 0, text: 'Abort the launch from the control bunker' },
    { id: 'charges', min: 0, text: 'Set charges on the three launch rails' },
    { id: 'extract', min: 0, text: 'Reach the helicopter pad' },
  ],

  reinforce: [[1, 26], [4, 26], [1, 22], [6, 26]],
};
