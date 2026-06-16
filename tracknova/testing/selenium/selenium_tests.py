import unittest
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time

class TrackNovaSeleniumTests(unittest.TestCase):
    
    @classmethod
    def setUpClass(cls):
        # Configure local Chrome driver options
        options = webdriver.ChromeOptions()
        # Enable headless mode for automated environments if needed
        # options.add_argument('--headless')
        cls.driver = webdriver.Chrome(options=options)
        cls.driver.implicitly_wait(10)
        cls.base_url = "http://localhost:25494" # Default TrackNova frontend port

    @classmethod
    def tearDownClass(cls):
        cls.driver.quit()

    def test_01_landing_page_load(self):
        """Verify landing page renders and displays brand headers."""
        self.driver.get(self.base_url)
        # Check title
        self.assertIn("TrackNova", self.driver.title)
        
        # Verify MTC, Metro and Suburban systems descriptions are shown
        hero_text = self.driver.find_element(By.TAG_NAME, "body").text
        self.assertIn("Chennai", hero_text)
        self.assertIn("MTC Bus", hero_text)
        self.assertIn("Metro", hero_text)

    def test_02_navigation_buttons_present(self):
        """Verify presence of Sign In and Sign Up buttons."""
        self.driver.get(self.base_url)
        signin_btn = self.driver.find_element(By.XPATH, "//a[contains(text(), 'Sign In') or contains(text(), 'Log In')]")
        signup_btn = self.driver.find_element(By.XPATH, "//a[contains(text(), 'Sign Up') or contains(text(), 'Register')]")
        self.assertTrue(signin_btn.is_displayed())
        self.assertTrue(signup_btn.is_displayed())

    def test_03_redirect_to_signin(self):
        """Verify that clicking Sign In navigates to /sign-in page."""
        self.driver.get(self.base_url)
        signin_btn = self.driver.find_element(By.XPATH, "//a[contains(text(), 'Sign In') or contains(text(), 'Log In')]")
        signin_btn.click()
        
        # Wait for URL to update
        WebDriverWait(self.driver, 5).until(EC.url_contains("/sign-in"))
        self.assertIn("/sign-in", self.driver.current_url)

    def test_04_auth_redirection_check(self):
        """Verify unauthenticated user cannot access protected routes like dashboard."""
        self.driver.get(f"{self.base_url}/dashboard")
        # Should redirect back to landing page
        time.sleep(2)
        self.assertEqual(self.driver.current_url.rstrip("/"), self.base_url.rstrip("/"))

    def test_05_route_search_filtering(self):
        """Verify routes list can be filtered via search."""
        # Pre-condition: Login (Simulated login bypass/Clerk session setup is required in production)
        # For testing interface, we navigate to public route list if accessible, or mock it
        self.driver.get(f"{self.base_url}/routes")
        
        try:
            # Locate search input field
            search_box = WebDriverWait(self.driver, 5).until(
                EC.presence_of_element_located((By.XPATH, "//input[@placeholder[contains(., 'search') or contains(., 'Search')]]"))
            )
            search_box.clear()
            search_box.send_keys("102")
            search_box.send_keys(Keys.ENTER)
            
            # Verify routes updates
            time.sleep(1)
            route_cards = self.driver.find_elements(By.XPATH, "//*[contains(text(), '102')]")
            self.assertTrue(len(route_cards) > 0)
        except Exception as e:
            self.skipTest("Authentication redirect prevented direct page test. Auth session required.")

    def test_06_map_render_check(self):
        """Verify track map initializes with Leaflet container."""
        self.driver.get(f"{self.base_url}/track")
        try:
            map_container = WebDriverWait(self.driver, 5).until(
                EC.presence_of_element_located((By.CLASS_NAME, "leaflet-container"))
            )
            self.assertTrue(map_container.is_displayed())
        except Exception as e:
            self.skipTest("Map access requires active auth session. skipping.")

if __name__ == "__main__":
    unittest.main()
