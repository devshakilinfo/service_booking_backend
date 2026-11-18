const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('JWT_SECRET must be set in the environment and be at least 32 characters long');
  }
  return secret;
};

module.exports = { getJwtSecret };
