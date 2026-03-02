import { SignJWT, jwtVerify } from 'jose';
import { randomBytes } from 'crypto';

const ACCESS_TOKEN_SECRET = new TextEncoder().encode(
  process.env.ACCESS_TOKEN_SECRET ||
    'your-access-token-secret-min-32-chars-long!',
);
const REFRESH_TOKEN_SECRET = new TextEncoder().encode(
  process.env.REFRESH_TOKEN_SECRET ||
    'your-refresh-token-secret-min-32-chars-long!',
);

const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';

export type TokenPayload = {
  userId: string;
  username: string;
};

export type AccessTokenPayload = TokenPayload & {
  type: 'access';
};

export type RefreshTokenPayload = TokenPayload & {
  type: 'refresh';
  tokenId: string;
};

export function generateRefreshTokenId(): string {
  return randomBytes(32).toString('hex');
}

export async function signAccessToken(payload: TokenPayload): Promise<string> {
  return new SignJWT({ ...payload, type: 'access' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_EXPIRY)
    .sign(ACCESS_TOKEN_SECRET);
}

export async function signRefreshToken(
  payload: TokenPayload,
  tokenId: string,
): Promise<string> {
  return new SignJWT({ ...payload, type: 'refresh', tokenId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(REFRESH_TOKEN_EXPIRY)
    .sign(REFRESH_TOKEN_SECRET);
}

export async function verifyAccessToken(
  token: string,
): Promise<AccessTokenPayload> {
  const { payload } = await jwtVerify(token, ACCESS_TOKEN_SECRET);

  if (payload.type !== 'access') {
    throw new Error('Invalid token type');
  }

  return payload as AccessTokenPayload;
}

export async function verifyRefreshToken(
  token: string,
): Promise<RefreshTokenPayload> {
  const { payload } = await jwtVerify(token, REFRESH_TOKEN_SECRET);

  if (payload.type !== 'refresh') {
    throw new Error('Invalid token type');
  }

  return payload as RefreshTokenPayload;
}
