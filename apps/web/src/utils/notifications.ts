function buildErrorNotification(message: string): string {
  /**
   * var: message
   * type: string
   * desc: User-facing explanation of the failure condition.
   */
  return `Error: ${message}`;
}

export { buildErrorNotification };
