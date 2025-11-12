const puppeteer = require('puppeteer');
const appUrl = 'http://localhost:3000';

const username = 'testing-the-hive@bbd.co.za';
const password = 'testing@thehive';

let browser, page;

let headless = true;

before(async () => {
  browser = await puppeteer.launch({ headless });
  page = await browser.newPage();

  await page.goto(`${appUrl}`);
  await page.waitForSelector('the-hive', { visible: true });

  // Redirect to AzureAD Login Page
  // Enter email address
  let emailInput = 'input[type="email"]';
  await page.waitForSelector(emailInput, { visible: true });
  await page.type(emailInput, username);

  // Click next
  let nextInput = 'input[type="submit"][value="Next"]';
  await page.waitForSelector(nextInput, { visible: true });
  await page.click(nextInput);

  // Redirect to password page
  // Enter password
  let passwordInput = 'input[type="password"]';
  await page.waitForSelector(passwordInput, { visible: true });
  await page.type(passwordInput, password);

  // Click Sign In
  let signInInput = 'input[type="submit"][value="Sign in"]';
  await page.waitForSelector(signInInput, { visible: true });
  await page.click(signInInput);

  // Redirect to home
  await page.waitForNavigation();
});

after(async () => browser.close());

module.exports = {
  getPage: () => page,
  getAppUrl: () => appUrl
};
