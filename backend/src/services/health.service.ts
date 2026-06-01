export const healthService = {
  getStatus() {
    return {
      status: 'ok' as const,
    };
  },
};
