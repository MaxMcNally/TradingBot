import crypto from "crypto";

const IV_LENGTH = 12;
let cachedKey: Buffer | null = null;
let cachedSecret = "";

const deriveKey = (): Buffer => {
  const secret = process.env.CREDENTIALS_ENCRYPTION_KEY || "";
  if (!secret) {
    throw new Error(
      "CREDENTIALS_ENCRYPTION_KEY is not configured. Set this env var before storing sensitive credentials."
    );
  }

  if (!cachedKey || cachedSecret !== secret) {
    cachedKey = crypto.createHash("sha256").update(secret).digest();
    cachedSecret = secret;
  }

  return cachedKey;
};

export const isEncryptionKeyConfigured = (): boolean => {
  return Boolean(process.env.CREDENTIALS_ENCRYPTION_KEY);
};

export const encryptSecret = (value: string): string => {
  if (!value) {
    throw new Error("Cannot encrypt empty value");
  }

  const key = deriveKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted.toString("hex")}`;
};

export const decryptSecret = (payload: string): string => {
  if (!payload) {
    throw new Error("Cannot decrypt empty payload");
  }

  const key = deriveKey();
  const [ivHex, tagHex, encryptedHex] = payload.split(":");

  if (!ivHex || !tagHex || !encryptedHex) {
    throw new Error("Encrypted payload is malformed");
  }

  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(tagHex, "hex");
  const encrypted = Buffer.from(encryptedHex, "hex");

  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString("utf8");
};
