import puppeteer from 'puppeteer';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function captureScreenshot() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();

    // Set viewport to reasonable desktop size
    await page.setViewport({ width: 1400, height: 900 });

    // Navigate to production URL
    await page.goto('https://imago-coding-challenge.vercel.app', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    // Wait a moment for any client-side rendering
    await page.waitForSelector('input[type="text"]', { timeout: 10000 });

    // Type a search query to show results with highlighting
    const searchInput = await page.$('input[type="text"]');
    if (searchInput) {
      await searchInput.type('München Stadtansicht', { delay: 50 });

      // Wait for search results to load
      await page.waitForFunction(
        () => document.querySelector('[class*="highlight"]') !== null ||
              document.querySelectorAll('[role="article"]').length > 0 ||
              document.querySelectorAll('article').length > 0,
        { timeout: 10000 }
      ).catch(() => console.log('No highlight found, proceeding anyway'));

      // Small delay for UI to settle
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Capture screenshot
    const outputPath = join(__dirname, '..', 'public', 'screenshot.png');
    await page.screenshot({
      path: outputPath,
      type: 'png',
      fullPage: false
    });

    console.log(`Screenshot saved to: ${outputPath}`);

  } finally {
    await browser.close();
  }
}

captureScreenshot().catch(console.error);
