# 苹果库存监控脚本

一个用于监控苹果产品库存并发送邮件通知的 Node.js 脚本。

## 功能特性

- 🔍 自动检查苹果官网库存状态
- 📧 支持邮件通知（HTML 格式）
- ⚙️ 可配置产品 ID 和邮箱设置
- 🕐 定时检查（默认 5 分钟间隔）
- 🛡️ 错误处理和重试机制
- 📊 详细的库存信息展示

## 安装依赖

```bash
npm install
```

## 配置说明

### 1. 复制环境变量配置文件

```bash
cp env.example .env
```

### 2. 编辑 `.env` 文件

```env
# 发送方邮箱账号（QQ邮箱）
EMAIL_USER=1131717009@qq.com

# 发送方邮箱密码或应用专用密码（QQ邮箱授权码）
EMAIL_PASS=your-qq-authorization-code

# 接收通知的邮箱（可以自己给自己发）
NOTIFY_EMAIL=1131717009@qq.com

# SMTP服务器配置（QQ邮箱）
SMTP_HOST=smtp.qq.com
SMTP_PORT=587
```

### 3. 修改产品配置

编辑 `config.js` 文件：

```javascript
module.exports = {
  // 苹果产品ID配置
  productId: "MG034CH/A", // 修改为你要监控的产品ID

  // 位置配置
  monitor: {
    location: "上海 上海 杨浦区", // 修改为你的位置
    interval: 5 * 60 * 1000, // 检查间隔（毫秒）
  },
};
```

## 使用方法

### 启动持续监控

```bash
npm start
```

### 执行单次检查

```bash
node monitor.js --once
```

### 发送测试邮件

```bash
node monitor.js --test-email
```

## 邮件服务配置

### QQ 邮箱配置

1. 登录 QQ 邮箱网页版
2. 进入"设置" → "账户"
3. 开启"POP3/IMAP/SMTP/Exchange/CardDAV/CalDAV 服务"
4. 生成授权码（不是 QQ 密码）
5. 使用授权码作为 `EMAIL_PASS`

### 其他邮箱服务

修改 `config.js` 中的 SMTP 配置：

```javascript
email: {
  smtp: {
    host: 'smtp.your-provider.com',
    port: 587,
    secure: false
  }
}
```

## 产品 ID 参考

| 产品              | 产品 ID   |
| ----------------- | --------- |
| iPhone 17 Pro Max | MG034CH/A |
| iPhone 17 Pro     | MG033CH/A |
| iPhone 17         | MG032CH/A |

## 文件结构

```
appleMonitor/
├── package.json          # 项目依赖配置
├── config.js            # 主配置文件
├── monitor.js           # 主监控脚本
├── appleInventory.js    # 库存查询模块
├── emailNotifier.js     # 邮件通知模块
├── env.example          # 环境变量示例
└── README.md           # 说明文档
```

## 注意事项

1. **邮件服务限制**: 某些邮件服务商对发送频率有限制，建议设置合理的检查间隔
2. **网络稳定性**: 确保网络连接稳定，脚本会自动处理网络错误
3. **产品 ID**: 确保使用正确的产品 ID，可在苹果官网商品页面 URL 中找到
4. **位置信息**: 位置信息影响库存查询结果，请使用准确的位置

## 故障排除

### 邮件发送失败

1. 检查邮箱账号和密码是否正确
2. 确认已启用应用专用密码（Gmail）
3. 检查 SMTP 服务器配置
4. 运行测试邮件功能验证配置

### 库存查询失败

1. 检查网络连接
2. 验证产品 ID 是否正确
3. 确认位置信息格式正确
4. 查看控制台错误信息

## 许可证

MIT License
