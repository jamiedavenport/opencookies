// A vendor call placed unconditionally — should be flagged ungated.

import posthog from "posthog-js";

posthog.init("phc_test", { api_host: "https://app.posthog.com" });
