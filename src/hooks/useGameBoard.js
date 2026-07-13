import { useEffect, useState } from 'react';

import { subscribeToGameBoard } from '@/services/firebase/gameBoardService';

function useGameBoard({ tableCode }) {
  const [gameBoard, setGameBoard] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!tableCode) {
      setGameBoard(null);
      setIsLoading(false);
      setError(
        new Error('No se recibió el código de la mesa.'),
      );

      return undefined;
    }

    setGameBoard(null);
    setIsLoading(true);
    setError(null);

    const unsubscribe = subscribeToGameBoard({
      tableCode,
      onBoardChanged: (nextGameBoard) => {
        setGameBoard(nextGameBoard);
        setIsLoading(false);
      },
      onError: (subscriptionError) => {
        setError(subscriptionError);
        setIsLoading(false);
      },
    });

    return unsubscribe;
  }, [tableCode]);

  return {
    gameBoard,
    isLoading,
    error,
  };
}

export default useGameBoard;