import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Daily street sweep: Droid re-ranks the best blocks to pedestrianize in the forward-looking area.
crons.cron("daily street sweep", "0 14 * * *", internal.droid.scheduledSweep, {});

export default crons;
