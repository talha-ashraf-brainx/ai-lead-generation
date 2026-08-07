// Deliberately permissive — enough to reject obvious typos at signup without turning
// away valid-but-unusual addresses. Whether an address actually receives mail is proven
// by sending to it, never by a regex.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(value: string): boolean {
  return EMAIL_PATTERN.test(value.trim());
}
