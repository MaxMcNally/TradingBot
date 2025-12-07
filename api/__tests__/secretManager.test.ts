describe("secretManager", () => {
  const originalKey = process.env.CREDENTIALS_ENCRYPTION_KEY;

  afterEach(() => {
    if (originalKey) {
      process.env.CREDENTIALS_ENCRYPTION_KEY = originalKey;
    } else {
      delete process.env.CREDENTIALS_ENCRYPTION_KEY;
    }
    jest.resetModules();
  });

  it("encrypts and decrypts values when the key is configured", async () => {
    process.env.CREDENTIALS_ENCRYPTION_KEY = "unit-test-key";
    jest.resetModules();
    const { encryptSecret, decryptSecret } = await import("../utils/secretManager");

    const encrypted = encryptSecret("super-secret");
    expect(encrypted).not.toEqual("super-secret");
    const decrypted = decryptSecret(encrypted);
    expect(decrypted).toEqual("super-secret");
  });

  it("throws if the encryption key is missing", async () => {
    delete process.env.CREDENTIALS_ENCRYPTION_KEY;
    jest.resetModules();
    const { encryptSecret } = await import("../utils/secretManager");
    expect(() => encryptSecret("value")).toThrow("CREDENTIALS_ENCRYPTION_KEY");
  });
});
