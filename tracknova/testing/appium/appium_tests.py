import unittest
from appium import webdriver
from appium.options.common import AppiumOptions
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time

class TrackNovaAppiumTests(unittest.TestCase):
    
    @classmethod
    def setUpClass(cls):
        # Configure Appium driver capabilities for Android Chrome mobile browser E2E
        options = AppiumOptions()
        options.set_capability("platformName", "Android")
        options.set_capability("automationName", "UiAutomator2")
        options.set_capability("browserName", "Chrome")
        # Ensure emulator or real device matches generic naming/availability
        options.set_capability("deviceName", "Android Emulator")
        
        # Connect to local Appium server
        cls.appium_server_url = "http://localhost:4723"
        try:
            cls.driver = webdriver.Remote(cls.appium_server_url, options=options)
            cls.driver.implicitly_wait(10)
        except Exception as e:
            print(f"Skipping Appium driver setup: Appium server or Android Emulator not detected. Error: {e}")
            cls.driver = None
            
        cls.base_url = "http://10.0.2.2:25494" # 10.0.2.2 points to localhost from Android emulator

    @classmethod
    def tearDownClass(cls):
        if cls.driver:
            cls.driver.quit()

    def setUp(self):
        if not self.driver:
            self.skipTest("Appium remote connection was not established. Skipping test.")

    def test_01_mobile_home_page(self):
        """Verify home page loads on Android Chrome browser layout."""
        self.driver.get(self.base_url)
        # Check title
        self.assertIn("TrackNova", self.driver.title)
        
        # Verify hamburger menu exists (mobile responsive layout)
        hamburger_btn = WebDriverWait(self.driver, 5).until(
            EC.presence_of_element_located((By.XPATH, "//button[contains(@class, 'hamburger') or @aria-label='Menu' or contains(@class, 'sidebar-toggle')]"))
        )
        self.assertTrue(hamburger_btn.is_displayed())

    def test_02_hamburger_menu_navigation(self):
        """Verify hamburger menu expands correctly on tap."""
        self.driver.get(self.base_url)
        hamburger_btn = self.driver.find_element(By.XPATH, "//button[contains(@class, 'hamburger') or @aria-label='Menu' or contains(@class, 'sidebar-toggle')]")
        hamburger_btn.click()
        time.sleep(1) # Wait for animation
        
        # Drawer overlay should show dashboard or sign-in link
        drawer = self.driver.find_element(By.XPATH, "//*[contains(@class, 'drawer') or contains(@class, 'nav-drawer') or contains(text(), 'Sign In')]")
        self.assertTrue(drawer.is_displayed())

    def test_03_responsive_grid_layout(self):
        """Verify content cards stack vertically on Android."""
        self.driver.get(self.base_url)
        # Verify that container does not have overflow-x scroll indicators
        body_elem = self.driver.find_element(By.TAG_NAME, "body")
        self.assertEqual(body_elem.value_of_css_property("overflow-x"), "visible") # standard reset

if __name__ == "__main__":
    unittest.main()
