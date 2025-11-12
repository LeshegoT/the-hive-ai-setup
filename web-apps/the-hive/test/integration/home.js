const puppeteer = require('puppeteer');
const expect = require('chai').expect;
const { getPage, getAppUrl } = require('./shared');

describe('Home page', function() {
  let page, appUrl;
  
  before(async function() {
    page = getPage();
    appUrl = getAppUrl();

    await page.goto(`${appUrl}`);
    await page.waitForSelector('the-hive', { visible: true });

  });

  it('should contain title', async function() {
    let home_component = await page.evaluate(
      () =>
        document
          .querySelector('the-hive')
          .shadowRoot.querySelector('e-home')
    );

    expect(home_component).to.be.ok;
  });
});
