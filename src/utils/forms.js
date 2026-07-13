import {
  NICKNAME_MAX_LENGTH,
  NICKNAME_MIN_LENGTH,
  TABLE_CODE_LENGTH,
} from '@/constants/table';

function normalizeNickname(value) {
  return value.trim().replace(/\s+/g, ' ');
}

function validateNickname(value) {
  const normalizedNickname = normalizeNickname(value);

  if (!normalizedNickname) {
    return 'Ingresá un apodo.';
  }

  if (normalizedNickname.length < NICKNAME_MIN_LENGTH) {
    return `El apodo debe tener al menos ${NICKNAME_MIN_LENGTH} caracteres.`;
  }

  if (normalizedNickname.length > NICKNAME_MAX_LENGTH) {
    return `El apodo puede tener hasta ${NICKNAME_MAX_LENGTH} caracteres.`;
  }

  return '';
}

function normalizeTableCode(value) {
  return value
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, TABLE_CODE_LENGTH);
}

function validateTableCode(value) {
  const normalizedCode = normalizeTableCode(value);

  if (!normalizedCode) {
    return 'Ingresá el código de la mesa.';
  }

  if (normalizedCode.length !== TABLE_CODE_LENGTH) {
    return `El código debe tener ${TABLE_CODE_LENGTH} caracteres.`;
  }

  return '';
}

export {
  normalizeNickname,
  normalizeTableCode,
  validateNickname,
  validateTableCode,
};