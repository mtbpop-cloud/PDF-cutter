from playwright.sync_api import sync_playwright
import os

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    page.on("console", lambda msg: print(f"Console: {msg.text}"))
    page.on("pageerror", lambda exc: print(f"Error: {exc}"))
    
    page.goto('http://localhost:8000')
    
    # Create a dummy PNG file
    with open("test.png", "wb") as f:
        # 1x1 transparent PNG
        f.write(b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82')
        
    # Wait for the drop zone to be ready
    dropData = page.evaluate_handle(
        """() => {
            const dt = new DataTransfer();
            const file = new File(['123'], 'test.png', { type: 'image/png' });
            dt.items.add(file);
            return dt;
        }"""
    )
    # Simulate drop
    page.locator("#dropZone").dispatch_event("drop", {"dataTransfer": dropData})
    
    page.wait_for_timeout(2000)
    
    # Check if settings section became visible
    hidden = page.evaluate("document.getElementById('settingsSection').hidden")
    print(f"Settings Section Hidden: {hidden}")
    
    browser.close()
