import puppeteer from "puppeteer";

export async function refreshCookies() {
  const browser = await puppeteer.launch({ headless: "new",executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" });
  const page = await browser.newPage();
  await page.goto("https://www.apple.com.cn/shop/buy-iphone/iphone-17-pro/MG034CH/A");
  const cookies = await page.cookies();
  await browser.close();

  return cookies.map(c => `${c.name}=${c.value}`).join("; ");
}