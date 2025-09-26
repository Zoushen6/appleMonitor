const nodemailer = require('nodemailer');
const config = require('./config');

class EmailNotifier {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  /**
   * 初始化邮件传输器
   */
  initializeTransporter() {
    try {
      this.transporter = nodemailer.createTransport({
        host: config.email.smtp.host,
        port: config.email.smtp.port,
        secure: config.email.smtp.secure,
        auth: {
          user: config.email.from.user,
          pass: config.email.from.pass
        }
      });

      console.log('邮件传输器初始化成功');
    } catch (error) {
      console.error('邮件传输器初始化失败:', error.message);
    }
  }

  /**
   * 验证邮件配置
   * @returns {Promise<boolean>} 验证结果
   */
  async verifyConnection() {
    try {
      if (!this.transporter) {
        throw new Error('邮件传输器未初始化');
      }

      await this.transporter.verify();
      console.log('邮件服务器连接验证成功');
      return true;
    } catch (error) {
      console.error('邮件服务器连接验证失败:', error.message);
      return false;
    }
  }

  /**
   * 发送库存通知邮件
   * @param {Object} inventoryData - 库存数据
   * @param {string} message - 消息内容
   * @returns {Promise<boolean>} 发送结果
   */
  async sendInventoryNotification(inventoryData, message) {
    try {
      if (!this.transporter) {
        throw new Error('邮件传输器未初始化');
      }

      const { hasStock, availableStores, timestamp } = inventoryData;
      
      const subject = hasStock 
        ? `🍎 苹果库存通知 - 有货！(${availableStores.length}家门店)`
        : `🍎 苹果库存通知 - 暂无库存`;

      const htmlContent = this.generateHtmlContent(inventoryData, message);

      const mailOptions = {
        from: `"苹果库存监控" <${config.email.from.user}>`,
        to: config.email.to,
        subject: subject,
        text: message,
        html: htmlContent
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('库存通知邮件发送成功:', result.messageId);
      return true;
    } catch (error) {
      console.error('发送库存通知邮件失败:', error.message);
      return false;
    }
  }

  /**
   * 生成HTML邮件内容
   * @param {Object} inventoryData - 库存数据
   * @param {string} message - 消息内容
   * @returns {string} HTML内容
   */
  generateHtmlContent(inventoryData, message) {
    const { hasStock, availableStores, totalStores, timestamp } = inventoryData;
    
    let html = `
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>苹果库存监控报告</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
            .status { padding: 15px; border-radius: 8px; margin: 15px 0; }
            .in-stock { background: #d4edda; border: 1px solid #c3e6cb; color: #155724; }
            .out-of-stock { background: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; }
            .store-list { margin: 20px 0; }
            .store-item { background: #f8f9fa; padding: 15px; margin: 10px 0; border-radius: 5px; border-left: 4px solid #007bff; }
            .store-name { font-weight: bold; color: #007bff; margin-bottom: 5px; }
            .store-details { font-size: 14px; color: #666; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🍎 苹果库存监控报告</h1>
                <p><strong>检查时间:</strong> ${new Date(timestamp).toLocaleString('zh-CN')}</p>
                <p><strong>产品ID:</strong> ${config.productId}</p>
                <p><strong>检查位置:</strong> ${config.monitor.location}</p>
            </div>
    `;

    if (hasStock && availableStores.length > 0) {
      html += `
            <div class="status in-stock">
                <h2>✅ 有库存！在 ${availableStores.length} 家门店有货</h2>
            </div>
            <div class="store-list">
                <h3>🏪 可用门店:</h3>
      `;
      
      availableStores.forEach((store, index) => {
        html += `
                <div class="store-item">
                    <div class="store-name">${index + 1}. ${store.name}</div>
                    <div class="store-details">
                        <p><strong>📍 地址:</strong> ${store.address}</p>
                        <p><strong>📞 电话:</strong> ${store.phone}</p>
                        <p><strong>⏰ 营业时间:</strong> ${store.hours}</p>
                        <p><strong>📏 距离:</strong> ${store.distance}</p>
                    </div>
                </div>
        `;
      });
      
      html += `</div>`;
    } else {
      html += `
            <div class="status out-of-stock">
                <h2>❌ 暂无库存</h2>
                <p>检查了 ${totalStores} 家门店，目前都没有现货</p>
            </div>
      `;
    }

    html += `
            <div class="footer">
                <p>此邮件由苹果库存监控脚本自动发送</p>
                <p>如需停止监控，请修改脚本配置</p>
            </div>
        </div>
    </body>
    </html>
    `;

    return html;
  }

  /**
   * 发送测试邮件
   * @returns {Promise<boolean>} 发送结果
   */
  async sendTestEmail() {
    try {
      const testData = {
        hasStock: false,
        availableStores: [],
        totalStores: 0,
        message: '这是一封测试邮件',
        timestamp: new Date().toISOString()
      };

      const testMessage = '这是一封测试邮件，用于验证邮件配置是否正确。';
      
      return await this.sendInventoryNotification(testData, testMessage);
    } catch (error) {
      console.error('发送测试邮件失败:', error.message);
      return false;
    }
  }
}

module.exports = EmailNotifier;
