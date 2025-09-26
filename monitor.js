require('dotenv').config();
const AppleInventoryChecker = require('./appleInventory');
const EmailNotifier = require('./emailNotifier');
const config = require('./config');

class AppleMonitor {
  constructor() {
    this.inventoryChecker = new AppleInventoryChecker();
    this.emailNotifier = new EmailNotifier();
    this.isRunning = false;
    this.lastNotificationTime = null;
    this.notificationCooldown = 30 * 60 * 1000; // 30分钟冷却时间
  }

  /**
   * 启动监控
   */
  async start() {
    console.log('🚀 启动苹果库存监控...');
    console.log(`📱 监控产品: ${config.productId}`);
    console.log(`📍 监控位置: ${config.monitor.location}`);
    console.log(`📧 通知邮箱: ${config.email.to}`);
    console.log(`⏰ 检查间隔: ${config.monitor.interval / 1000}秒`);
    console.log('----------------------------------------');

    // 验证邮件配置
    const emailValid = await this.emailNotifier.verifyConnection();
    if (!emailValid) {
      console.error('❌ 邮件配置验证失败，请检查配置');
      return;
    }

    this.isRunning = true;
    
    // 立即执行一次检查
    await this.checkAndNotify();
    
    // 设置定时检查
    this.scheduleNextCheck();
  }

  /**
   * 停止监控
   */
  stop() {
    console.log('🛑 停止苹果库存监控');
    this.isRunning = false;
  }

  /**
   * 执行库存检查和通知
   */
  async checkAndNotify() {
    try {
      console.log(`\n🔍 [${new Date().toLocaleString('zh-CN')}] 开始检查库存...`);
      
      const inventoryData = await this.inventoryChecker.checkInventory(
        config.productId,
        config.monitor.location
      );

      console.log(`📊 检查结果: ${inventoryData.hasStock ? '有库存' : '无库存'}`);
      console.log(`🏪 检查门店数: ${inventoryData.totalStores}`);
      
      if (inventoryData.hasStock) {
        console.log(`✅ 发现 ${inventoryData.availableStores.length} 家门店有货！`);
        inventoryData.availableStores.forEach((store, index) => {
          console.log(`   ${index + 1}. ${store.name} (${store.distance})`);
        });
      }

      // 发送通知
      await this.sendNotificationIfNeeded(inventoryData);

    } catch (error) {
      console.error('❌ 检查库存时发生错误:', error.message);
    }
  }

  /**
   * 根据需要发送通知
   * @param {Object} inventoryData - 库存数据
   */
  async sendNotificationIfNeeded(inventoryData) {
    const now = Date.now();
    const shouldNotify = inventoryData.hasStock || 
      (this.lastNotificationTime && (now - this.lastNotificationTime) > this.notificationCooldown);

    if (shouldNotify) {
      const message = this.inventoryChecker.formatInventoryMessage(inventoryData);
      
      console.log('📧 发送邮件通知...');
      const success = await this.emailNotifier.sendInventoryNotification(inventoryData, message);
      
      if (success) {
        console.log('✅ 邮件通知发送成功');
        this.lastNotificationTime = now;
      } else {
        console.log('❌ 邮件通知发送失败');
      }
    } else {
      console.log('⏭️ 跳过通知发送（冷却期内或无库存变化）');
    }
  }

  /**
   * 安排下次检查
   */
  scheduleNextCheck() {
    if (!this.isRunning) return;

    setTimeout(async () => {
      if (this.isRunning) {
        await this.checkAndNotify();
        this.scheduleNextCheck();
      }
    }, config.monitor.interval);
  }

  /**
   * 发送测试邮件
   */
  async sendTestEmail() {
    console.log('📧 发送测试邮件...');
    const success = await this.emailNotifier.sendTestEmail();
    
    if (success) {
      console.log('✅ 测试邮件发送成功');
    } else {
      console.log('❌ 测试邮件发送失败');
    }
  }
}

// 主程序入口
async function main() {
  const monitor = new AppleMonitor();

  // 处理命令行参数
  const args = process.argv.slice(2);
  
  if (args.includes('--test-email')) {
    await monitor.sendTestEmail();
    process.exit(0);
  }

  if (args.includes('--once')) {
    console.log('🔍 执行单次检查...');
    await monitor.checkAndNotify();
    process.exit(0);
  }

  // 处理进程退出信号
  process.on('SIGINT', () => {
    console.log('\n🛑 收到退出信号，正在停止监控...');
    monitor.stop();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.log('\n🛑 收到终止信号，正在停止监控...');
    monitor.stop();
    process.exit(0);
  });

  // 启动监控
  await monitor.start();
}

// 如果直接运行此文件，则启动主程序
if (require.main === module) {
  main().catch(error => {
    console.error('❌ 程序启动失败:', error.message);
    process.exit(1);
  });
}

module.exports = AppleMonitor;
