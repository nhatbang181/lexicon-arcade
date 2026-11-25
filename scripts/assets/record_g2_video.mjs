#!/usr/bin/env node
/**
 * Record a 4-5s interaction video of #/dev/components on iPhone 390x844
 * for Gate G2 visual verification (saved to docs/audit-max/anh-sau/T3-A/dev-components-390-demo.webm).
 */
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from '@playwright/test';

const ROOT = process.cwd();
const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:5241';
const OUT_DIR = path.join(ROOT, 'docs', 'audit-max', 'anh-sau', 'T3-A');
const FINAL_VIDEO = path.join(OUT_DIR, 'dev-components-390-demo.webm');

fs.mkdirSync(OUT_DIR, { recursive: true });

async function main() {
  const channel = process.env.PW_CHANNEL || 'chrome';
  const browser = await chromium.launch({ headless: true, channel });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    recordVideo: { dir: OUT_DIR, size: { width: 390, height: 844 } },
  });
  const page = await context.newPage();
  const video = page.video();

  try {
    await page.goto(`${BASE_URL}/#/dev/components`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);

    // 1. Scroll to LiveCard & FX showcase
    const fxSec = page.getByTestId('dev-livecard-fx-showcase');
    await fxSec.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);

    // 2. Flip 3D LiveCard front -> back
    await page.getByTestId('dev-flip-3d-btn').click();
    await page.waitForTimeout(800);

    // 3. Fire FX sparks + +15 XP pop + wrong-card shake
    await page.getByTestId('dev-fx-spark-btn').click();
    await page.waitForTimeout(600);
    await page.getByTestId('dev-fx-shake-btn').click();
    await page.waitForTimeout(600);

    // 4. Switch to Light theme & flip back
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(300);
    await page.getByRole('button', { name: 'Theme Light' }).click();
    await page.waitForTimeout(500);
    await fxSec.scrollIntoViewIfNeeded();
    await page.getByTestId('dev-flip-3d-btn').click();
    await page.waitForTimeout(700);
  } finally {
    await context.close();
    await browser.close();
  }

  if (video) {
    const rawPath = await video.path();
    if (fs.existsSync(FINAL_VIDEO)) fs.unlinkSync(FINAL_VIDEO);
    fs.renameSync(rawPath, FINAL_VIDEO);
    console.log(`Saved G2 demo video: ${path.relative(ROOT, FINAL_VIDEO)} (${(fs.statSync(FINAL_VIDEO).size / 1024).toFixed(1)} KB)`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
