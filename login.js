const puppeteer = require("puppeteer");

const dotenv = require("dotenv");
dotenv.config();

async function clickElementByText(mode) {
  console.log("Running Clock In Script");

  try {
    const browser = await puppeteer.launch({
      headless: "false",
      executablePath:
        process.env.NODE_ENV === "production"
          ? process.env.PUPPETEER_EXECUTABLE_PATH
          : puppeteer.executablePath(),
    });

    const page = await browser.newPage();
    await page.setViewport({
      width: 2400,
      height: 800,
    });

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


    let clockInXPath;
    if(mode === "out"){
      clockInXPath = `//*[text()='Clock Out']`
    }else{
      clockInXPath = `//*[text()='Clock In']`
    }

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


module.exports = clickElementByText