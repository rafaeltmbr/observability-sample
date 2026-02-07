export const config = {
  httpPort: parseInt(process.env["PORT"] ?? "3000"),
  cacheExpireInMs: parseInt(process.env["CACHE_EXPIRE_IN_MS"] ?? "5000"),
};
