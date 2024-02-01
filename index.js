const puppeteer = require("puppeteer");
const cron = require("node-cron");
const dotenv = require("dotenv");
dotenv.config();

async function clickElementByText() {
  console.log("Running Clock In Script");

  try {
    const browser = await puppeteer.launch({
      headless: "new",
      executablePath:
        process.eng.NODE_ENV === "production"
          ? process.env.PUPPETEER_EXECUTABLE_PATH
          : puppeteer.executablePath(),
    });

    const page = await browser.newPage();
    // await page.setUserAgent(
    //   "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.69 Safari/537.36"
    // );

    // await page.setViewport({
    //   width: 2400,
    //   height: 800,
    // })

    await page.goto("https://theoriamedical.hrhub.ph/EmployeeDashboard.aspx");

    await page.waitForSelector("#username");
    await page.type("#username", "apiñon", { delay: 200 });
    await page.type("#password", process.env.PASS, { delay: 200 });

    await page.click("#kc-login");
    await page.waitForTimeout(15000);

    const clockInOrOutXPath = `//*[text()='Clock In/Out']`;
    const [clockInOrOutButton] = await page.$x(clockInOrOutXPath);
    await clockInOrOutButton.click();

    await page.waitForTimeout(2000);

    const clockInXPath = `//*[text()='Clock In']`;
    const [clockInButton] = await page.$x(clockInXPath);
    await clockInButton.click();

    await page.waitForTimeout(2000);

    await page.click(".btn.our-button");

    await page.waitForTimeout(10000);

    await browser.close();
    console.log("Done Clock In!");
  } catch (err) {
    console.log("Something went wrong");
    console.log(err);
  }
}
console.log("running");
cron.schedule("* * * * *", () => {
  console.log("testing every minute pings");
  let now = new Date();
  console.log(now);
});
cron.schedule(
  "10 1 * * *",
  () => {
    console.log("waiting for 10:45");
    clickElementByText();
  },
  {
    scheduled: true,
    timezone: "Asia/Manila",
  }
);
