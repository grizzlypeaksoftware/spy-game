// Operation Clean Room: the laboratory.
//
// Map legend
//   #  wall            .  floor
//   c  low cover       C  tall block
//   D  door            1  blue keycard door     2  red keycard door
//   P  player start    X  extraction point
const MAP = [
  '########################################', //  0
  '#........#....................#........#', //  1
  '#.P..CC..#.cc..cc..C..cc..cc..#.C.C.C..#', //  2
  '#....CC..#....................#.C.C.C..#', //  3
  '#........#....................#........#', //  4
  '#.c......#####D##########D#####.C.C.C..#', //  5
  '#........D....................2........#', //  6
  '#..cc..C.#....................#....cc..#', //  7
  '#........#..################..#........#', //  8
  '##########..#..............#..##########', //  9
  '#........#..#.cc..CC..cc...#..#........#', // 10
  '#.CC..CC.#..#..............#..#.cc..cc.#', // 11
  '#........#..#...c......c...#..#........#', // 12
  '#........D..1..............#..D........#', // 13
  '#.cc..cc.#..#..............1..#..cc....#', // 14
  '#........#..#...c......c...#..#........#', // 15
  '#.C....C.#..#..............#..#.C...cc.#', // 16
  '#........#..#.cc..CC..cc...#..#........#', // 17
  '##########..#..............#..##########', // 18
  '#........#..################..#........#', // 19
  '#........D....................D........#', // 20
  '#.CC.CC..#....................#..CC....#', // 21
  '#........##########D###########..CC..c.#', // 22
  '#.CC.CC..#....................#........#', // 23
  '#........#.CC..CC....CC..CC...#.c......#', // 24
  '#.cc...c.#.CC..CC....CC..CC...#......X.#', // 25
  '#........#....................#........#', // 26
  '########################################', // 27
];

