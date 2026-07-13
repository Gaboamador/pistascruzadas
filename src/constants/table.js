const GRID_SIZE_OPTIONS = [
  {
    value: 3,
    label: '3 × 3',
    coordinateCount: 9,
  },
  {
    value: 4,
    label: '4 × 4',
    coordinateCount: 16,
  },
  {
    value: 5,
    label: '5 × 5',
    coordinateCount: 25,
  },
];

const DEFAULT_GRID_SIZE = 4;

const NICKNAME_MIN_LENGTH = 2;
const NICKNAME_MAX_LENGTH = 20;

const TABLE_CODE_LENGTH = 6;

const TABLE_CODE_CHARACTERS = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

const TABLE_CODE_GENERATION_MAX_ATTEMPTS = 10;

const TABLE_STATUS = {
  LOBBY: 'lobby',
  PLAYING: 'playing',
  FINISHED: 'finished',
};

const PARTICIPANT_ROLE = {
  HOST: 'host',
  PLAYER: 'player',
};

const PARTICIPANT_STATUS = {
  ACTIVE: 'active',
  LEFT: 'left',
};

export {
  DEFAULT_GRID_SIZE,
  GRID_SIZE_OPTIONS,
  NICKNAME_MAX_LENGTH,
  NICKNAME_MIN_LENGTH,
  PARTICIPANT_ROLE,
  PARTICIPANT_STATUS,
  TABLE_CODE_CHARACTERS,
  TABLE_CODE_GENERATION_MAX_ATTEMPTS,
  TABLE_CODE_LENGTH,
  TABLE_STATUS,
};