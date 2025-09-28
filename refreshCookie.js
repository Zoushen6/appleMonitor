import puppeteer from "puppeteer";

export async function refreshCookies() {
  // 根据环境变量决定是否使用executablePath
  const isProduction = process.env.NODE_ENV === 'production';
  const launchOptions = { headless: "new" };
  
  // 只在非生产环境使用executablePath
  if (!isProduction) {
    launchOptions.executablePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
  }
  
  const browser = await puppeteer.launch(launchOptions);
  const page = await browser.newPage();
  await page.goto("https://www.apple.com.cn/shop/buy-iphone/iphone-17-pro/MG034CH/A");
  const cookies = await page.cookies();
  await browser.close();

  return cookies.map(c => `${c.name}=${c.value}`).join("; ");
}