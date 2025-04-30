const puppeteer = require('puppeteer');
const RecordKeeping = require('./service/RecordKeeping.service');

const dotenv = require('dotenv');
const { LOGIN_MODE } = require('./enums');
const logger = require('./utils/logger');
dotenv.config();

async function automateSprout(mode) {
  console.log('Running Sprout Automation');

  const browser = await puppeteer.launch({
    headless: false,
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

    const rk = new RecordKeeping();
    rk.writeRecord(mode);

    console.log('Done Clock In!');
  } catch (err) {
    await browser.close();
    throw err;
  }
}

module.exports = automateSprout;
