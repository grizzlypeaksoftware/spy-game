// Operation Cold Ledger: the freight depot.
//
// Map legend
//   #  wall            .  floor
//   c  low cover       C  tall stack / server rack
//   D  door            1  blue keycard door     2  red keycard door
//   P  player start    X  extraction point
const MAP = [
  '########################################', //  0
  '#..........#.....#.....#....##.........#', //  1
  '#..CC..cc..#.....#.....#....##.C.C.C.C.#', //  2
  '#..CC......#..c..#.cc..#.c..##.C.C.C.C.#', //  3
  '#..........#.....#.....#....##.........#', //  4
  '#......CC..#.....#.....#....##.........#', //  5
  '#..cc..CC..#.....#.....#....##.C.C.C...#', //  6
  '#..........#.....#.....#....##.........#', //  7
  '#..........#.....#.....#....##.........#', //  8
  '#####1########D#####D#####D#######2#####', //  9
  '#......................................#', // 10
  '#####D#########D########D#########D#####', // 11
  '#..........#................##.........#', // 12
  '#..c....c..#..CC....cc..CC..##.........#', // 13
  '#..........#..CC........CC..##........X#', // 14
  '#..........D................##.........#', // 15
  '#..c....c..#....cc..CC......##.........#', // 16
  '#..........#........CC......##.........#', // 17
  '#..........#................######D#####', // 18
  '#####D######..CC....c.....c.#..........#', // 19
  '#..........#..CC............#..cc......#', // 20
  '#...cc.....#........CC......#..........#', // 21
  '#...cc.....#..cc....CC......#......cc..#', // 22
  '#..........D................D..........#', // 23
  '#.......CC.#....CC......cc..#..........#', // 24
  '#.P.....CC.#....CC..........#..cc......#', // 25
  '#..........#................#..........#', // 26
  '########################################', // 27
];

