// Difficulty settings and the campaign list. Each mission is one data file in
// js/missions/; add another object of the same shape to extend the campaign.
import coldLedger from './missions/cold-ledger.js';
import giltFrame from './missions/gilt-frame.js';
import deadReckoning from './missions/dead-reckoning.js';
import paperTiger from './missions/paper-tiger.js';
import nightMail from './missions/night-mail.js';
import whiteNoise from './missions/white-noise.js';
import highTable from './missions/high-table.js';
import cleanRoom from './missions/clean-room.js';
import longFuse from './missions/long-fuse.js';
import lastLedger from './missions/last-ledger.js';

export const MISSIONS = [
  coldLedger, giltFrame, deadReckoning, paperTiger, nightMail,
  whiteNoise, highTable, cleanRoom, longFuse, lastLedger,
];

export const DIFFICULTIES = {
  recruit: {
    key: 'recruit', level: 0, name: 'Recruit',
    blurb: 'Slower guards that hit less hard.',
    dmg: 0.6, acc: 0.7, detect: 0.7, reaction: 0.9, reinforce: 2, ammo: 56,
  },
  operative: {
    key: 'operative', level: 1, name: 'Operative',
    blurb: 'The intended experience. One extra objective.',
    dmg: 1, acc: 1, detect: 1, reaction: 0.6, reinforce: 3, ammo: 40,
  },
  phantom: {
    key: 'phantom', level: 2, name: 'Phantom',
    blurb: 'Sharp guards, scarce ammo, all objectives.',
    dmg: 1.5, acc: 1.2, detect: 1.35, reaction: 0.4, reinforce: 4, ammo: 32,
  },
};
