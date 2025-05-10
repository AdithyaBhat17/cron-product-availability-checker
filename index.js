require("dotenv").config();
const express = require("express");
const puppeteer = require("puppeteer");
const cors = require("cors");
const axios = require("axios");

const app = express();
const port = 3000;

// Replace with your actual Slack webhook URL
const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;

async function sendSlackNotification(message) {
  try {
    console.log("Sending Slack notification:", message);
    await axios.post(SLACK_WEBHOOK_URL, { text: message });
  } catch (err) {
    console.error("Failed to send Slack notification:", err.message);
  }
}

app.use(cors());
app.use(express.json());

app.get("/check-availability", async (req, res) => {
  try {
    const browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();
    await page.goto(
      "https://kriega.in/products/kriega-hydration-tube-mount-for-quadloc-lite-harness",
      {
        waitUntil: "networkidle0",
      }
    );

    // Check if the button is disabled
    const isButtonDisabled = await page.evaluate(() => {
      const button = document.querySelector(
        ".product-form__submit.button.button--full-width.button--primary"
      );
      return button ? button.disabled : true;
    });

    await browser.close();

    const available = !isButtonDisabled;
    if (available) {
      await sendSlackNotification(
        "Kriega Hydration Tube Mount for Quadloc-Lite™ Harness is AVAILABLE! https://kriega.in/products/kriega-hydration-tube-mount-for-quadloc-lite-harness"
      );
    } else {
      await sendSlackNotification(
        "Kriega Hydration Tube Mount for Quadloc-Lite™ Harness is NOT AVAILABLE! https://kriega.in/products/kriega-hydration-tube-mount-for-quadloc-lite-harness"
      );
    }

    res.json({
      available,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({
      error: "Failed to check availability",
      message: error.message,
    });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
