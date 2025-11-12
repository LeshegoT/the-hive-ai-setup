const expect = require('chai').expect;
const { getPage, getAppUrl } = require('./shared');

describe('Level Up', function() {
  let page, appUrl, trackTitle;

  before(async function() {
    page = getPage();
    appUrl = getAppUrl();
  });

  it('should load section title', async function() {
    await testSectionTitleLoad(page, appUrl, 'csharp', 'intro', 'Introduction to C#');
    await testSectionTitleLoad(page, appUrl, 'csharp', 'serialization', 'Serialization');
    await testSectionTitleLoad(page, appUrl, 'java', 'installing', 'Installing Java');
    await testSectionTitleLoad(page, appUrl, 'java', 'spring-rest', 'Spring REST');
  });

  it('should load section content', async function() {
    await testSectionContentLoad(page, appUrl, 'csharp', 'intro', 'With the introduction of the .NET Framework');
    await testSectionContentLoad(page, appUrl, 'csharp', 'serialization', 'Serialization is the process of converting');
    await testSectionContentLoad(page, appUrl, 'java', 'installing', 'To run Java programs on your computer');
    await testSectionContentLoad(page, appUrl, 'java', 'spring-rest', 'REST has quickly become the');
  });
});

async function testSectionTitleLoad(page, appUrl, course, section, sectionTitleText) {
  await sectionLoaded(page, appUrl, course, section, 'e-section-title');

  const sectionTitle = await page.evaluate(() =>
    document
      .querySelector('the-hive')
      .shadowRoot.querySelector('e-section')
      .shadowRoot.querySelector('e-section-title')
      .shadowRoot.querySelector('e-title')
  );

  expect(sectionTitle.__name).equal(sectionTitleText);
}

async function testSectionContentLoad(page, appUrl, course, section, sectionContentTextPart) {
  await sectionLoaded(page, appUrl, course, section, 'e-section-content');

  const sectionContentP = await page.evaluate(() =>
    document
      .querySelector('the-hive')
      .shadowRoot.querySelector('e-section')
      .shadowRoot.querySelector('e-section-content')
      .shadowRoot.querySelector('body > p:first-child')
  );

  if (!sectionContentP) {
    await page.waitForFunction(
      `document.querySelector('the-hive').shadowRoot.querySelector('e-section').shadowRoot.querySelector('e-section-content').shadowRoot.querySelector('body > p:first-child') !== ${sectionContentP}`
    );
  }

  const sectionContent = await page.evaluate(
    () =>
      document
        .querySelector('the-hive')
        .shadowRoot.querySelector('e-section')
        .shadowRoot.querySelector('e-section-content')
        .shadowRoot.querySelector('body > p:first-child').textContent
  );

  expect(sectionContent).to.include(sectionContentTextPart);
}

async function sectionLoaded(page, appUrl, course, section, currentSelector) {
  await page.goto(`${appUrl}/course/${course}/section/${section}`);
  await page.waitForSelector('the-hive', { visible: true });

  const initialSectionTitle = await page.evaluate(
    (currentSelector) =>
      document
        .querySelector('the-hive')
        .shadowRoot.querySelector('e-section')
        .shadowRoot.querySelector(currentSelector),
    currentSelector
  );

  await page.waitForFunction(
    `document
        .querySelector('the-hive')
        .shadowRoot.querySelector('e-section')
        .shadowRoot.querySelector('${currentSelector}') !== ${initialSectionTitle}`
  );
}
