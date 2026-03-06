const AUTHORIZED_REVIEWER_ROLE_KEYWORDS = ["admin", "manager"];

export function hasAdminOrManagerRole(
  role: string | null | undefined,
): boolean {
  if (!role) {
    return false;
  }

  const normalizedRole = role.trim().toLowerCase();
  return AUTHORIZED_REVIEWER_ROLE_KEYWORDS.some((keyword) =>
    normalizedRole.includes(keyword),
  );
}
