const axios = require('axios');
const config = require('./config');

class AppleInventoryChecker {
  constructor() {
    this.baseUrl = 'https://www.apple.com.cn/shop/pickup-message-recommendations';
  }

  /**
   * 构建请求URL
   * @param {string} productId - 产品ID
   * @param {string} location - 位置信息
   * @returns {string} 完整的请求URL
   */
  buildUrl(productId, location) {
    const params = new URLSearchParams({
      fae: 'true',
      'mts.0': 'regular',
      location: location,
      product: productId
    });
    
    return `${this.baseUrl}?${params.toString()}`;
  }

  /**
   * 检查苹果库存
   * @param {string} productId - 产品ID
   * @param {string} location - 位置信息
   * @returns {Promise<Object>} 库存信息
   */
  async checkInventory(productId, location) {
    try {
      const url = this.buildUrl(productId, location);
      console.log(`正在检查库存: ${productId} 在 ${location}`);
      console.log(`请求URL: ${url}`);

      const response = await axios.get(url, {
        timeout: config.monitor.timeout,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'application/json, text/plain, */*',
          'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
          'Referer': 'https://www.apple.com.cn/'
        }
      });

      if (response.status === 200) {
        return this.parseInventoryData(response.data);
      } else {
        throw new Error(`HTTP错误: ${response.status}`);
      }
    } catch (error) {
      console.error('检查库存时发生错误:', error.message);
      throw error;
    }
  }

  /**
   * 解析库存数据
   * @param {Object} data - API返回的数据
   * @returns {Object} 解析后的库存信息
   */
  parseInventoryData(data) {
    try {
      const body = data.body || {};
      const content = body.content || {};
      // 兼容两种结构：body.content.pickupMessage.stores 与 body.PickupMessage.stores
      const pickupMessagePrimary = content.pickupMessage || {};
      const pickupMessageFallback = body.PickupMessage || {};
      const usePrimary = Array.isArray(pickupMessagePrimary.stores) && pickupMessagePrimary.stores.length > 0;
      const stores = usePrimary ? pickupMessagePrimary.stores : (pickupMessageFallback.stores || []);
      
      const result = {
        hasStock: false,
        availableStores: [],
        totalStores: stores.length,
        message: (pickupMessagePrimary.notAvailableNearby
          || pickupMessageFallback.notAvailableNearby
          || body.noSimilarModelsText
          || '无库存信息'),
        timestamp: new Date().toISOString()
      };

      // 基于 partsAvailability[productId].pickupDisplay 判断是否有货
      const productId = config.productId;
      stores.forEach(store => {
        const partsAvailability = store.partsAvailability || {};
        const partInfo = partsAvailability && partsAvailability[productId];
        let pickupDisplay = partInfo?.pickupDisplay;

        // 兼容老结构：没有 partsAvailability 时，使用 availableNow 推断
        if (pickupDisplay == null) {
          if (typeof store.availableNow === 'boolean') {
            pickupDisplay = store.availableNow ? 'available' : 'unavailable';
          }
        }

        const isAvailable = typeof pickupDisplay === 'string' && pickupDisplay.toLowerCase() !== 'unavailable';

        // 调试输出：打印每家门店的名称、地址与 pickupDisplay，并标记来源
        try {
          const addr = store.address?.address2 || store.address?.address || '';
          const source = partInfo ? 'partsAvailability' : (typeof store.availableNow === 'boolean' ? 'availableNow' : 'unknown');
          console.log(`- 门店: ${store.storeName} | 地址: ${addr} | pickupDisplay: ${pickupDisplay ?? 'N/A'} | 来源: ${source}`);
        } catch (_) {}

        if (isAvailable) {
          result.hasStock = true;
          result.availableStores.push({
            name: store.storeName,
            address: store.address?.address2 || store.address?.address,
            city: store.city,
            distance: store.storeDistanceWithUnit,
            phone: store.phoneNumber,
            hours: store.storeHours?.hours?.[0]?.storeTimings || '营业时间未知',
            pickupDisplay: pickupDisplay,
            pickupQuote: partInfo?.pickupSearchQuote || partInfo?.messageTypes?.regular?.storePickupQuote || ''
          });
        }
      });

      return result;
    } catch (error) {
      console.error('解析库存数据时发生错误:', error.message);
      return {
        hasStock: false,
        availableStores: [],
        totalStores: 0,
        message: '数据解析失败',
        timestamp: new Date().toISOString(),
        error: error.message
      };
    }
  }

  /**
   * 格式化库存信息为可读文本
   * @param {Object} inventoryData - 库存数据
   * @returns {string} 格式化的文本
   */
  formatInventoryMessage(inventoryData) {
    const { hasStock, availableStores, totalStores, message, timestamp } = inventoryData;
    
    let text = `🍎 苹果库存监控报告\n`;
    text += `⏰ 检查时间: ${new Date(timestamp).toLocaleString('zh-CN')}\n`;
    text += `📱 产品ID: ${config.productId}\n`;
    text += `📍 检查位置: ${config.monitor.location}\n\n`;

    if (hasStock && availableStores.length > 0) {
      text += `✅ 有库存！在 ${availableStores.length} 家门店有货\n\n`;
      text += `🏪 可用门店:\n`;
      
      availableStores.forEach((store, index) => {
        text += `${index + 1}. ${store.name}\n`;
        text += `   📍 地址: ${store.address}\n`;
        text += `   📞 电话: ${store.phone}\n`;
        text += `   ⏰ 营业时间: ${store.hours}\n`;
        text += `   📏 距离: ${store.distance}\n\n`;
      });
    } else {
      text += `❌ 暂无库存\n`;
      text += `📝 信息: ${message}\n`;
      text += `🏪 检查了 ${totalStores} 家门店\n`;
    }

    return text;
  }
}

module.exports = AppleInventoryChecker;
