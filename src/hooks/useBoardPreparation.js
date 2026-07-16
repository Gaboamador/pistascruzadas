import {
  useEffect,
  useState,
} from 'react';

import {
  ensureBoardPreparation,
  saveBoardPreparation,
  subscribeToBoardPreparation,
} from '@/services/firebase/boardPreparationService';

function useBoardPreparation({
  tableCode,
  uid,
  gridSize,
}) {
  const [
    boardWords,
    setBoardWords,
  ] = useState(null);

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    isSaving,
    setIsSaving,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState(null);

  useEffect(() => {
    let isActive = true;

    setBoardWords(null);
    setIsLoading(true);
    setIsSaving(false);
    setError(null);

    const unsubscribe =
      subscribeToBoardPreparation({
        tableCode,
        gridSize,

        onBoardChanged: (
          nextBoardWords,
        ) => {
          if (
            !isActive
            || !nextBoardWords
          ) {
            return;
          }

          setBoardWords(
            nextBoardWords,
          );

          setError(null);
          setIsLoading(false);
        },

        onError: (
          subscriptionError,
        ) => {
          if (!isActive) {
            return;
          }

          setError(
            subscriptionError,
          );

          setIsLoading(false);
        },
      });

    ensureBoardPreparation({
      tableCode,
      uid,
      gridSize,
    })
      .then(
        (
          initialBoardWords,
        ) => {
          if (
            !isActive
            || !initialBoardWords
          ) {
            return;
          }

          /*
           * No dependemos exclusivamente
           * de que onSnapshot vuelva a emitir
           * después de la transacción.
           */
          setBoardWords(
            initialBoardWords,
          );

          setError(null);
          setIsLoading(false);
        },
      )
      .catch(
        (
          initializationError,
        ) => {
          if (!isActive) {
            return;
          }

          setError(
            initializationError,
          );

          setIsLoading(false);
        },
      );

    return () => {
      isActive = false;
      unsubscribe();
    };
  }, [
    tableCode,
    uid,
    gridSize,
  ]);

  const updateBoardWords =
    async (
      createNextBoardWords,
    ) => {
      if (
        !boardWords
        || isSaving
      ) {
        return;
      }

      const previousBoardWords =
        boardWords;

      const nextBoardWords =
        createNextBoardWords(
          previousBoardWords,
        );

      setBoardWords(
        nextBoardWords,
      );

      setIsSaving(true);
      setError(null);

      try {
        await saveBoardPreparation({
          tableCode,
          uid,
          gridSize,
          boardWords:
            nextBoardWords,
        });
      } catch (saveError) {
        setBoardWords(
          previousBoardWords,
        );

        setError(saveError);
      } finally {
        setIsSaving(false);
      }
    };

  return {
    boardWords,
    isLoading,
    isSaving,
    error,
    updateBoardWords,
  };
}

export default useBoardPreparation;