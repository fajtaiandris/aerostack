export const generateEditHash = () => {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join(
    "",
  );
};

export const isValidEditHash = (value: string) => /^[a-f0-9]{32}$/.test(value);
