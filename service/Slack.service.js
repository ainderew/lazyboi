import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from '../utils/logger.js';
import dotenv from 'dotenv';
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SLACK_USER_DATA_DIR = path.join(__dirname, '..', 'db', 'slack-session');

const SLACK_CHANNEL_ID = process.env.SLACK_CHANNEL_ID;
const NAV_TIMEOUT = 30000;

const CHROME_PATH =
  process.env.NODE_ENV === 'production'
    ? process.env.PUPPETEER_EXECUTABLE_PATH
    : '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

class SlackService {
  /**
   * Opens a visible browser so the user can manually log into Slack once.
   * The session is saved to disk and reused for future automated messages.
   */
  #cleanLock() {
    const lockPath = path.join(SLACK_USER_DATA_DIR, 'SingletonLock');
    try {
      fs.unlinkSync(lockPath);
    } catch {
      // Lock doesn't exist, that's fine
    }
  }

  async setupSession({ headless = false, debugPort = 0 } = {}) {
    this.#cleanLock();

    const args = ['--no-sandbox'];
    if (debugPort) args.push(`--remote-debugging-port=${debugPort}`);

    const browser = await puppeteer.launch({
      headless: headless ? 'new' : false,
      args,
      userDataDir: SLACK_USER_DATA_DIR,
      executablePath: CHROME_PATH,
    });

    const page = await browser.newPage();
    await page.goto('https://theoriamedical.slack.com', {
      waitUntil: 'networkidle2',
      timeout: 60000,
    });

    logger.info('Slack login browser opened — log in manually, then close the browser.');

    await new Promise((resolve) => {
      browser.on('disconnected', resolve);
    });

    logger.info('Slack session saved.');
  }

  async sendMessage(text) {
    if (!SLACK_CHANNEL_ID) {
      logger.error('SLACK_CHANNEL_ID is not set — skipping Slack fallback');
      return false;
    }

    logger.info(`[slack] Starting sendMessage("${text}")`);
    logger.info(`[slack] CHROME_PATH: ${CHROME_PATH}`);
    logger.info(`[slack] userDataDir: ${SLACK_USER_DATA_DIR}`);
    logger.info(`[slack] userDataDir exists: ${fs.existsSync(SLACK_USER_DATA_DIR)}`);

    this.#cleanLock();
    logger.info('[slack] Launching browser...');

    let browser;
    try {
      browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox'],
        userDataDir: SLACK_USER_DATA_DIR,
        executablePath: CHROME_PATH,
      });
      logger.info('[slack] Browser launched');
    } catch (err) {
      logger.error(`[slack] Browser launch failed: ${err.message}`);
      return false;
    }

    let page;
    try {
      page = await browser.newPage();
      logger.info('[slack] New page created');

      page.setDefaultNavigationTimeout(NAV_TIMEOUT);
      page.setDefaultTimeout(NAV_TIMEOUT);

      // Go through workspace URL first so session cookies are recognized
      logger.info('[slack] Navigating to workspace...');
      await page.goto('https://theoriamedical.slack.com', { waitUntil: 'networkidle2', timeout: 60000 });

      // Extract team ID from the redirect URL
      const redirectUrl = page.url();
      logger.info(`[slack] After workspace redirect — URL: ${redirectUrl}`);
      const teamIdMatch = redirectUrl.match(/\/client\/([A-Z0-9]+)\//);
      const teamId = teamIdMatch ? teamIdMatch[1] : null;

      if (!teamId) {
        throw new Error(`Slack session expired — could not extract team ID from: ${redirectUrl}`);
      }

      // Navigate to the specific channel using the correct team ID
      const url = `https://app.slack.com/client/${teamId}/${SLACK_CHANNEL_ID}`;
      logger.info(`[slack] Navigating to channel: ${url}`);
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

      const currentUrl = page.url();
      const title = await page.title();
      logger.info(`[slack] Page loaded — URL: ${currentUrl}, Title: ${title}`);

      // Screenshot after page load
      const screenshotPath = path.join(__dirname, '..', 'logs', 'screenshots', 'slack-debug.png');
      await page.screenshot({ path: screenshotPath, fullPage: true });
      logger.info(`[slack] Screenshot saved: ${screenshotPath}`);

      // Log what's on the page
      const bodyText = await page.evaluate(() => document.body?.innerText?.substring(0, 500));
      logger.info(`[slack] Page body (first 500 chars): ${bodyText}`);

      // Check if we're logged in by waiting for the message input
      logger.info('[slack] Waiting for message input selector...');
      const messageInput = await page.waitForSelector(
        '[data-qa="message_input"] .ql-editor',
        { visible: true, timeout: NAV_TIMEOUT },
      );

      if (!messageInput) {
        throw new Error('Slack session expired — run /slack-setup to re-login');
      }

      logger.info('[slack] Message input found, typing...');
      await messageInput.click();
      await messageInput.type(text, { delay: 100 });
      await page.keyboard.press('Enter');

      await new Promise((resolve) => setTimeout(resolve, 3000));

      logger.info(`[slack] Message sent: "${text}"`);
      return true;
    } catch (err) {
      logger.error(`[slack] Failed: ${err.message}`);
      if (page) {
        const errorScreenshot = path.join(__dirname, '..', 'logs', 'screenshots', 'slack-error.png');
        await page.screenshot({ path: errorScreenshot, fullPage: true }).catch(() => {});
        logger.info(`[slack] Error screenshot saved: ${errorScreenshot}`);
      }
      return false;
    } finally {
      await browser.close();
      logger.info('[slack] Browser closed');
    }
  }
}

export default SlackService;
