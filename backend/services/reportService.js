export const createEmptyReport = (name) => ({
  name,
  generatedAt: new Date().toISOString(),
  rows: []
});