export default {
  id: 'clean-room',
  codename: 'CLEAN ROOM',
  location: 'Orrin Laboratories, Cape road, south of Port Selene',
  time: '02:45 local',
  briefing: [
    'Orrin Laboratories builds the one part Voss cannot make at Sable Point: the seeker head. The finished prototype sits in an isolation cabinet in the clean room at the centre of the building.',
    'Take the seeker, and photograph the test notes in the offices on the north side. A ring corridor runs right round the clean room, with cameras on its north and south sides.',
    'The clean room takes a blue card, kept in the changing room on the west side. The chief technician carries the red card for the server room: navy coat, red cap, inside the clean room.',
    'Leave by the roof stair in the south-east corner.',
  ],
  signoff: 'Director Hale, the Lantern Office',

  map: MAP,
  startYaw: Math.PI, // facing south
  menuCam: [20, 6],
  exitName: 'Roof stair',
  debrief: 'The test notes give a date and a place for the demonstration: the old battery on Tern Rock. It is tonight.',

  radio: {
    start: [
      ['HALE: You are in the loading dock, north-west corner. The corridor is through the door to your east.', 1.2],
      ['HALE: Cameras cover the north and south sides of the ring. The west and east sides are blind.', 6.5],
    ],
    alarm: 'HALE: The lab has locked its gates and called the guardhouse. They will come in through the dock.',
    exitOpen: 'HALE: We have it. Roof stair, south-east corner of the ring.',
    doorBlue: 'HALE: The clean room takes a blue card. It is in the changing room, west side of the ring.',
    doorRed: 'HALE: Server room. The chief technician has the red card: navy coat, red cap, in the clean room.',
    keyBlue: 'HALE: Blue card. The clean room has a door on its west side and one on its east.',
    keyRed: 'HALE: Red card. The server room is at the north-east corner of the ring.',
  },

  zones: [
    { name: 'Loading dock', c0: 1, r0: 1, c1: 8, r1: 8, floor: 'concrete', wall: 'metal', ceil: true, prop: 'crate' },
    { name: 'Changing room', c0: 1, r0: 10, c1: 8, r1: 17, floor: 'tile', wall: 'lab', ceil: true, prop: 'bench', propTall: 'deposit' },
    { name: 'Cold store', c0: 1, r0: 19, c1: 8, r1: 26, floor: 'grate', wall: 'metal', ceil: true, prop: 'bench', propTall: 'tank' },
    { name: 'Offices', c0: 10, r0: 1, c1: 29, r1: 4, floor: 'carpet', wall: 'office', ceil: true, prop: 'desk', propTall: 'shelf' },
    { name: 'Clean room', c0: 13, r0: 9, c1: 26, r1: 18, floor: 'labFloor', wall: 'clean', ceil: true, prop: 'bench', propTall: 'tank' },
    { name: 'Plant room', c0: 10, r0: 23, c1: 29, r1: 26, floor: 'grate', wall: 'metal', ceil: true, prop: 'machine' },
    { name: 'Server room', c0: 31, r0: 1, c1: 38, r1: 8, floor: 'serverFloor', wall: 'server', ceil: true, prop: 'desk', propTall: 'rack' },
    { name: 'Security room', c0: 31, r0: 10, c1: 38, r1: 17, floor: 'tile', wall: 'security', ceil: true, prop: 'desk', propTall: 'rack' },
    { name: 'Roof stair', c0: 31, r0: 19, c1: 38, r1: 26, floor: 'concrete', wall: 'concrete', ceil: true, prop: 'crate' },
    { name: 'Ring corridor', c0: 10, r0: 6, c1: 29, r1: 21, floor: 'labFloor', wall: 'lab', ceil: true, prop: 'bench' },
  ],
  defaultZone: { name: 'Doorway', floor: 'labFloor', wall: 'trim', ceil: true, prop: 'crate' },

  lights: [
    { c: 4, r: 4, color: 0xffb060, i: 0.6, rad: 10 },
    { c: 4, r: 13, color: 0xeaf4ff, i: 0.9, rad: 9 },
    { c: 4, r: 22, color: 0x60d8ff, i: 0.7, rad: 9 },
    { c: 15, r: 3, color: 0xfff2c8, i: 0.9, rad: 9 },
    { c: 25, r: 3, color: 0xfff2c8, i: 0.9, rad: 9 },
    // The ring is bright on its camera sides and dim on the blind ones.
    { c: 15, r: 6, color: 0xeaf4ff, i: 1.0, rad: 9 },
    { c: 24, r: 6, color: 0xeaf4ff, i: 1.0, rad: 9 },
    { c: 15, r: 21, color: 0xeaf4ff, i: 1.0, rad: 9 },
    { c: 24, r: 21, color: 0xeaf4ff, i: 1.0, rad: 9 },
    { c: 10, r: 14, color: 0xeaf4ff, i: 0.5, rad: 6 },
    { c: 29, r: 14, color: 0xeaf4ff, i: 0.5, rad: 6 },
    { c: 17, r: 12, color: 0xffffff, i: 1.0, rad: 9 },
    { c: 22, r: 15, color: 0xffffff, i: 1.0, rad: 9 },
    { c: 14, r: 23, color: 0xffb060, i: 0.8, rad: 9 },
    { c: 25, r: 26, color: 0xffb060, i: 0.8, rad: 9 },
    { c: 35, r: 4, color: 0x60d8ff, i: 0.9, rad: 9 },
    { c: 35, r: 13, color: 0xbfd8ff, i: 1.0, rad: 9 },
    { c: 35, r: 23, color: 0xffb060, i: 0.7, rad: 9 },
  ],

  // facing: 0 = south, PI/2 = east, PI = north, -PI/2 = west
  guards: [
    { type: 'guard', patrol: [[10, 6], [29, 6], [29, 21], [10, 21]], runner: true },
    { type: 'guard', patrol: [[11, 7], [11, 20], [28, 20], [28, 7]] },
    { type: 'guard', patrol: [[20, 7]], facing: Math.PI },
    { type: 'guard', patrol: [[20, 20]], facing: 0 },
    { type: 'officer', patrol: [[13, 9], [26, 9], [26, 18], [13, 18]], drops: 'keyRed' },
    { type: 'guard', patrol: [[15, 13], [24, 13], [24, 14], [15, 14]] },
    { type: 'guard', patrol: [[20, 16]], facing: Math.PI },
    { type: 'guard', patrol: [[10, 1], [29, 1], [29, 4], [10, 4]] },
    { type: 'guard', patrol: [[19, 3]], facing: 0 },
    { type: 'guard', patrol: [[10, 23], [29, 23], [29, 26], [10, 26]] },
    { type: 'guard', patrol: [[1, 10], [8, 10], [8, 15], [1, 15]] },
    { type: 'guard', patrol: [[1, 19], [8, 19], [8, 24], [1, 24]] },
    { type: 'guard', patrol: [[31, 10], [38, 10], [38, 17], [31, 17]] },
    { type: 'guard', patrol: [[35, 13]], facing: -Math.PI / 2, runner: true },
    { type: 'heavy', patrol: [[34, 4]], facing: 0 },
    { type: 'guard', patrol: [[31, 1], [38, 1], [38, 8], [31, 8]] },
    { type: 'guard', patrol: [[34, 23]], facing: -Math.PI / 2 },
  ],

  cameras: [
    { c: 10, r: 6, ox: -0.8, oz: -0.8, yaw: Math.PI / 2, sweep: 0.3, range: 16 },
    { c: 29, r: 21, ox: 0.8, oz: 0.8, yaw: -Math.PI / 2, sweep: 0.3, range: 16 },
    { c: 26, r: 9, ox: 0.8, oz: -0.8, yaw: -Math.PI / 4, sweep: 0.6, range: 13 },
    { c: 38, r: 1, ox: 0.8, oz: -0.8, yaw: -Math.PI / 4, sweep: 0.4, range: 9 },
    { c: 29, r: 1, ox: 0.8, oz: -0.8, yaw: -Math.PI / 3, sweep: 0.4, range: 14 },
  ],

  panels: [
    { c: 10, r: 10, side: 'w' },
    { c: 29, r: 16, side: 'e' },
    { c: 13, r: 11, side: 'w' },
    { c: 31, r: 12, side: 'w' },
    { c: 10, r: 2, side: 'w' },
  ],

  pickups: [
    { kind: 'shotgun', c: 38, r: 13 },
    { kind: 'ammoShells', c: 29, r: 23 },
    { kind: 'grenade', c: 1, r: 26 },
    { kind: 'keyBlue', c: 1, r: 17 },
    { kind: 'armor', c: 8, r: 1 },
    { kind: 'armor', c: 29, r: 4 },
    { kind: 'armor', c: 38, r: 17 },
    { kind: 'armor', c: 10, r: 26 },
    { kind: 'ammoPistol', c: 1, r: 8 },
    { kind: 'ammoPistol', c: 8, r: 26 },
    { kind: 'ammoPistol', c: 38, r: 10 },
    { kind: 'ammoPistol', c: 20, r: 21 },
    { kind: 'ammoSmg', c: 26, r: 18 },
    { kind: 'ammoSmg', c: 31, r: 26 },
  ],

  interactables: [
    { id: 'seeker', kind: 'use', objective: 'seeker', c: 19, r: 9, side: 'n', style: 'safe', hold: 3, label: 'Open the isolation cabinet and take the seeker' },
    { id: 'notes', kind: 'photo', objective: 'notes', c: 11, r: 3, side: 'n', style: 'papers', hold: 1.5, label: 'Photograph the test notes' },
    { id: 'samples', kind: 'plant', objective: 'samples', c: 1, r: 22, side: 'w', style: 'tag', hold: 2.5, label: 'Tag the propellant samples' },
    {
      id: 'tables', kind: 'download', objective: 'tables', c: 38, r: 4, side: 'e', style: 'console', hold: 1.2,
      label: 'Copy the guidance tables', time: 12,
      progress: 'COPYING GUIDANCE TABLES', lost: 'SIGNAL LOST. RETURN TO THE SERVER ROOM',
      radio: 'HALE: Copy is running. Stay in the server room until it finishes.',
      company: 'HALE: The server has logged the copy. Security is sending someone.',
    },
    { id: 'breaker', kind: 'breaker', objective: 'grid', c: 29, r: 26, side: 'e', style: 'breaker', hold: 1.8, label: 'Cut the alarm grid' },
  ],

  objectives: [
    { id: 'samples', min: 1, text: 'Tag the samples in the cold store' },
    { id: 'tables', min: 2, text: 'Copy the server room guidance tables' },
    { id: 'notes', min: 0, text: 'Photograph the test notes in the offices' },
    { id: 'seeker', min: 0, text: 'Take the seeker from the clean room' },
    { id: 'extract', min: 0, text: 'Leave by the roof stair' },
  ],

  reinforce: [[1, 1], [3, 1], [1, 4], [7, 1]],
};
