import jwt from 'jsonwebtoken'

export default function createApiKey(keyId: string, ttl: number = 0) {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET not set');
  }

  const options = {}

  if (ttl > 0) {
    options['expiresIn'] = new Date().getTime() + ttl
  } else {
    options['expiresIn'] = '10y'
  }

  const token = jwt.sign(
    {
      keyId,
    },
    process.env.JWT_SECRET,
    options,
  );

  return {
    keyId,
    token,
    expiresAt: options['expiresIn'] || 0,
  };
}
