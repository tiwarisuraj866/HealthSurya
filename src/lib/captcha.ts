const CHARSET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** Client-side dynamic CAPTCHA (dev/staging login gate). */
export function createCaptchaChallenge(length = 5) {
  let code = "";
  for (let i = 0; i < length; i++) {
    code += CHARSET[Math.floor(Math.random() * CHARSET.length)];
  }
  return { code, createdAt: Date.now() };
}

export function captchaMatches(input: string, expected: string): boolean {
  return input.trim().toUpperCase() === expected.trim().toUpperCase();
}
