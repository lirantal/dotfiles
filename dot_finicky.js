// ~/.finicky.js
export default {
  defaultBrowser: "Vivaldi",
  /*
  rewrite: [
    {
      // Redirect all x.com urls to use xcancel.com
      match: "x.com/*",
      url: (url) => {
        url.host = "xcancel.com";
        return url;
      },
    },
  ],
  */
  handlers: [
    {
      // Open all bsky.app urls in Firefox
      match: "bsky.app/*",
      browser: "Vivladi",
    },
    {
      // Open google.com and *.google.com urls in Google Chrome
      match: [
        "google.com/*", // match google.com urls
        "*.google.com*", // also match google.com subdomains
        "*.atlassian.net/*",
        "github.com/snyk/*",
	"github.com/snyk-*",
        "app.snyk.io/*",
        "snyk.interactgo.com/*",
        "*.workday.com/*",
        "*.myworkday.com/*",
        "*.looker.com/*",
        "snyksec.lightning.force.com/*",
	"https://evo.dev.snyk.io/",
	"evo.*",
        "file://*",
	"https://app.amplitude.com/analytics/snyk/*",
	"https://snyk.highspot.com/*",
	"https://claude.ai/*",
	"https://auth.openai.com/*",
      ],
      browser: "Google Chrome",
    },
  ],
};
