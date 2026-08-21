// Quiet logs during tests (best-effort publish failures without a broker are
// expected and would otherwise flood CI output).
process.env.LOG_LEVEL = 'silent';
