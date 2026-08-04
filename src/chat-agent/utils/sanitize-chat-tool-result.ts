const SENSITIVE_KEYS = new Set([
  'password',
  'token',
  'refreshtoken',
  'refreshToken',
  'accessToken',
  'secret',
  'apiKey',
  'api_key',
  'authorization',
  'privateKey',
  'uri',
  'url',
  'photos',
]);

/** Relações típicas de User — nunca enviar hash/tokens ao Gemini. */
const USER_LIKE_KEYS = new Set([
  'user',
  'createdBy',
  'assignedTo',
  'uploadedBy',
  'targetUser',
  'invitedBy',
  'owner',
]);

function pickSafeUser(value: Record<string, unknown>): Record<string, unknown> {
  const safe: Record<string, unknown> = {};
  if (value.id !== undefined) safe.id = value.id;
  if (value.name !== undefined) safe.name = value.name;
  if (value.profileImage !== undefined) safe.profileImage = value.profileImage;
  return safe;
}

/**
 * Remove credenciais, URLs/arquivos (`uri`/`url`/`photos`) e reduz relações User
 * antes de enviar tool results ao Gemini.
 */
export function sanitizeChatToolResult(value: unknown, depth = 0): unknown {
  if (value == null || depth > 12) return value;
  if (typeof value !== 'object') return value;
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeChatToolResult(item, depth + 1));
  }

  const obj = value as Record<string, unknown>;
  const out: Record<string, unknown> = {};

  for (const [key, val] of Object.entries(obj)) {
    if (SENSITIVE_KEYS.has(key)) continue;

    if (
      USER_LIKE_KEYS.has(key) &&
      val &&
      typeof val === 'object' &&
      !Array.isArray(val) &&
      !(val instanceof Date)
    ) {
      out[key] = pickSafeUser(val as Record<string, unknown>);
      continue;
    }

    out[key] = sanitizeChatToolResult(val, depth + 1);
  }

  return out;
}