export default {
  id: 'cold-ledger',
  codename: 'COLD LEDGER',
  location: 'Halcyon Freight depot, Pier 9, Port of Vellmark',
  time: '02:14 local',
  briefing: [
    'Halcyon Freight is a front. Its owner, Casimir Voss, brokers stolen guidance hardware to anyone with a numbered account.',
    'The proof is a ledger he keeps on an isolated server inside the Pier 9 depot. Go in through the loading dock, take a copy, and leave by the freight lift before the harbour shift changes.',
    'The security office keeps a spare blue keycard. The shift supervisor carries the red one that opens the server room, and he rarely leaves the offices.',
    'Quiet is better than loud. If the alarm goes up, Voss sends everyone he has.',
  ],
  signoff: 'Director Hale, the Lantern Office',

  map: MAP,
  startYaw: 0, // facing north
  menuCam: [21, 14],
  exitName: 'Freight lift',
  debrief: 'The ledger is on its way to the Lantern Office. It names an auction house.',

  // Lines from the handler. Every mission supplies the same set.
  radio: {
    start: [
      ['HALE: You are on the loading dock. One guard walks the far side of those crates.', 1.2],
      ['HALE: Press C to crouch. Crouched, you move silently and low cover hides you.', 6.5],
      ['HALE: Hold Tab for your map. It fills in as you move, and objectives show in amber.', 12],
    ],
    alarm: 'HALE: They have called it in. More of them are coming through the dock.',
    exitOpen: 'HALE: That is everything. Freight lift, in the lobby on the east side. Go.',
    doorBlue: 'HALE: That door wants a blue card. The security office keeps one, east of the warehouse.',
    doorRed: 'HALE: Red card. The supervisor carries it: navy coat, red cap, in the offices off the corridor.',
    keyBlue: 'HALE: Blue card. That opens the shipping bay at the west end of the corridor.',
    keyRed: 'HALE: That is the server room card. East end of the main corridor. Mind the camera.',
  },

  // Zones give each area its own surfaces. First match wins; doorways fall through to the default.
  zones: [
    { name: 'Loading dock', c0: 1, r0: 20, c1: 10, r1: 26, floor: 'asphalt', wall: 'brick', ceil: false, prop: 'crate' },
    { name: 'Staging room', c0: 1, r0: 12, c1: 10, r1: 18, floor: 'concrete', wall: 'concrete', ceil: true, prop: 'crate' },
    { name: 'Warehouse', c0: 12, r0: 12, c1: 27, r1: 26, floor: 'concrete', wall: 'metal', ceil: true, prop: 'crate' },
    { name: 'Security office', c0: 29, r0: 19, c1: 38, r1: 26, floor: 'tile', wall: 'security', ceil: true, prop: 'desk' },
    { name: 'Main corridor', c0: 1, r0: 10, c1: 38, r1: 10, floor: 'tile', wall: 'panel', ceil: true, prop: 'crate' },
    { name: 'Shipping bay', c0: 1, r0: 1, c1: 10, r1: 8, floor: 'concrete', wall: 'metal', ceil: true, prop: 'crate' },
    { name: 'Offices', c0: 12, r0: 1, c1: 27, r1: 8, floor: 'carpet', wall: 'office', ceil: true, prop: 'desk' },
    { name: 'Server core', c0: 30, r0: 1, c1: 38, r1: 8, floor: 'serverFloor', wall: 'server', ceil: true, prop: 'rack' },
    { name: 'Lift lobby', c0: 30, r0: 12, c1: 38, r1: 17, floor: 'tile', wall: 'panel', ceil: true, prop: 'crate' },
  ],
  defaultZone: { name: 'Doorway', floor: 'tile', wall: 'trim', ceil: true, prop: 'crate' },

  // Baked light sources: tile, colour, intensity, radius in metres.
  lights: [
    { c: 3, r: 22, color: 0x6f8fd0, i: 0.55, rad: 15 },
    { c: 10, r: 22, color: 0xffb060, i: 1.0, rad: 9 },
    { c: 5, r: 15, color: 0xfff0d0, i: 0.95, rad: 12 },
    { c: 15, r: 15, color: 0xfff2c8, i: 1.0, rad: 12 },
    { c: 24, r: 15, color: 0xfff2c8, i: 1.0, rad: 12 },
    { c: 15, r: 23, color: 0xfff2c8, i: 1.0, rad: 12 },
    { c: 24, r: 23, color: 0xfff2c8, i: 1.0, rad: 12 },
    { c: 19, r: 19, color: 0xfff2c8, i: 0.7, rad: 10 },
    { c: 33, r: 22, color: 0xbfd8ff, i: 1.0, rad: 12 },
    { c: 36, r: 25, color: 0xbfd8ff, i: 0.7, rad: 9 },
    { c: 5, r: 10, color: 0xe8f4ff, i: 0.9, rad: 9 },
    { c: 15, r: 10, color: 0xe8f4ff, i: 0.9, rad: 9 },
    { c: 25, r: 10, color: 0xe8f4ff, i: 0.9, rad: 9 },
    { c: 34, r: 10, color: 0xe8f4ff, i: 0.9, rad: 9 },
    { c: 3, r: 4, color: 0xffb870, i: 0.9, rad: 11 },
    { c: 8, r: 7, color: 0xffb870, i: 0.8, rad: 10 },
    { c: 14, r: 5, color: 0xffe2b0, i: 1.0, rad: 9 },
    { c: 20, r: 5, color: 0xffe2b0, i: 1.0, rad: 9 },
    { c: 26, r: 5, color: 0xffe2b0, i: 1.0, rad: 9 },
    { c: 32, r: 4, color: 0x60d8ff, i: 0.9, rad: 10 },
    { c: 36, r: 6, color: 0x60d8ff, i: 0.9, rad: 10 },
    { c: 34, r: 14, color: 0xf4f4ff, i: 1.0, rad: 12 },
  ],

  // facing: 0 = south, PI/2 = east, PI = north, -PI/2 = west
  guards: [
    { type: 'guard', patrol: [[10, 21], [10, 26]] },
    { type: 'guard', patrol: [[2, 12], [9, 12], [9, 17], [2, 17]] },
    { type: 'guard', patrol: [[13, 12], [26, 12], [26, 18], [13, 18]], runner: true },
    { type: 'guard', patrol: [[27, 26], [13, 26], [13, 21], [27, 21]] },
    { type: 'guard', patrol: [[18, 15], [18, 23]], runner: true },
    { type: 'guard', patrol: [[34, 22]], facing: Math.PI / 2 },
    { type: 'guard', patrol: [[29, 25], [38, 24]] },
    { type: 'guard', patrol: [[2, 10], [37, 10]], runner: true },
    { type: 'officer', patrol: [[19, 6], [21, 6], [21, 2]], drops: 'keyRed' },
    { type: 'guard', patrol: [[26, 6]], facing: 0 },
    { type: 'guard', patrol: [[1, 1], [10, 1], [10, 8], [1, 8]] },
    { type: 'guard', patrol: [[6, 4], [2, 5]] },
    { type: 'guard', patrol: [[32, 13]], facing: 0 },
    { type: 'guard', patrol: [[37, 12], [37, 17], [31, 17]], runner: true },
    { type: 'guard', patrol: [[30, 1], [38, 1], [38, 8], [30, 8]] },
  ],

  // Security cameras: corner tile, offset toward the corner, centre yaw, sweep half-angle, range.
  cameras: [
    { c: 38, r: 10, ox: 0.8, oz: 0, yaw: -Math.PI / 2, sweep: 0.3, range: 15 },
    { c: 12, r: 12, ox: -0.8, oz: -0.8, yaw: Math.PI / 4, sweep: 0.6, range: 17 },
    { c: 38, r: 12, ox: 0.8, oz: -0.8, yaw: -Math.PI / 4, sweep: 0.5, range: 13 },
    { c: 38, r: 8, ox: 0.8, oz: 0.8, yaw: -Math.PI * 0.75, sweep: 0.5, range: 14 },
  ],

  // Wall alarm panels that a guard may run for.
  panels: [
    { c: 12, r: 19, side: 'w' },
    { c: 1, r: 10, side: 'w' },
    { c: 30, r: 15, side: 'w' },
    { c: 1, r: 4, side: 'w' },
  ],

  pickups: [
    { kind: 'keyBlue', c: 36, r: 21 },
    { kind: 'armor', c: 13, r: 2 },
    { kind: 'armor', c: 9, r: 13 },
    { kind: 'armor', c: 30, r: 19 },
    { kind: 'ammoPistol', c: 2, r: 17 },
    { kind: 'ammoPistol', c: 27, r: 1 },
    { kind: 'ammoPistol', c: 10, r: 8 },
    { kind: 'ammoSmg', c: 30, r: 26 },
  ],

  interactables: [
    {
      id: 'terminal', kind: 'download', objective: 'ledger', c: 34, r: 1, side: 'n', style: 'console', hold: 1.2,
      label: 'Start the ledger download', time: 14,
      progress: 'COPYING LEDGER', lost: 'SIGNAL LOST. RETURN TO THE TERMINAL',
      radio: 'HALE: Copy is running. Stay near the terminal until it finishes.',
      company: 'HALE: Someone will notice the load on that server. Expect company.',
    },
    { id: 'beacon', kind: 'plant', objective: 'beacon', c: 5, r: 2, side: 'w', style: 'tag', hold: 2.5, label: 'Plant the tracking beacon' },
    { id: 'manifest', kind: 'photo', objective: 'manifest', c: 25, r: 4, side: 'n', style: 'papers', hold: 1.5, label: 'Photograph the manifest' },
    { id: 'breaker', kind: 'breaker', objective: 'grid', c: 38, r: 26, side: 'e', style: 'breaker', hold: 1.8, label: 'Cut the alarm grid' },
  ],

  // min is the lowest difficulty level that includes the objective.
  objectives: [
    { id: 'grid', min: 2, text: 'Cut power to the alarm grid' },
    { id: 'beacon', min: 1, text: 'Tag the outbound shipment with a beacon' },
    { id: 'manifest', min: 2, text: "Photograph Voss's shipping manifest" },
    { id: 'ledger', min: 0, text: 'Download the ledger from the server core' },
    { id: 'extract', min: 0, text: 'Leave by the freight lift' },
  ],

  reinforce: [[2, 26], [4, 26], [1, 20], [6, 26]],
};
