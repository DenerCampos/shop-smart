export type JwtAccessPayload = {
  sub: string;
  username?: string;
  isDemo?: boolean;
  familyGroupId?: string;
  ver?: number;
};

export function accessTokenVersion(user: {
  tokenVersion?: number | null;
}): number {
  return user.tokenVersion ?? 0;
}

/** JWT emitido antes da troca de senha (reset ou update) ou da exclusão da conta fica inválido. */
export function isAccessTokenStale(
  payload: Pick<JwtAccessPayload, 'ver'>,
  user: { tokenVersion?: number | null },
): boolean {
  return (payload.ver ?? 0) !== accessTokenVersion(user);
}
