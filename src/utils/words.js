import words from '@/data/words.json';

function normalizeWord(word) {
  return word.trim();
}

function getNormalizedWordKey(word) {
  return normalizeWord(word).toLocaleLowerCase('es');
}

function getAvailableWords(excludedWords = []) {
  const excludedKeys = new Set(
    excludedWords.map(getNormalizedWordKey),
  );

  const uniqueWords = new Map();

  words.forEach((word) => {
    if (typeof word !== 'string') {
      return;
    }

    const normalizedWord = normalizeWord(word);

    if (!normalizedWord) {
      return;
    }

    const normalizedKey = getNormalizedWordKey(normalizedWord);

    if (
      excludedKeys.has(normalizedKey)
      || uniqueWords.has(normalizedKey)
    ) {
      return;
    }

    uniqueWords.set(normalizedKey, normalizedWord);
  });

  return Array.from(uniqueWords.values());
}

function getRandomArrayItem(items) {
  if (items.length === 0) {
    throw new Error('No hay elementos disponibles para seleccionar.');
  }

  const randomIndex = Math.floor(Math.random() * items.length);

  return items[randomIndex];
}

function getRandomWords(count, excludedWords = []) {
  const availableWords = getAvailableWords(excludedWords);

  if (availableWords.length < count) {
    throw new Error(
      `No hay suficientes palabras disponibles. Se necesitan ${count} y sólo hay ${availableWords.length}.`,
    );
  }

  const shuffledWords = [...availableWords];

  for (
    let currentIndex = shuffledWords.length - 1;
    currentIndex > 0;
    currentIndex -= 1
  ) {
    const randomIndex = Math.floor(
      Math.random() * (currentIndex + 1),
    );

    [
      shuffledWords[currentIndex],
      shuffledWords[randomIndex],
    ] = [
      shuffledWords[randomIndex],
      shuffledWords[currentIndex],
    ];
  }

  return shuffledWords.slice(0, count);
}

function generateBoardWords(gridSize) {
  const selectedWords = getRandomWords(gridSize * 2);

  return {
    columnWords: selectedWords.slice(0, gridSize),
    rowWords: selectedWords.slice(gridSize),
  };
}

function rerollBoardWord({
  columnWords,
  rowWords,
  axis,
  index,
}) {
  const currentWords = [...columnWords, ...rowWords];

  const nextWord = getRandomArrayItem(
    getAvailableWords(currentWords),
  );

  if (axis === 'column') {
    return {
      columnWords: columnWords.map((word, wordIndex) =>
        wordIndex === index ? nextWord : word,
      ),
      rowWords,
    };
  }

  if (axis === 'row') {
    return {
      columnWords,
      rowWords: rowWords.map((word, wordIndex) =>
        wordIndex === index ? nextWord : word,
      ),
    };
  }

  throw new Error(`Eje de palabra inválido: ${axis}`);
}

export {
  generateBoardWords,
  getAvailableWords,
  getRandomWords,
  rerollBoardWord,
};