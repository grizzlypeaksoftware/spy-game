// Operation White Noise: the mountain relay station.
//
// Map legend
//   #  wall            .  floor
//   c  low cover       C  tall block
//   D  door            1  blue keycard door     2  red keycard door
//   P  player start    X  extraction point
const MAP = [
  '########################################', //  0
  '#..........#................#..........#', //  1
  '#.X..CC....#.cc.cc....cc.cc.#.CC....CC.#', //  2
  '#....CC....#................#.CC....CC.#', //  3
  '#..........#.cc.cc....cc.cc.#..........#', //  4
  '#.c....CC..#................#....cc....#', //  5
  '#......CC..#................#.CC....CC.#', //  6
  '#..........########D#########.CC....CC.#', //  7
  '#..CC......#................D..........#', //  8
  '#..CC...c..#..c.........c...############', //  9
  '#..........D................#..........#', // 10
  '#....cc....#...CC......CC...#.cc..cc.C.#', // 11
  '#..........#...CC..c...CC...#..........#', // 12
  '############................#.cc..cc...#', // 13
  '#..........#.c............c.1..........#', // 14
  '#...CC.....#................#.cc..cc...#', // 15
  '#...CC...c.#......cCCc......#..........#', // 16
  '#..........D.......CC.......#...C....c.#', // 17
  '#.c........#..c..........c..#..........#', // 18
  '#..........#................#####2######', // 19
  '#......CC..########D#########..........#', // 20
  '#..c...CC..#................#.C.C..C.C.#', // 21
  '#..........#.cc..cc..cc..CC.#.C.C..C.C.#', // 22
  '#..........#................#..........#', // 23
  '#....c.....D................#...cc.....#', // 24
  '#.P........#.cc..cc..cc..CC.#..........#', // 25
  '#..........#................#..........#', // 26
  '########################################', // 27
];

