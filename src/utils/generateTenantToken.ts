import jwt from 'jsonwebtoken';

export interface SearchRules {
  [indexUid: string]: Record<string, unknown> | {};
}

export interface TenantTokenOptions {
  apiKey: string;
  expiresAt?: Date;
}

export function generateTenantToken(
  apiKeyUid: string,
  searchRules: SearchRules,
  options: TenantTokenOptions
): string {
  const payload: Record<string, any> = {
    apiKeyUid,
    searchRules,
  };

  if (options.expiresAt) {
    payload.exp = Math.floor(options.expiresAt.getTime() / 1000);
  }

  return jwt.sign(payload, options.apiKey, {
    algorithm: 'HS256',
  });
}