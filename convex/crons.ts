import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Process abandoned checkouts every hour
// Sends recovery emails to users who started checkout 2+ hours ago but didn't finish
crons.interval(
  "process-abandoned-checkouts",
  { hours: 1 },
  internal.checkoutRecovery.processAbandonedCheckouts
);

export default crons;