export default {
  id: 'white-noise',
  codename: 'WHITE NOISE',
  location: 'Karst Ridge relay station, Orlan Mountains',
  time: '05:30 local',
  briefing: [
    'The wagon was unloaded at an old weather station on Karst Ridge. Voss has turned it into a relay: three masts in the compound that will talk to his guidance units in flight.',
    'Cut the feed on all three masts and photograph the codebook in the operations room. Operations takes a blue card, kept in the barracks on the north side.',
    'The station chief carries the red card for the cipher room: navy coat, red cap, in operations.',
    'There is one road down and it starts in the garage. Take a snowcat.',
  ],
  signoff: 'Director Hale, the Lantern Office',

  map: MAP,
  startYaw: 0,
  menuCam: [20, 13],
  exitName: 'Snowcat',
  sky: 0x101821,
  ambient: [0.12, 0.15, 0.19],
  debrief: 'The codebook lists a guest of honour for the first demonstration: Anton Roth, who buys for three armies.',

  radio: {
    start: [
      ['HALE: You are below the station on the south-west slope. The compound gate is up the hill to your east.', 1.2],
      ['HALE: Snow shows up against the dark. Stay behind the drifts.', 6.5],
    ],
    alarm: 'HALE: They have radioed the lower camp. More men are climbing the slope behind you.',
    exitOpen: 'HALE: The relay is dead. Garage, north-west corner. Take a snowcat and go.',
    doorBlue: 'HALE: Operations takes a blue card. It is in the barracks, north side of the compound.',
    doorRed: 'HALE: Cipher room. The station chief has the red card: navy coat, red cap, in operations.',
    keyBlue: 'HALE: Blue card. Operations is the east door of the compound.',
    keyRed: 'HALE: Red card. The cipher room is through the south wall of operations.',
  },

  zones: [
    { name: 'Garage', c0: 1, r0: 1, c1: 10, r1: 12, floor: 'concrete', wall: 'bunker', ceil: true, prop: 'crate', propTall: 'machine' },
    { name: 'Barracks', c0: 12, r0: 1, c1: 27, r1: 6, floor: 'plank', wall: 'bunker', ceil: true, prop: 'crate' },
    { name: 'Generator hall', c0: 29, r0: 1, c1: 38, r1: 8, floor: 'grate', wall: 'metal', ceil: true, prop: 'machine' },
    { name: 'Mast compound', c0: 12, r0: 8, c1: 27, r1: 19, floor: 'snow', wall: 'rock', ceil: false, prop: 'drift', propTall: 'mast' },
    { name: 'Operations', c0: 29, r0: 10, c1: 38, r1: 18, floor: 'tile', wall: 'security', ceil: true, prop: 'desk', propTall: 'rack' },
    { name: 'Cipher room', c0: 29, r0: 20, c1: 38, r1: 26, floor: 'serverFloor', wall: 'server', ceil: true, prop: 'desk', propTall: 'rack' },
    { name: 'Mess hall', c0: 12, r0: 21, c1: 27, r1: 26, floor: 'plank', wall: 'bunker', ceil: true, prop: 'desk', propTall: 'crate' },
    { name: 'South slope', c0: 1, r0: 14, c1: 10, r1: 26, floor: 'snow', wall: 'rock', ceil: false, prop: 'drift' },
  ],
  defaultZone: { name: 'Doorway', floor: 'concrete', wall: 'trim', ceil: true, prop: 'crate' },

  lights: [
    { c: 4, r: 23, color: 0x8fb0e0, i: 0.5, rad: 13 },
    { c: 10, r: 17, color: 0xffb060, i: 0.7, rad: 6 },
    { c: 6, r: 15, color: 0x8fb0e0, i: 0.4, rad: 10 },
    // Floodlights on the masts.
    { c: 17, r: 11, color: 0xe6f0ff, i: 0.9, rad: 9 },
    { c: 22, r: 12, color: 0xe6f0ff, i: 0.9, rad: 9 },
    { c: 19, r: 18, color: 0xe6f0ff, i: 0.9, rad: 9 },
    { c: 19, r: 8, color: 0xffb060, i: 0.6, rad: 7 },
    { c: 5, r: 4, color: 0xfff2c8, i: 0.9, rad: 11 },
    { c: 5, r: 10, color: 0xfff2c8, i: 0.7, rad: 9 },
    { c: 15, r: 3, color: 0xffe2b0, i: 0.8, rad: 9 },
    { c: 24, r: 3, color: 0xffe2b0, i: 0.8, rad: 9 },
    { c: 33, r: 4, color: 0xffb060, i: 0.9, rad: 10 },
    { c: 34, r: 8, color: 0xffb060, i: 0.5, rad: 6 },
    { c: 33, r: 12, color: 0xbfd8ff, i: 1.0, rad: 10 },
    { c: 34, r: 16, color: 0xbfd8ff, i: 0.7, rad: 8 },
    { c: 33, r: 23, color: 0x60d8ff, i: 0.9, rad: 10 },
    { c: 16, r: 23, color: 0xffe2b0, i: 0.9, rad: 10 },
    { c: 24, r: 24, color: 0xffe2b0, i: 0.8, rad: 9 },
  ],

  // facing: 0 = south, PI/2 = east, PI = north, -PI/2 = west
  guards: [
    { type: 'guard', patrol: [[9, 14], [6, 14]] },
    { type: 'guard', patrol: [[12, 8], [27, 8], [27, 19], [12, 19]], runner: true },
    { type: 'guard', patrol: [[17, 10], [22, 10], [22, 14], [17, 14]] },
    { type: 'guard', patrol: [[20, 13]], facing: 0 },
    { type: 'guard', patrol: [[1, 4], [10, 4], [10, 12], [1, 12]] },
    { type: 'guard', patrol: [[7, 7]], facing: Math.PI / 2 },
    { type: 'guard', patrol: [[12, 3], [27, 3], [27, 5], [12, 5]] },
    { type: 'guard', patrol: [[20, 1]], facing: 0 },
    { type: 'guard', patrol: [[32, 1], [35, 1], [35, 8], [32, 8]] },
    { type: 'officer', patrol: [[29, 10], [38, 10], [38, 18], [29, 18]], drops: 'keyRed' },
    { type: 'guard', patrol: [[33, 14]], facing: -Math.PI / 2, runner: true },
    { type: 'guard', patrol: [[32, 12], [37, 12], [37, 16], [32, 16]] },
    { type: 'heavy', patrol: [[33, 23]], facing: Math.PI },
    { type: 'guard', patrol: [[29, 20], [38, 20], [38, 26], [29, 26]] },
    { type: 'guard', patrol: [[12, 23], [27, 23], [27, 24], [12, 24]] },
    { type: 'guard', patrol: [[20, 26]], facing: Math.PI },
  ],

  cameras: [
    { c: 27, r: 8, ox: 0.8, oz: -0.8, yaw: -Math.PI / 4, sweep: 0.6, range: 16 },
    { c: 12, r: 19, ox: -0.8, oz: 0.8, yaw: Math.PI * 0.75, sweep: 0.6, range: 16 },
    { c: 38, r: 10, ox: 0.8, oz: -0.8, yaw: -Math.PI / 4, sweep: 0.4, range: 11 },
    { c: 38, r: 26, ox: 0.8, oz: 0.8, yaw: -Math.PI * 0.75, sweep: 0.4, range: 11 },
    { c: 10, r: 12, ox: 0.8, oz: 0.8, yaw: -Math.PI * 0.75, sweep: 0.5, range: 12 },
  ],

  panels: [
    { c: 12, r: 13, side: 'w' },
    { c: 27, r: 11, side: 'e' },
    { c: 12, r: 1, side: 'w' },
    { c: 29, r: 16, side: 'w' },
    { c: 10, r: 6, side: 'e' },
  ],

  pickups: [
    { kind: 'rifle', c: 12, r: 1 },
    { kind: 'ammoRifle', c: 38, r: 18 },
    { kind: 'grenade', c: 10, r: 12 },
    { kind: 'keyBlue', c: 27, r: 1 },
    { kind: 'armor', c: 1, r: 14 },
    { kind: 'armor', c: 27, r: 26 },
    { kind: 'armor', c: 38, r: 8 },
    { kind: 'armor', c: 10, r: 1 },
    { kind: 'ammoPistol', c: 1, r: 26 },
    { kind: 'ammoPistol', c: 12, r: 6 },
    { kind: 'ammoPistol', c: 27, r: 19 },
    { kind: 'ammoPistol', c: 29, r: 26 },
    { kind: 'ammoSmg', c: 12, r: 26 },
    { kind: 'ammoSmg', c: 29, r: 1 },
  ],

  interactables: [
    { id: 'mast1', kind: 'plant', objective: 'masts', c: 14, r: 11, side: 'e', style: 'charge', hold: 2.2, label: 'Cut the feed on the relay mast', partial: 'Mast cut:' },
    { id: 'mast2', kind: 'plant', objective: 'masts', c: 25, r: 12, side: 'w', style: 'charge', hold: 2.2, label: 'Cut the feed on the relay mast', partial: 'Mast cut:' },
    { id: 'mast3', kind: 'plant', objective: 'masts', c: 19, r: 18, side: 'n', style: 'charge', hold: 2.2, label: 'Cut the feed on the relay mast', partial: 'Mast cut:' },
    { id: 'codebook', kind: 'photo', objective: 'codebook', c: 30, r: 12, side: 'n', style: 'papers', hold: 1.5, label: 'Photograph the codebook' },
    { id: 'snowcat', kind: 'plant', objective: 'snowcat', c: 5, r: 4, side: 'n', style: 'tag', hold: 2.5, label: 'Disable the second snowcat' },
    {
      id: 'logs', kind: 'download', objective: 'logs', c: 38, r: 24, side: 'e', style: 'console', hold: 1.2,
      label: 'Copy the intercept logs', time: 12,
      progress: 'COPYING INTERCEPT LOGS', lost: 'SIGNAL LOST. RETURN TO THE CIPHER ROOM',
      radio: 'HALE: Copy is running. Stay in the cipher room until it finishes.',
      company: 'HALE: The cipher desk has flagged the copy. Someone is coming to look.',
    },
    { id: 'breaker', kind: 'breaker', objective: 'grid', c: 38, r: 1, side: 'e', style: 'breaker', hold: 1.8, label: 'Cut the alarm grid' },
  ],

  objectives: [
    { id: 'snowcat', min: 1, text: 'Disable the second snowcat in the garage' },
    { id: 'logs', min: 2, text: 'Copy the cipher room intercept logs' },
    { id: 'codebook', min: 0, text: 'Photograph the codebook in operations' },
    { id: 'masts', min: 0, text: 'Cut the feed on the three relay masts' },
    { id: 'extract', min: 0, text: 'Take a snowcat from the garage' },
  ],

  reinforce: [[1, 26], [4, 26], [1, 22], [7, 26]],
};
