const { Builder, By, until } = require('selenium-webdriver');
const assert = require('assert');

describe('Login Test', function() {
  this.timeout(30000); // 30 seconds timeout
  let driver;

  before(async function() {
    driver = await new Builder().forBrowser('chrome').build();
  });

  after(async function() {
    await driver.quit();
  });

  it('should navigate to login page when clicking sign in', async function() {
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
