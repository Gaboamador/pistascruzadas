import styles from '@/components/CoordinateCard.module.scss';

function CoordinateCard({
  coordinate,
  className = '',
  ariaLive = undefined,
}) {
  const hasCoordinate =
    Boolean(coordinate);

  const coordinateLetter =
    hasCoordinate
      ? coordinate.charAt(0)
      : '';

  const coordinateNumber =
    hasCoordinate
      ? coordinate.slice(1)
      : '';

  const classNames = [
    styles.coordinate,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={classNames}
      aria-live={ariaLive}
      aria-label={
        hasCoordinate
          ? `Tu coordenada es ${coordinate}`
          : 'No tenés una coordenada asignada'
      }
    >
      {hasCoordinate ? (
        <>
          <span
            className={
              styles.coordinateLetter
            }
            aria-hidden="true"
          >
            {coordinateLetter}
          </span>

          <span
            className={
              styles.coordinateBadge
            }
            aria-hidden="true"
          >
            <span
              className={
                styles.coordinateNumber
              }
            >
              {coordinateNumber}
            </span>
          </span>
        </>
      ) : (
        <span aria-hidden="true">
          —
        </span>
      )}
    </div>
  );
}

export default CoordinateCard;