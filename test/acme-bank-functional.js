'use strict'

const { Builder, By } = require('selenium-webdriver');
const { Eyes, 
    VisualGridRunner, 
    RunnerOptions,
    Target,
    Configuration, 
    BatchInfo, } = require('@applitools/eyes-selenium');

describe('ACME Bank', () => {
    // This Mocha test case class contains everything needed to run a full visual test against the ACME bank site.
    // It runs the test once locally,
    // and then it performs cross-browser testing against multiple unique browsers in Applitools Ultrafast Grid.

    // Test control inputs to read once and share for all tests
    var applitoolsApiKey;
    var headless;

    // Applitools objects to share for all tests
    let batch;
    let config;
    let runner;
    
    // Test-specific objects
    let driver;
    let eyes;

    before(async () => {
        // This method sets up the configuration for running visual tests in the Ultrafast Grid.
        // The configuration is shared by all tests in a test suite, so it belongs in a `before` method.
        // If you have more than one test class, then you should abstract this configuration to avoid duplication. 


        // Read the Applitools API key from an environment variable.
        // To find your Applitools API key:
        // https://applitools.com/tutorials/getting-started/setting-up-your-environment.html
        applitoolsApiKey = process.env.APPLITOOLS_API_KEY;

        // Read the headless mode setting from an environment variable.
        // Use headless mode for Continuous Integration (CI) execution.
        // Use headed mode for local development.
        headless = process.env.HEADLESS? ['headless'] : []

        // Create the runner for the Ultrafast Grid.
        // Concurrency refers to the number of visual checkpoints Applitools will perform in parallel.
        // Warning: If you have a free account, then concurrency will be limited to 1.
        runner = new VisualGridRunner(new RunnerOptions().testConcurrency(5));

        // Create a new batch for tests.
        // A batch is the collection of visual checkpoints for a test suite.
        // Batches are displayed in the Eyes Test Manager, so use meaningful names.
        batch = new BatchInfo('Example: Selenium JavaScript Mocha with the Ultrafast Grid');

        // Create a configuration for Applitools Eyes.
        config = new Configuration();
        
        // Set the Applitools API key so test results are uploaded to your account.
        // If you don't explicitly set the API key with this call,
        // then the SDK will automatically read the `APPLITOOLS_API_KEY` environment variable to fetch it.
        config.setApiKey(applitoolsApiKey);

        // Set the batch for the config.
        config.setBatch(batch);
        
        
    });
    
    beforeEach(async function() {
        //This method sets up each test with its own ChromeDriver and Applitools Eyes objects.
       
        // Open the browser with the ChromeDriver instance.
        // Even though this test will run visual checkpoints on different browsers in the Ultrafast Grid,
        // it still needs to run the test one time locally to capture snapshots.

        let executionCloudUrl = await Eyes.getExecutionCloudUrl()
        driver = await new Builder()
            .withCapabilities({
            browserName: 'chrome',
            })
            .usingServer(executionCloudUrl)
            .build()
            console.log(executionCloudUrl)

        // Set an implicit wait of 10 seconds.
        // For larger projects, use explicit waits for better control.
        // https://www.selenium.dev/documentation/webdriver/waits/
        // The following call works for Selenium 4:
        // await driver.manage().setTimeouts( { implicit: 10000 } );

        // If you are using Selenium 3, use the following call instead:
        // await driver.manage().timeouts().implicitlyWait(10000);
        
        // Create the Applitools Eyes object connected to the VisualGridRunner and set its configuration.
        eyes = new Eyes(runner);
        eyes.setConfiguration(config);

        // Open Eyes to start visual testing.
        // It is a recommended practice to set all four inputs:
        await eyes.open(
            
            // WebDriver object to "watch".
            driver,
            
            // The name of the application under test.
            // All tests for the same app should share the same app name.
            // Set this name wisely: Applitools features rely on a shared app name across tests.
            'Selenium Test',
            
            // The name of the test case for the given application.
            // Additional unique characteristics of the test may also be specified as part of the test name,
            // such as localization information ("Home Page - EN") or different user permissions ("Login by admin"). 
            this.currentTest.fullTitle(),
            
            // The viewport size for the local browser.
            // Eyes will resize the web browser to match the requested viewport size.
            // This parameter is optional but encouraged in order to produce consistent results.
            
        );
    })

    it('Should Add Item To Cart', async () => {
        // This test covers login for the Applitools demo site, which is a dummy banking app.
        // The interactions use typical Selenium calls,
        // but the verifications use one-line snapshot calls with Applitools Eyes.
        // If the page ever changes, then Applitools will detect the changes and highlight them in the Eyes Test Manager.
        // Traditional assertions that scrape the page for text values are not needed here.

        // Load the login page.
        await driver.get("https://applitools-demo-ecommerce.vercel.app/products/music/awesome-bronze-pants/");
        console.log("Visit Website")
        
        // Verify the product page loaded correctly.
        await eyes.check(Target.window().fully().withName("Home Page"));
        console.log("Verify Product Page")
        
        // Click Item.
        await driver.findElement(By.id("buyButton")).click();
        console.log("Click Buy Now")
        
        // Wait 10 Seconds.
        await driver.sleep(10000);

        // Click Item.
        await driver.findElement(By.id("buyButton")).click();
        console.log("Click Buy Now")
        
        // Wait 10 Seconds.
        await driver.sleep(10000);

         // Click Cart
        await driver.findElement(By.className("cart-button-module--cartButton--m4LbS")).click();
        console.log("Click Cart")
        
        // Verify the cart page loaded correctly.
        await eyes.check(Target.window().fully().withName("Cart").layout());
        console.log("Verify Cart Page")
        await driver.sleep(10000);

        // Click Checkout.
        await driver.findElement(By.className("cart-module--checkoutButton--T0q0g")).click();
        console.log("Click Checkout")
        await driver.sleep(10000);
        console.log("Waiting")
       
        // Verify the full main page loaded correctly.
        await eyes.check(Target.window().fully().withName("Checkout").layout());
        console.log("Verify Checkout")
    });
    
    afterEach(async function() {

        // Close Eyes to tell the server it should display the results.
        await eyes.closeAsync();

        // Quit the WebDriver instance.
        await driver.quit();
        // Warning: `eyes.closeAsync()` will NOT wait for visual checkpoints to complete.
        // You will need to check the Eyes Test Manager for visual results per checkpoint.
        // Note that "unresolved" and "failed" visual checkpoints will not cause the Mocha test to fail.
        // If you want the ACME demo app test to wait synchronously for all checkpoints to complete, then use `eyes.close()`.
        // If any checkpoints are unresolved or failed, then `eyes.close()` will make the ACME demo app test fail.
    
    });
    
    after(async () => {
    
        // Close the batch and report visual differences to the console.
        // Note that it forces Mocha to wait synchronously for all visual checkpoints to complete.
        const allTestResults = await runner.getAllTestResults();
        console.log(allTestResults);
    });
})
