export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isValidUsername(username: string): boolean {
  return /^[a-zA-Z0-9_-]{3,32}$/.test(username);
}

export function isValidPin(pin: string): boolean {
  return /^[0-9]{4,8}$/.test(pin);
}
