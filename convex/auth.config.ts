/**
 * Convex Auth Configuration for Clerk
 *
 * This config tells Convex how to verify Clerk JWTs.
 * Make sure to set up the JWT template in Clerk dashboard.
 *
 * @see https://docs.convex.dev/auth/clerk
 */
const authConfig = {
  providers: [
    {
      // The domain should match your Clerk Frontend API URL
      // Set this in your environment as CLERK_ISSUER_URL
      domain: process.env.CLERK_ISSUER_URL,
      // This must match the "aud" claim in your Clerk JWT template
      applicationID: "convex",
    },
  ],
};

export default authConfig;
