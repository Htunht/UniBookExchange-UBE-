export function shouldLogDevelopmentOtp(
  nodeEnv: string | undefined,
  configuredValue: string | undefined,
): boolean {
  return nodeEnv !== "production" && configuredValue === "true";
}
