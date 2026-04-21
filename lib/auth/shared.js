export const MANAGER_LOGIN_PATH = "/manager/login";
export const MANAGER_HOME_PATH = "/manager";

function normalizeEmail(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

export function getAllowedManagerEmails() {
  const raw = process.env.MANAGER_ALLOWED_EMAILS || "";

  return raw
    .split(",")
    .map(normalizeEmail)
    .filter(Boolean);
}

export function isManagerEmail(email) {
  const normalizedEmail = normalizeEmail(email);
  const allowedEmails = getAllowedManagerEmails();

  if (!normalizedEmail) {
    return false;
  }

  if (allowedEmails.length === 0) {
    return true;
  }

  return allowedEmails.includes(normalizedEmail);
}

export function normalizeCallbackUrl(value) {
  if (typeof value !== "string" || !value.startsWith("/")) {
    return MANAGER_HOME_PATH;
  }

  if (value.startsWith("//")) {
    return MANAGER_HOME_PATH;
  }

  return value;
}
