import axios from 'axios';
import config from './config.js';
import { refreshCookies } from './refreshCookie.js';
import {dataTest} from './data-test.js';
const cookie = await refreshCookies();
config.cookie.value = cookie;
/**
 * 使用 axios + cookie 模拟请求的苹果库存检查 Demo
 * 演示如何通过设置合适的请求头和 Cookie 来绕过反爬虫检测
 */
class AppleInventoryChecker {
  constructor() {
    // 从配置文件读取设置
    this.baseUrl = config.request.baseUrl;
    this.productId = config.product.id;
    this.location = config.location;
    
    // 创建 axios 实例，设置默认配置
    this.client = axios.create({
      timeout: config.request.timeout,
      headers: config.headers.base
    });
    
    // 设置随机用户代理
    this.setRandomUserAgent();
  }

  /**
   * 设置随机用户代理
   */
  setRandomUserAgent() {
    const userAgent = config.userAgent.getRandom();
    this.client.defaults.headers['User-Agent'] = userAgent;
    
    if (config.debug.enabled) {
      console.log('🔄 使用随机 User-Agent:', userAgent);
    }
  }

  /**
   * 设置 Cookie（从配置文件或环境变量）
   */
  setCookie(cookie = null) {
    // 优先级：传入参数 > 配置文件 > 环境变量
    const finalCookie = cookie || config.cookie.getCookie();
    // console.log('finalCookie',finalCookie);
    if (finalCookie) {
      this.client.defaults.headers['Cookie'] = finalCookie;
      console.log('✅ Cookie 已设置');
      
      if (config.debug.enabled) {
        console.log('🍪 Cookie 内容:', finalCookie.substring(0, 100) + '...');
      }
    } else {
      console.log('⚠️  未设置 Cookie，可能无法通过反爬虫检测');
      console.log('💡 请在 config.js 中设置 cookie.value 或设置环境变量 APPLE_COOKIE');
    }
  }

  /**
   * 构建库存查询 URL
   */
  buildInventoryUrl() {
    const params = new URLSearchParams({
      'fae': 'true',
      'mts.0': 'regular',
      'mts.1': 'compact',
      'location': this.location,
      'product': this.productId
    });
    
    return `${this.baseUrl}?${params.toString()}`;
  }

