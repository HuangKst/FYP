// scheduler.js
import cron from 'node-cron';
import { updateMaterialPrices } from './routes/materialDailyPriceRoutes.js';

// 定义调度任务
export function initScheduler() {
  // 每天凌晨1点自动更新材料价格(避开交易时间)
  cron.schedule('0 8 * * *', async () => {
    console.log('执行定时任务：更新材料价格');
    try {
      const result = await updateMaterialPrices();
      if (result) {
        console.log('定时更新材料价格成功');
      } else {
        console.error('定时更新材料价格失败');
      }
    } catch (error) {
      console.error('执行定时更新材料价格任务时出错:', error);
    }
  }, {
    scheduled: true,
    timezone: 'Asia/Shanghai' // 设置为中国时区
  });

  console.log('材料价格定时更新任务已初始化 - 设置为每天凌晨8点执行');
}

export default initScheduler; 