// scripts/lighthouse-ci.js
const lighthouse = require("lighthouse");
const chromeLauncher = require("chrome-launcher");

async function runLighthouse() {
  const chrome = await chromeLauncher.launch({ chromeFlags: ["--headless"] });

  const options = {
    logLevel: "info",
    output: "html",
    onlyCategories: ["performance", "pwa", "accessibility"],
    port: chrome.port,
  };

  const runnerResult = await lighthouse("http://localhost:3000", options);

  // Extract scores
  const { performance, pwa, accessibility } = runnerResult.lhr.categories;

  console.log("Lighthouse Scores:");
  console.log(`Performance: ${Math.round(performance.score * 100)}`);
  console.log(`PWA: ${Math.round(pwa.score * 100)}`);
  console.log(`Accessibility: ${Math.round(accessibility.score * 100)}`);

  // Fail if scores below threshold
  if (performance.score < 0.9 || pwa.score < 0.9 || accessibility.score < 0.9) {
    process.exit(1);
  }

  await chrome.kill();
}

runLighthouse().catch(console.error);
