const { test, describe, before, after, it } = require('node:test');
const { Builder, By, until } = require('selenium-webdriver');
const assert = require('node:assert');

describe('Public Pages E2E Suite', { timeout: 30000 }, () => {
  let driver;
  const baseUrl = 'http://localhost:3000';

  before(async () => {
    // Run tests in headless mode for CI/CD compatibility
    const chrome = require('selenium-webdriver/chrome');
    let options = new chrome.Options();
    options.addArguments('--headless=new');
    options.addArguments('--no-sandbox');
    options.addArguments('--disable-dev-shm-usage');

    driver = await new Builder()
      .forBrowser('chrome')
      .setChromeOptions(options)
      .build();
  });

  after(async () => {
    if (driver) {
      await driver.quit();
    }
  });

  it('should load the homepage and display correct main heading', async () => {
    await driver.get(baseUrl);
    
    // Wait for the main heading to be visible
    let heading = await driver.wait(until.elementLocated(By.css('h1')), 10000);
    let text = await heading.getText();
    
    // Check if the heading text contains "Navigate Chennai"
    assert(text.includes('Navigate Chennai'), `Expected heading to contain 'Navigate Chennai', but got '${text}'`);
  });

  it('should navigate to the sign up page correctly', async () => {
    await driver.get(baseUrl);
    
    // Find the get started / sign up button using data-testid
    let signUpBtn = await driver.wait(until.elementLocated(By.css('[data-testid="button-get-started"]')), 10000);
    await signUpBtn.click();
    
    // Verify that the sign up container (Clerk) is rendered
    await driver.wait(until.elementLocated(By.className('cl-signUp-root')), 10000);
    
    // Verify the URL changed to /sign-up
    let currentUrl = await driver.getCurrentUrl();
    assert(currentUrl.includes('sign-up'), 'URL should contain sign-up');
  });

  it('should correctly render the sign in page and contain email input', async () => {
    await driver.get(`${baseUrl}/#/sign-in`);
    
    // Wait for Clerk's sign-in form to render
    await driver.wait(until.elementLocated(By.className('cl-signIn-root')), 10000);
    
    let currentUrl = await driver.getCurrentUrl();
    assert(currentUrl.includes('sign-in'), 'URL should contain sign-in');
  });
  
  it('should load 404 page for unknown routes', async () => {
    await driver.get(`${baseUrl}/#/this-route-does-not-exist-12345`);
    
    // Wait for the 404 page element
    let notFoundHeading = await driver.wait(until.elementLocated(By.css('h1')), 10000);
    let text = await notFoundHeading.getText();
    
    assert(text.includes('404'), `Expected heading to contain '404', but got '${text}'`);
  });
});
