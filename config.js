// 配置文件
const config = {
  // 苹果产品配置
  product: {
    id: 'MG034CH/A', // iPhone 17 Pro Max (恢复原始产品ID)
    name: 'iPhone 17 Pro Max'
  },
  
  // 位置配置
  location: '上海 上海 杨浦区',
  
  // 请求配置
  request: {
    // 基础 URL
    baseUrl: 'https://www.apple.com.cn/shop/pickup-message-recommendations',
    
    // 请求超时时间（毫秒）
    timeout: 30000,
    
    // 请求间隔（毫秒）- 避免频繁请求
    interval: 5000,
    
    // 重试次数
    retryCount: 3,
    
    // 重试延迟（毫秒）
    retryDelay: 2000
  },
  
  // Cookie 配置
  cookie: {
    // 手动设置的 Cookie（从浏览器复制）
    // 格式：key1=value1; key2=value2; key3=value3
    value: '', // 在这里粘贴你的 Cookie
    // 或者从环境变量读取
    fromEnv: process.env.APPLE_COOKIE || '',
    
    // Cookie 优先级：手动设置 > 环境变量
    getCookie() {
      return this.value || this.fromEnv || '';
    }
  },
  
  // 邮件通知配置
  email: {
    enabled: false, // 是否启用邮件通知
    
    // QQ 邮箱配置
    smtp: {
      host: 'smtp.qq.com',
      port: 587,
      secure: false
    },
    
    // 发送方邮箱
    from: {
      user: '1131717009@qq.com',
      pass: 'ukddrzeufiyijjag' // QQ 邮箱授权码
    },
    
    // 接收方邮箱
    to: '1131717009@qq.com',
    
    // 邮件主题
    subject: '🍎 iPhone 17 Pro Max 库存通知',
    
    // 邮件模板
    template: {
      hasStock: `
        <h2>🎉 好消息！iPhone 17 Pro Max 有库存了！</h2>
        <p>找到 <strong>{{availableCount}}</strong> 家有货门店：</p>
        <ul>
          {{#stores}}
          <li><strong>{{name}}</strong> - {{address}} ({{distance}})</li>
          {{/stores}}
        </ul>
        <p>请尽快前往购买！</p>
      `,
      noStock: `
        <h2>😔 暂无库存</h2>
        <p>iPhone 17 Pro Max 目前暂无库存，请稍后再试。</p>
      `
    }
  },
  
  // 日志配置
  logging: {
    // 是否显示详细日志
    verbose: true,
    
    // 是否保存日志到文件
    saveToFile: false,
    
    // 日志文件路径
    logFile: './apple-monitor.log',
    
    // 日志级别：debug, info, warn, error
    level: 'info'
  },
  
  // 监控配置
  monitor: {
    // 是否启用持续监控
    enabled: false,
    
    // 监控间隔（毫秒）
    interval: 5 * 1000, // 5秒
    
    // 最大监控时长（毫秒）
    maxDuration: 24 * 60 * 60 * 1000, // 24小时
    
    // 是否在找到库存后停止监控
    stopOnFound: true
  },
  
  // 代理配置（可选）
  proxy: {
    enabled: false,
    host: '',
    port: '',
    username: '',
    password: ''
  },
  
  // 用户代理配置
  userAgent: {
    // 默认用户代理
    default: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    
    // 随机用户代理列表
    random: [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15'
    ],
    
    // 获取随机用户代理
    getRandom() {
      return this.random[Math.floor(Math.random() * this.random.length)];
    }
  },
  
  // 请求头配置
  headers: {
    // 基础请求头
    base: {
      'Accept': 'application/json, text/plain, */*',
      'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      'Referer': 'https://www.apple.com.cn/shop',
      'Origin': 'https://www.apple.com.cn',
      'X-Requested-With': 'XMLHttpRequest',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'same-origin',
      'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
      'Sec-Ch-Ua-Mobile': '?0',
      'Sec-Ch-Ua-Platform': '"Windows"'
    },
    
    // 获取完整请求头（包含用户代理和 Cookie）
    getComplete(cookie = '') {
      return {
        ...this.base,
        'User-Agent': config.userAgent.default,
        'Cookie': cookie
      };
    }
  },
  
  // 调试配置
  debug: {
    // 是否启用调试模式
    enabled: true,
    
    // 是否保存响应数据
    saveResponse: false,
    
    // 响应数据保存路径
    responseFile: './response-data.json',
    
    // 是否显示请求详情
    showRequestDetails: true,
    
    // 是否显示响应详情
    showResponseDetails: true
  }
};

// 导出配置实例
export default config;
