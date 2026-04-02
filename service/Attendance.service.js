import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';
import RecordKeeping from '../service/RecordKeeping.service.js';
import dotenv from 'dotenv';
import { LOGIN_MODE } from '../enums.js';
import retryCatch from '../retryCatch.js';
import SlackService from '../service/Slack.service.js';
import logger from '../utils/logger.js';
import config from '../utils/config.js';
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SCREENSHOTS_DIR = path.join(__dirname, '..', 'logs', 'screenshots');

const NAV_TIMEOUT = 30000;
const ELEMENT_TIMEOUT = 15000;

class AttendanceService {
  recordKeeping;
  slackService;

  constructor() {
    this.recordKeeping = new RecordKeeping();
    this.slackService = new SlackService();
  }

  async #takeScreenshot(page, name) {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filePath = path.join(SCREENSHOTS_DIR, `${name}_${timestamp}.png`);
      await page.screenshot({ path: filePath, fullPage: true });
      logger.info(`Screenshot saved: ${filePath}`);
    } catch (err) {
      logger.error(`Failed to save screenshot: ${err.message}`);
    }
  }

  async performAutomatedAttendance(mode) {
    console.log('Running Sprout Automation');

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox'],
      executablePath:
        process.env.NODE_ENV === 'production'
          ? process.env.PUPPETEER_EXECUTABLE_PATH
          : puppeteer.executablePath(),
    });

    let page;
    try {
      page = await browser.newPage();
      page.setDefaultNavigationTimeout(NAV_TIMEOUT);
      page.setDefaultTimeout(ELEMENT_TIMEOUT);

      await page.setViewport({ width: 2400, height: 800 });

      await page.goto('https://theoriamedical.hrhub.ph/EmployeeDashboard.aspx', {
        waitUntil: 'networkidle2',
      });

      // --- Login ---
      await page.waitForSelector('#username', { visible: true });
      await page.type('#username', 'apiñon', { delay: 200 });
      await page.type('#password', process.env.PASS, { delay: 200 });

      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle2' }),
        page.click('#kc-login'),
      ]);

      // Verify login succeeded — dashboard should have the clock button
      const clockInOrOutButton = await page.waitForSelector(
        '::-p-xpath(//*[text()=\'Clock In/Out\'])',
        { visible: true, timeout: NAV_TIMEOUT },
      );

      if (!clockInOrOutButton) {
        await this.#takeScreenshot(page, 'login-failed');
        throw new Error('Login failed — Clock In/Out button not found after navigation');
      }

      // --- Clock In/Out flow ---
      await clockInOrOutButton.click();

      const clockActionText = mode === LOGIN_MODE.out ? 'Clock Out' : 'Clock In';
      const clockActionButton = await page.waitForSelector(
        `::-p-xpath(//*[text()='${clockActionText}'])`,
        { visible: true },
      );

      if (!clockActionButton) {
        await this.#takeScreenshot(page, `missing-${clockActionText.toLowerCase().replace(' ', '-')}`);
        throw new Error(`${clockActionText} button not found`);
      }

      await clockActionButton.click();

      await page.waitForSelector('.btn.our-button', { visible: true });
      await page.click('.btn.our-button');

      // Wait for confirmation — give the server time to process
      await new Promise((resolve) => setTimeout(resolve, 5000));

      this.recordKeeping.writeRecord(mode);
      logger.info(`Attendance ${mode} completed successfully`);
    } catch (err) {
      if (page) await this.#takeScreenshot(page, `error-${mode}`);
      this.recordKeeping.writeFailedAttempt(mode);
      throw err;
    } finally {
      await browser.close();
    }
  }

  async scheduleAttendance(mode) {
    const NUMBER_OF_RETRIES = 10;
    const MAX_HOURLY_RETRIES = 3;
    const ONE_HOUR_IN_MS = 3600000;
    const randomNum = Math.floor(Math.random() * (30 - 1 + 1)) + 1;
    const randomMinuteDelay = randomNum * 1000 * 60;

    const nextSproutAutomationData = {
      time: `${mode === 'in' ? '20' : '7'}:${String(randomNum).padStart(2, '0')}`,
      mode: mode,
    };
    config.NEXT_SPROUT_AUTOMATION = nextSproutAutomationData;

    function sleep(ms) {
      return new Promise((resolve) => setTimeout(resolve, ms));
    }

    await sleep(randomMinuteDelay);

    // Run Sprout login and Slack message in parallel
    const sproutPromise = this.#performSproutWithRetries(mode, NUMBER_OF_RETRIES, MAX_HOURLY_RETRIES, ONE_HOUR_IN_MS);
    const slackPromise = this.#sendSlackMessage(mode);

    await Promise.allSettled([sproutPromise, slackPromise]);
  }

  async #performSproutWithRetries(mode, retries, maxHourlyRetries, oneHourMs) {
    function sleep(ms) {
      return new Promise((resolve) => setTimeout(resolve, ms));
    }

    const isSuccessful = await retryCatch(
      this.performAutomatedAttendance.bind(this),
      mode,
      retries,
      this.recordKeeping,
    );

    if (!isSuccessful) {
      for (let hourlyAttempt = 0; hourlyAttempt < maxHourlyRetries; hourlyAttempt++) {
        console.log(`Hourly retry ${hourlyAttempt + 1}/${maxHourlyRetries}`);
        await sleep(oneHourMs);

        const retrySuccess = await retryCatch(
          this.performAutomatedAttendance.bind(this),
          mode,
          retries,
          this.recordKeeping,
        );

        if (retrySuccess) return;
      }

      console.error(`All hourly retries exhausted for mode: ${mode}`);
    }
  }

  async #sendSlackMessage(mode) {
    const message = mode === LOGIN_MODE.in ? 'In' : 'Out';
    logger.info(`Sending Slack message: "${message}"`);
    const sent = await this.slackService.sendMessage(message);

    if (sent) {
      this.recordKeeping.writeRecord(`${mode}-slack`);
    }
  }
}
export default AttendanceService;
