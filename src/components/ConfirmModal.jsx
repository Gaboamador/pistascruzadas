import {
  useEffect,
  useId,
  useRef,
} from 'react';
import { createPortal } from 'react-dom';
import { FiAlertTriangle } from 'react-icons/fi';

import styles from '@/components/ConfirmModal.module.scss';

const CONFIRM_MODAL_TONES = Object.freeze({
  DEFAULT: 'default',
  SUCCESS: 'success',
  WARNING: 'warning',
  DANGER: 'danger',
});

function ConfirmModal({
  isOpen,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  processingLabel = 'Procesando…',
  tone = CONFIRM_MODAL_TONES.DEFAULT,
  isProcessing = false,
  onConfirm,
  onCancel,
}) {
  const titleId = useId();
  const descriptionId = useId();

  const cancelButtonRef = useRef(null);
  const previousActiveElementRef =
    useRef(null);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    previousActiveElementRef.current =
      document.activeElement;

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow =
      'hidden';

    window.requestAnimationFrame(() => {
      cancelButtonRef.current?.focus();
    });

    const handleKeyDown = (event) => {
      if (
        event.key === 'Escape'
        && !isProcessing
      ) {
        event.preventDefault();
        onCancel();
      }
    };

    document.addEventListener(
      'keydown',
      handleKeyDown,
    );

    return () => {
      document.body.style.overflow =
        previousOverflow;

      document.removeEventListener(
        'keydown',
        handleKeyDown,
      );

      previousActiveElementRef.current
        ?.focus?.();
    };
  }, [
    isOpen,
    isProcessing,
    onCancel,
  ]);

  if (!isOpen) {
    return null;
  }

  const handleBackdropMouseDown = (
    event,
  ) => {
    if (
      event.target === event.currentTarget
      && !isProcessing
    ) {
      onCancel();
    }
  };

  const toneClassName =
    styles[
      `dialog${tone
        .charAt(0)
        .toUpperCase()}${tone.slice(1)}`
    ] ?? '';

  return createPortal(
    <div
      className={styles.backdrop}
      onMouseDown={
        handleBackdropMouseDown
      }
    >
      <section
        className={`${styles.dialog} ${toneClassName}`}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={
          description
            ? descriptionId
            : undefined
        }
      >
        <div
          className={styles.iconContainer}
          aria-hidden="true"
        >
          <FiAlertTriangle />
        </div>

        <div className={styles.content}>
          <h2
            id={titleId}
            className={styles.title}
          >
            {title}
          </h2>

          {description && (
            <p
              id={descriptionId}
              className={
                styles.description
              }
            >
              {description}
            </p>
          )}
        </div>

        <div className={styles.actions}>
          <button
            ref={cancelButtonRef}
            type="button"
            className="button button--secondary"
            onClick={onCancel}
            disabled={isProcessing}
          >
            {cancelLabel}
          </button>

          <button
            type="button"
            className={`${styles.confirmButton} ${styles[`confirmButton${tone
              .charAt(0)
              .toUpperCase()}${tone.slice(1)}`] ?? ''}`}
            onClick={onConfirm}
            disabled={isProcessing}
          >
            {isProcessing
              ? processingLabel
              : confirmLabel}
          </button>
        </div>
      </section>
    </div>,
    document.body,
  );
}

export {
  CONFIRM_MODAL_TONES,
};

export default ConfirmModal;