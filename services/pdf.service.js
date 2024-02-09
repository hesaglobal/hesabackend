const puppeteer = require("puppeteer");
const { env } = require("../db/constant");
module.exports = {
  generatePdf: async (html) => {
    let params = {headless: true};
        if (env.NODE_ENV.toLowerCase() !== "development") {
            params.executablePath = "/usr/bin/chromium-browser"
        }
    const browser = await puppeteer.launch(params);
    const page = await browser.newPage();
    await page.setContent(html, {
      waitUntil: "networkidle2",
    });
    await page.emulateMediaType("screen");
    const scrollDimension = await page.evaluate(() => {
      return {
        width: document.scrollingElement.scrollWidth,
        height: document.scrollingElement.scrollHeight,
      };
    });
    await page.setViewport({
      width: scrollDimension.width,
      height: scrollDimension.height,
    });
    const data = await page.pdf({
      width: scrollDimension.width,
      height: scrollDimension.height,
      printBackground: true,
      preferCSSPageSize:true,
      format:'LETTER'
    });
    await browser.close();
    let pdf = data.toString('base64')
    return pdf
  },
};