  /**
   * 随机延迟
   */
  async randomDelay(min = 1000, max = 3000) {
    const delay = Math.floor(Math.random() * (max - min + 1)) + min;
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  /**
   * 先访问苹果主页建立会话
   */
  async establishSession() {
    try {
      console.log('🌐 正在建立会话...');
      
      // 随机延迟
      await this.randomDelay(500, 1500);
      
      // 访问苹果主页
      await this.client.get('https://www.apple.com.cn/', {
        timeout: 10000,
        headers: {
          ...this.client.defaults.headers,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          'Upgrade-Insecure-Requests': '1'
        }
      });
      
      // 再次随机延迟
      await this.randomDelay(1000, 2000);
      
      console.log('✅ 会话建立成功');
      return true;
    } catch (error) {
      console.log('⚠️  会话建立失败，继续尝试:', error.message);
      return false;
    }
  }

  /**
   * 检查苹果库存
   */
  async checkInventory() {
    try {
      // 先建立会话
      await this.establishSession();
      
      const url = this.buildInventoryUrl();
      console.log('🍎 正在检查苹果库存...');
      console.log(`📱 产品ID: ${this.productId}`);
      console.log(`📍 位置: ${this.location}`);
      console.log(`🔗 请求URL: ${url}`);
      
      // 添加更多请求头来模拟真实浏览器
      const response = await this.client.get(url, {
        headers: {
          ...this.client.defaults.headers,
          'Accept': 'application/json, text/plain, */*',
          'Sec-Fetch-Dest': 'empty',
          'Sec-Fetch-Mode': 'cors',
          'Sec-Fetch-Site': 'same-origin'
        }
      });
      
      if (response.status === 200) {
        console.log('✅ 请求成功！');
        return this.parseInventoryData(response.data);
      } else {
        throw new Error(`HTTP错误: ${response.status}`);
      }
      
    } catch (error) {
      console.error('❌ 检查库存时发生错误:', error.message);
      
      if (error.response) {
        console.error(`HTTP状态码: ${error.response.status}`);
        
        if (config.debug.enabled) {
          console.error(`响应头:`, error.response.headers);
        }
        
        if (error.response.status === 541) {
          console.error('🚫 检测到反爬虫机制');
          console.error('💡 可能的解决方案:');
          console.error('   1. Cookie 可能已过期，请重新获取');
          console.error('   2. 尝试使用不同的 User-Agent');
          console.error('   3. 增加请求间隔时间');
          console.error('   4. 使用代理服务器');
        }
      }
      
      return null;
    }
  }

  /**
   * 解析库存数据
   */
  parseInventoryData(data) {
    try {
      // 调试模式：显示原始响应数据
      if (config.debug.enabled) {
        // console.log('\n🔍 原始响应数据:',data.body.PickupMessage.stores);
        // console.log(JSON.stringify(data, null, 2));
      }
      
      // const body = dataTest.body || {};
      const body = data.body || {};
      
      // 检查是否有门店数据
      const stores = body.PickupMessage?.stores || [];
      
      console.log(`\n📊 库存检查结果:`);
      console.log(`总门店数: ${stores.length}`);

      if (stores.length === 0) {
        console.log('❌ 未找到任何门店信息');
        return {
          totalStores: 0,
          availableStores: 0,
          hasStock: false,
          message: '未找到门店信息',
          rawData: config.debug.enabled ? data : null
        };
      }

      // 检查是否有无货提示
      const noStockMessage = body.noSimilarModelsText;
      if (noStockMessage) {
        // console.log(`\n⚠️  苹果官方提示: ${noStockMessage}`);
      }

      // 检查推荐产品
      const recommendedProducts = body.PickupMessage?.recommendedProducts || [];
      if (recommendedProducts.length > 0) {
        console.log(`\n💡 推荐替代产品: ${recommendedProducts.join(', ')}`);
      }

      let availableCount = 0;
      const availableStores = [];

      // 过滤只显示上海的门店
      const shanghaiStores = stores.filter(store => {
        const city = store.city || '';
        const state = store.state || '';
        return city.includes('上海') || state.includes('上海');
      });

      console.log(`📊 上海门店数: ${shanghaiStores.length}/${stores.length}`);

      shanghaiStores.forEach((store, index) => {
        // 检查特定产品的库存信息
        const partsAvailability = store.partsAvailability || {};
        const targetProduct = partsAvailability[this.productId];
        
        let isAvailable = false;
        let pickupEligible = false;
        
        if (targetProduct) {
          pickupEligible = targetProduct.storePickEligible || false;
          isAvailable = pickupEligible;
        }
        
        const status = isAvailable ? '✅ 有货' : '❌ 无货';
        const address = store.address?.address2 || store.address?.address || '地址未知';
        const distance = store.storeDistanceWithUnit || '距离未知';
        // console.log('targetProduct',targetProduct);
        
        console.log(`${index + 1}. ${store.storeName} - ${status}`);
        // console.log(`   📍 ${address} (${distance})`);
        
        // 显示推荐机型信息（如果有 partsAvailability）
        if (Object.keys(partsAvailability).length > 0) {
          Object.keys(partsAvailability).forEach(productKey => {
            const product = partsAvailability[productKey];
            const messageTypes = product.messageTypes?.regular || {};
            const productTitle = messageTypes.storePickupProductTitle || productKey;
            const pickupEligible = product.storePickEligible || false;
            const pickupQuote = messageTypes.storePickupQuote || '';
            
            console.log(`   📱 ${productTitle} - ${pickupEligible ? '✅ 可取' : '❌ 不可取'}`);
            if (pickupQuote) {
              console.log(`      ${pickupQuote}`);
            }
          });
        }
        
        if (isAvailable) {
          availableCount++;
          availableStores.push({
            name: store.storeName,
            address: address,
            distance: distance,
            availableNow: isAvailable,
            storeNumber: store.storeNumber,
            reservationUrl: store.reservationUrl
          });
        }
        
        console.log(''); // 空行分隔
      });

      const result = {
        totalStores: stores.length,
        availableStores: availableCount,
        hasStock: availableCount > 0,
        message: availableCount > 0 ? `找到 ${availableCount} 家有货门店` : '暂无库存',
        stores: availableStores,
        noStockMessage: noStockMessage,
        recommendedProducts: recommendedProducts,
        rawData: config.debug.enabled ? data : null
      };

      // console.log(`\n🎯 总结:`);
      // console.log(`上海门店: ${shanghaiStores.length}/${stores.length}`);
      console.log(`有货门店: ${availableCount}/${shanghaiStores.length}`);
      console.log(`库存状态: ${result.hasStock ? '有货' : '无货'}`);
      
      if (noStockMessage) {
        // console.log(`\n📝 官方说明: ${noStockMessage}`);
      }
      
      if (recommendedProducts.length > 0) {
        console.log(`\n🔄 可考虑替代产品: ${recommendedProducts.join(', ')}`);
      }
      
      return result;

    } catch (error) {
      console.error('❌ 解析数据时发生错误:', error.message);
      return {
        totalStores: 0,
        availableStores: 0,
        hasStock: false,
        message: '数据解析失败',
        error: error.message,
        rawData: config.debug.enabled ? data : null
      };
    }
  }

  /**
   * 解析备用门店数据结构
   */
  parseAlternativeStores(stores) {
    console.log(`\n📊 备用结构库存检查结果:`);
    console.log(`总门店数: ${stores.length}`);

    let availableCount = 0;
    const availableStores = [];

    stores.forEach((store, index) => {
      const isAvailable = store.retailStore?.availableNow || store.availableNow;
      const status = isAvailable ? '✅ 有货' : '❌ 无货';
      const address = store.address?.address2 || store.address?.address || '地址未知';
      
      console.log(`${index + 1}. ${store.storeName}`);
      console.log(`   地址: ${address}`);
      console.log(`   状态: ${status}`);
      
      if (isAvailable) {
        availableCount++;
        availableStores.push({
          name: store.storeName,
          address: address,
          availableNow: isAvailable
        });
      }
    });

    return {
      totalStores: stores.length,
      availableStores: availableCount,
      hasStock: availableCount > 0,
      message: availableCount > 0 ? `找到 ${availableCount} 家有货门店` : '暂无库存',
      stores: availableStores
    };
  }

  /**
   * 发送邮件通知（如果有库存）
   */
  async sendNotificationIfAvailable(inventoryResult) {
    if (!inventoryResult.hasStock) {
      console.log('📧 无库存，跳过邮件通知');
      return;
    }

    console.log('📧 检测到库存，准备发送邮件通知...');
    
    const subject = '🍎 iPhone 17 Pro Max 有库存了！';
    const emailContent = this.formatInventoryMessage(inventoryResult);
    
    await this.sendEmail(subject, emailContent);
  }

  /**
   * 发送推荐机型测试邮件
   */
  async sendRecommendedProductsTest() {
    console.log('📧 准备发送推荐机型测试邮件...');
    
    const subject = '🍎 苹果推荐机型测试邮件';
    const emailContent = this.formatRecommendedProductsMessage();
    
    await this.sendEmail(subject, emailContent);
  }

  /**
   * 发送邮件
   */
  async sendEmail(subject, content) {
    try {
      const nodemailer = await import('nodemailer');
      
      const transporter = nodemailer.createTransport({
        host: config.email.smtp.host,
        port: config.email.smtp.port,
        secure: config.email.smtp.secure,
        auth: {
          user: config.email.from.user,
          pass: config.email.from.pass
        }
      });

      const mailOptions = {
        from: config.email.from.user,
        to: config.email.to,
        subject: subject,
        html: content.replace(/\n/g, '<br>')
      };

      console.log('📤 正在发送邮件...');
      const info = await transporter.sendMail(mailOptions);
      console.log('✅ 邮件发送成功！');
      console.log(`📧 邮件ID: ${info.messageId}`);
      
    } catch (error) {
      console.error('❌ 邮件发送失败:', error.message);
      throw error;
    }
  }

  /**
   * 格式化库存消息
   */
  formatInventoryMessage(inventoryResult) {
    let message = `找到 ${inventoryResult.availableStores} 家有货门店\n`;
    inventoryResult.stores.forEach((store, index) => {
      message += `${index + 1}. ${store.name} - ${store.address}\n`;
    });
    return message;
  }

  /**
   * 格式化推荐机型消息
   */
  formatRecommendedProductsMessage() {
    const now = new Date().toLocaleString('zh-CN');
    let message = `🍎 苹果推荐机型信息\n`;
    message += `📅 检查时间: ${now}\n`;
    message += `🎯 目标产品: ${this.productId} (${config.product.name})\n`;
    message += `📍 检查位置: ${this.location}\n\n`;
    
    message += `📱 当前推荐机型:\n`;
    message += `• MG0Q4CH/A - iPhone 17 Pro Max 2TB 深蓝色\n`;
    message += `• MG0F4CH/A - iPhone 17 Pro Max 2TB 银色\n`;
    message += `• MG924CH/A - iPhone 17 Pro 1TB 深蓝色\n\n`;
    
    message += `💡 说明:\n`;
    message += `这些是苹果官方推荐的替代机型，\n`;
    message += `当目标产品 MG034CH/A 无库存时，\n`;
    message += `可以考虑购买这些推荐机型。\n\n`;
    
    message += `🔗 购买链接: https://www.apple.com.cn/shop/buy-iphone/iphone-17-pro-max\n`;
    
    return message;
  }

  /**
   * 测试基本网络连接
   */
  async testConnection() {
    try {
      console.log('🔍 测试网络连接...');
      
      // 测试访问苹果主页
      const response = await this.client.get('https://www.apple.com.cn/', {
        timeout: 10000,
        headers: {
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'User-Agent': this.client.defaults.headers['User-Agent']
        }
      });
      
      console.log(`✅ 网络连接正常，状态码: ${response.status}`);
      return true;
    } catch (error) {
      console.error('❌ 网络连接失败:', error.message);
      return false;
    }
  }

  /**
   * 运行完整的库存检查流程
   */
  async runCheck() {
    console.log('🎬 开始苹果库存检查\n');
    console.log(`📱 产品: ${config.product.name} (${config.product.id})`);
    console.log(`📍 位置: ${config.location}`);
    
    // 设置 Cookie
    this.setCookie();
    
    // 先测试网络连接
    const connectionOk = await this.testConnection();
    if (!connectionOk) {
      console.log('❌ 网络连接失败，无法继续');
      return null;
    }
    
    // 检查库存（带重试机制）
    let result = null; 
    for (let i = 0; i < config.request.retryCount; i++) {
      if (i > 0) {
        console.log(`\n🔄 第 ${i + 1} 次尝试...`);
        // 每次重试前更换 User-Agent
        this.setRandomUserAgent();
        await new Promise(resolve => setTimeout(resolve, config.request.retryDelay));
      }
      
      result = await this.checkInventory();
      if (result) {
        break;
      }
    }
    
    if (result) {
      // 发送通知
      await this.sendNotificationIfAvailable(result);
    } else {
      console.log('\n❌ 所有重试都失败了');
      console.log('\n💡 建议:');
      console.log('   1. 检查 Cookie 是否有效（可能已过期）');
      console.log('   2. 尝试使用 VPN 或代理');
      console.log('   3. 稍后再试（可能被临时限制）');
      console.log('   4. 使用浏览器手动访问确认网站状态');
    }
    
    console.log('\n🎉 检查完成！');
    return result;
  }

  /**
   * 开始轮询监控
   */
  async startMonitoring() {
    const intervalSeconds = config.monitor.interval / 1000;
    console.log('🔄 开始轮询监控苹果库存...');
    console.log(`⏰ 监控间隔: ${intervalSeconds}秒`);
    console.log(`🎯 目标产品: ${this.productId}`);
    console.log(`📍 监控位置: ${this.location}`);
    console.log('='.repeat(50));
    
    let checkCount = 0;
    
    while (true) {
      checkCount++;
      const now = new Date().toLocaleString('zh-CN');
      
      console.log(`\n🕐 [${now}] 第 ${checkCount} 次检查`);
      console.log('-'.repeat(30));
      
      try {
        // 设置 Cookie
        this.setCookie();
        
        const result = await this.checkInventory();
        
        if (result) {
          await this.sendNotificationIfAvailable(result);
        }
        
        console.log(`\n✅ 第 ${checkCount} 次检查完成`);
        
      } catch (error) {
        console.error(`❌ 第 ${checkCount} 次检查失败:`, error.message);
      }
      
          // 等待配置的间隔时间
          console.log(`⏳ 等待${intervalSeconds}秒后进行下次检查...`);
          await new Promise(resolve => setTimeout(resolve, config.monitor.interval));
    }
  }
}

/**
 * 演示不同的请求配置
 */
class RequestDemo {
  constructor() {
    this.checker = new AppleInventoryChecker();
  }

