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

const DEFAULT_GRID_SIZE = 5;

const NICKNAME_MIN_LENGTH = 2;
const NICKNAME_MAX_LENGTH = 20;

const CLUE_MIN_LENGTH = 1;
const CLUE_MAX_LENGTH = 40;

const TABLE_CODE_LENGTH = 6;

const TABLE_CODE_CHARACTERS =
  '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

const TABLE_CODE_GENERATION_MAX_ATTEMPTS = 10;

const TABLE_STATUS = Object.freeze({
  LOBBY: 'lobby',
  PLAYING: 'playing',
  FINISHED: 'finished',
});

const PARTICIPANT_ROLE = Object.freeze({
  HOST: 'host',
  PLAYER: 'player',
});

const PARTICIPANT_STATUS = Object.freeze({
  ACTIVE: 'active',
  LEFT: 'left',
});

const JOIN_REQUEST_STATUS = Object.freeze({
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
});

const JOIN_REQUEST_TYPE = Object.freeze({
  JOIN: 'join',
  REJOIN: 'rejoin',
});

const GAME_FINISH_REASON = Object.freeze({
  COMPLETED: 'completed',
  MANUAL: 'manual',
});

export {
  CLUE_MAX_LENGTH,
  CLUE_MIN_LENGTH,
  DEFAULT_GRID_SIZE,
  GAME_FINISH_REASON,
  GRID_SIZE_OPTIONS,
  JOIN_REQUEST_STATUS,
  JOIN_REQUEST_TYPE,
  NICKNAME_MAX_LENGTH,
  NICKNAME_MIN_LENGTH,
  PARTICIPANT_ROLE,
  PARTICIPANT_STATUS,
  TABLE_CODE_CHARACTERS,
  TABLE_CODE_GENERATION_MAX_ATTEMPTS,
  TABLE_CODE_LENGTH,
  TABLE_STATUS,
};