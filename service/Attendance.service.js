import puppeteer from 'puppeteer';
import RecordKeeping from '../service/RecordKeeping.service.js';
import dotenv from 'dotenv';
import { LOGIN_MODE } from '../enums.js';
import retryCatch from '../retryCatch.js';
import config from '../utils/config.js';
dotenv.config();

class AttendanceService {
  recordKeeping;

  constructor() {
    this.recordKeeping = new RecordKeeping();
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

    try {
      const page = await browser.newPage();
      await page.setViewport({
        width: 2400,
        height: 800,
      });

      await page.goto('https://theoriamedical.hrhub.ph/EmployeeDashboard.aspx');

      await page.waitForSelector('#username');
      await page.type('#username', 'apiñon', { delay: 200 });
      await page.type('#password', process.env.PASS, { delay: 200 });

      await page.click('#kc-login');
      await page.waitForTimeout(15000);

      const clockInOrOutXPath = `//*[text()='Clock In/Out']`;
      const [clockInOrOutButton] = await page.$x(clockInOrOutXPath);

      if (!clockInOrOutButton) {
        throw new Error('Button does not exist');
      }

      await clockInOrOutButton.click();

      await page.waitForTimeout(2000);

      let clockInXPath;
      if (mode === LOGIN_MODE.out) {
        clockInXPath = `//*[text()='Clock Out']`;
      } else {
        clockInXPath = `//*[text()='Clock In']`;
      }

      const [clockInButton] = await page.$x(clockInXPath);

      if (!clockInButton) {
        throw new Error('Clock in button does not exist');
      }

      await clockInButton.click();

      await page.waitForTimeout(2000);

      await page.click('.btn.our-button');

      await page.waitForTimeout(10000);

      await browser.close();

      this.recordKeeping.writeRecord(mode);
    } catch (err) {
      this.recordKeeping.writeFailedAttempt(mode);
      await browser.close();
      throw err;
    }
  }

  async scheduleAttendance(mode) {
    const NUMBER_OF_RETRIES = 10;
    const ONE_HOUR_IN_MS = 3600000;
    const randomNum = Math.floor(Math.random() * (30 - 1 + 1)) + 1;
    const randomMinuteDelay = randomNum * 1000 * 60;

    const nextSproutAutomationData = {
      time: `${mode === 'in' ? '8' : '7'}:${randomNum}`,
      mode: mode,
    };
    config.NEXT_SPROUT_AUTOMATION = nextSproutAutomationData;

    function sleep(ms) {
      return new Promise((resolve) => setTimeout(resolve, ms));
    }

    await sleep(randomMinuteDelay);

    const isSuccessful = await retryCatch(
      this.performAutomatedAttendance.bind(this),
      mode,
      NUMBER_OF_RETRIES,
      this.recordKeeping,
    );

    if (!isSuccessful) {
      await sleep(ONE_HOUR_IN_MS);
      this.scheduleAttendance(mode);
    }
  }
}
export default AttendanceService;
