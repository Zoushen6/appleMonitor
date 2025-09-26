// 配置文件
module.exports = {
  // 苹果产品ID配置
  productId: 'MG034CH/A', // iPhone 17 Pro Max
  
  // 邮件通知配置
  email: {
    // 发送方邮箱配置（需要支持SMTP的邮箱服务）
    from: {
      user: process.env.EMAIL_USER || '1131717009@qq.com',
      pass: process.env.EMAIL_PASS || 'onxhxuabfskvbafh'
    },
    // 接收方邮箱（可以自己给自己发）
    to: process.env.NOTIFY_EMAIL || '1131717009@qq.com',
    // SMTP服务器配置（QQ邮箱）
    smtp: {
      host: process.env.SMTP_HOST || 'smtp.qq.com',
      port: process.env.SMTP_PORT || 587,
      secure: false // true for 465, false for other ports
    }
  },
  
  // 监控配置
  monitor: {
    // 检查间隔（毫秒）
    interval: 60 * 1000, // 5分钟
    // 位置配置
    location: '上海 上海 杨浦区',
    // 请求超时时间
    timeout: 10000
  }
};