  /**
   * 演示无 Cookie 请求
   */
  async demoWithoutCookie() {
    console.log('\n🔍 演示1: 无 Cookie 请求');
    console.log('='.repeat(50));
    
    const result = await this.checker.checkInventory();
    return result;
  }

  /**
   * 演示带 Cookie 请求
   */
  async demoWithCookie() {
    console.log('\n🔍 演示2: 带 Cookie 请求');
    console.log('='.repeat(50));
    
    // 使用配置文件中的 Cookie
    this.checker.setCookie();
    
    const result = await this.checker.checkInventory();
    return result;
  }

  /**
   * 演示自定义请求头
   */
  async demoCustomHeaders() {
    console.log('\n🔍 演示3: 自定义请求头');
    console.log('='.repeat(50));
    
    // 添加额外的请求头
    this.checker.client.defaults.headers['X-Custom-Header'] = 'CustomValue';
    this.checker.client.defaults.headers['Authorization'] = 'Bearer fake-token';
    
    const result = await this.checker.checkInventory();
    return result;
  }

  /**
   * 运行所有演示
   */
  async runAllDemos() {
    console.log('🚀 开始 axios + cookie 请求演示\n');
    
    try {
      await this.demoWithoutCookie();
      await this.demoWithCookie();
      await this.demoCustomHeaders();
      
      console.log('\n✅ 所有演示完成！');
    } catch (error) {
      console.error('❌ 演示过程中发生错误:', error.message);
    }
  }
}

// 主程序入口
async function main() {
  const checker = new AppleInventoryChecker();
  const demo = new RequestDemo();
  
  // 选择运行模式
  const mode = process.argv[2] || 'check';
  
  // 显示配置信息
  if (config.debug.enabled) {
    console.log('🔧 调试模式已启用');
    console.log('📋 当前配置:');
    console.log(`   产品ID: ${config.product.id}`);
    console.log(`   位置: ${config.location}`);
    console.log(`   超时时间: ${config.request.timeout}ms`);
    console.log(`   Cookie 已设置: ${config.cookie.getCookie() ? '是' : '否'}`);
    console.log('');
  }
  
      switch (mode) {
        case 'check':
          await checker.runCheck();
          break;
        case 'monitor':
          await checker.startMonitoring();
          break;
        case 'email-test':
          await checker.sendRecommendedProductsTest();
          break;
        case 'demo':
          await demo.runAllDemos();
          break;
        case 'config':
          console.log('📋 当前配置信息:');
          console.log(JSON.stringify(config, null, 2));
          break;
        default:
          console.log('使用方法:');
          console.log('  node test.js check      - 检查库存（单次）');
          console.log('  node test.js monitor    - 轮询监控（每分钟一次）');
          console.log('  node test.js email-test  - 发送推荐机型测试邮件');
          console.log('  node test.js demo       - 运行演示');
          console.log('  node test.js config     - 显示配置信息');
          console.log('');
          console.log('💡 提示: 请在 config.js 中设置 cookie.value 来避免 541 错误');
          break;
      }
}

// 运行主程序
main().catch(console.error);