export const evaluateFormula = (formula, values = {}) => {
  if (!formula) return 0;
  return Object.entries(values).reduce((text, [key, value]) => text.replaceAll(`[${key}]`, Number(value) || 0), formula);
};
