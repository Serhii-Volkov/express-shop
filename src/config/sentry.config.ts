// Import with `import * as Sentry from "@sentry/node"` if you are using ESM
import * as Sentry from "@sentry/node";
import { nodeProfilingIntegration } from "@sentry/profiling-node";
import logger from "./logger.config";

const dsn = process.env.SENTRY_DSN ;
if(!dsn) {
    logger.error('SENTRY_DSN is not set')
}



// Ensure to call this before importing any other modules!
Sentry.init({
  dsn: "https://97375d5d440163ebbf406764e0fd8123@o4511602909052928.ingest.de.sentry.io/4511602916786256",
  dataCollection: {
    // To disable sending user data and HTTP bodies, uncomment the lines below. For more info visit:
    // https://docs.sentry.io/platforms/javascript/guides/node/configuration/options/#dataCollection
    // userInfo: false,
    // httpBodies: [],
  },
  integrations: [
    // Add our Profiling integration
    nodeProfilingIntegration(),
    Sentry.consoleLoggingIntegration({ levels: ["log", "warn", "error"] }),
  ],
  // Set tracesSampleRate to 1.0 to capture 100%
  // of transactions for tracing.
  // We recommend adjusting this value in production
  // Learn more at
  // https://docs.sentry.io/platforms/javascript/guides/node/configuration/options/#tracesSampleRate
  tracesSampleRate: 1.0,
  // Enable profiling for a percentage of sessions
  // Learn more at
  // https://docs.sentry.io/platforms/javascript/configuration/options/#profileSessionSampleRate
  profileSessionSampleRate: 1.0,
  // Enable logs to be sent to Sentry
  enableLogs: true,
});