const { test, describe, before, after, it } = require('node:test');
const { Builder, By, until } = require('selenium-webdriver');
const assert = require('node:assert');

describe('Login Test', { timeout: 30000 }, () => {
  let driver;

  before(async () => {
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

  it('should navigate to login page when clicking sign in', async () => {
    // Navigate to homepage
    await driver.get('http://localhost:3000');
    
    // Wait for the sign in button to be present
    let loginBtn = await driver.wait(until.elementLocated(By.id('login-button')), 10000);
    
    // Click the sign in button
    await loginBtn.click();
    
    // Wait for Clerk's sign in form to load (class typically used by clerk)
    await driver.wait(until.elementLocated(By.className('cl-signIn-root')), 10000);
    
    // Verify url contains sign-in
    let currentUrl = await driver.getCurrentUrl();
    assert(currentUrl.includes('sign-in'), 'URL should contain sign-in');
  });
});
