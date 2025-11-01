const crypto = require('crypto');

const DEFAULT_SALT = 'timealign_salt_2025';

function getSalt() {
  return process.env.PASSWORD_SALT || DEFAULT_SALT;
}

function hashPassword(password) {
  return crypto
    .createHash('sha256')
    .update(`${password}${getSalt()}`)
    .digest('hex');
}

function verifyPassword(password, hashed) {
  return hashPassword(password) === hashed;
}

module.exports = {
  hashPassword,
  verifyPassword,
};
