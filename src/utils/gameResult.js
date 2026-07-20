const GAME_RESULT_LEVELS = Object.freeze({
  FIASCO: 'fiasco',
  REGULAR: 'regular',
  GOOD: 'good',
  INCREDIBLE: 'incredible',
});

const GAME_RESULT_DESCRIPTIONS = Object.freeze({
  [GAME_RESULT_LEVELS.FIASCO]:
    'Claramente, todavía no se entienden entre ustedes.',

  [GAME_RESULT_LEVELS.REGULAR]:
    'Hay un entendimiento básico de cómo piensan los demás jugadores.',

  [GAME_RESULT_LEVELS.GOOD]:
    '¡Vaaamos! ¡Tienen una conexión fuerte!',

  [GAME_RESULT_LEVELS.INCREDIBLE]:
    '¡Puntuación perfecta! Sospechamos que usaron telepatía.',
});

const GAME_RESULT_CONFIG = Object.freeze({
  3: Object.freeze([
    Object.freeze({
      minCorrect: 0,
      maxCorrect: 3,
      level:
        GAME_RESULT_LEVELS.FIASCO,
      title: 'Fiasco',
    }),

    Object.freeze({
      minCorrect: 4,
      maxCorrect: 5,
      level:
        GAME_RESULT_LEVELS.REGULAR,
      title: 'Regular',
    }),

    Object.freeze({
      minCorrect: 6,
      maxCorrect: 7,
      level:
        GAME_RESULT_LEVELS.GOOD,
      title: 'Bien',
    }),

    Object.freeze({
      minCorrect: 8,
      maxCorrect: 9,
      level:
        GAME_RESULT_LEVELS.INCREDIBLE,
      title: 'Increíble',
    }),
  ]),

  4: Object.freeze([
    Object.freeze({
      minCorrect: 0,
      maxCorrect: 7,
      level:
        GAME_RESULT_LEVELS.FIASCO,
      title: 'Fiasco',
    }),

    Object.freeze({
      minCorrect: 8,
      maxCorrect: 11,
      level:
        GAME_RESULT_LEVELS.REGULAR,
      title: 'Regular',
    }),

    Object.freeze({
      minCorrect: 12,
      maxCorrect: 14,
      level:
        GAME_RESULT_LEVELS.GOOD,
      title: 'Bien',
    }),

    Object.freeze({
      minCorrect: 15,
      maxCorrect: 16,
      level:
        GAME_RESULT_LEVELS.INCREDIBLE,
      title: 'Increíble',
    }),
  ]),

  5: Object.freeze([
    Object.freeze({
      minCorrect: 0,
      maxCorrect: 11,
      level:
        GAME_RESULT_LEVELS.FIASCO,
      title: 'Fiasco',
    }),

    Object.freeze({
      minCorrect: 12,
      maxCorrect: 16,
      level:
        GAME_RESULT_LEVELS.REGULAR,
      title: 'Regular',
    }),

    Object.freeze({
      minCorrect: 17,
      maxCorrect: 22,
      level:
        GAME_RESULT_LEVELS.GOOD,
      title: 'Bien',
    }),

    Object.freeze({
      minCorrect: 23,
      maxCorrect: 25,
      level:
        GAME_RESULT_LEVELS.INCREDIBLE,
      title: 'Increíble',
    }),
  ]),
});

function getGameResult({
  gridSize,
  correctCount,
}) {
  if (
    !Number.isInteger(gridSize)
    || !Number.isInteger(
      correctCount,
    )
  ) {
    return null;
  }

  const coordinateCount =
    gridSize ** 2;

  if (
    correctCount < 0
    || correctCount
      > coordinateCount
  ) {
    return null;
  }

  const resultRanges =
    GAME_RESULT_CONFIG[
      gridSize
    ];

  if (!resultRanges) {
    return null;
  }

  const resultRange =
    resultRanges.find(
      ({
        minCorrect,
        maxCorrect,
      }) =>
        correctCount
          >= minCorrect
        && correctCount
          <= maxCorrect,
    );

  if (!resultRange) {
    return null;
  }

  return {
    ...resultRange,

    description:
      GAME_RESULT_DESCRIPTIONS[
        resultRange.level
      ],
  };
}

export {
  GAME_RESULT_LEVELS,
  getGameResult,
};