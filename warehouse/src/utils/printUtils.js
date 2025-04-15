import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

// 从DOM元素直接打印，使用iframe方式避免破坏React状态
export const printElement = (elementId) => {
  const printContent = document.getElementById(elementId);
  if (!printContent) return;
  
  // 创建一个隐藏的iframe
  const iframe = document.createElement('iframe');
  iframe.style.position = 'absolute';
  iframe.style.top = '-9999px';
  iframe.style.left = '-9999px';
  document.body.appendChild(iframe);
  
  // 获取iframe文档并写入内容
  const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
  iframeDoc.open();
  iframeDoc.write(`
    <html>
      <head>
        <style>
          @page { 
            size: auto; 
            margin: 10mm; 
            margin-top: 0;
            margin-bottom: 0;
          }
          /* 隐藏页眉和页脚 */
          @media print {
            html, body { height: 99%; }
            body { margin: 0 !important; padding: 5px !important; }
            /* 移除浏览器默认添加的页眉页脚 */
            html {
              -webkit-print-color-adjust: exact;
            }
            /* 确保打印时表格不会被截断 */
            table { page-break-inside: auto; }
            tr { page-break-inside: avoid; page-break-after: auto; }
            td { word-wrap: break-word; }
            .disclaimer-box { page-break-inside: avoid; }
          }
          body { font-family: Arial, sans-serif; padding: 10px; font-size: 12px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 10px; table-layout: fixed; }
          th, td { border: 1px solid #ddd; padding: 4px; text-align: left; font-size: 10px; overflow: hidden; text-overflow: ellipsis; }
          th { background-color: #f2f2f2; }
          h5 { text-align: center; margin: 8px 0; font-size: 16px; }
          h6, .subtitle1 { font-size: 13px; font-weight: bold; margin: 5px 0; }
          .divider { border-top: 1px solid #ddd; margin: 8px 0; }
          .footer { text-align: center; margin-top: 15px; font-size: 10px; color: #666; }
          
          /* Grid布局 */
          .MuiGrid-container { display: flex; flex-wrap: wrap; margin: -4px; }
          .MuiGrid-item { flex: 0 0 auto; padding: 4px; box-sizing: border-box; }
          .MuiGrid-grid-xs-3 { flex-basis: 25%; max-width: 25%; }
          .MuiGrid-grid-xs-6 { flex-basis: 50%; max-width: 50%; }
          
          /* 字体大小 */
          .smaller-text { font-size: 10px; }
          .small-text { font-size: 11px; }
          .normal-text { font-size: 12px; }
          
          /* 公司抬头样式 */
          h4 { margin-bottom: 3px; color: #333; font-size: 18px; }
          
          /* 免责声明样式 */
          .disclaimer-box { 
            border: 1px solid #ddd; 
            padding: 6px; 
            margin: 10px 0; 
            background-color: #f9f9f9; 
          }
          .disclaimer-title { 
            font-weight: bold; 
            margin-bottom: 3px; 
            font-size: 11px; 
          }
          .disclaimer-text { 
            font-size: 6px; 
            line-height: 1.2; 
            display: block;
            margin-bottom: 2px;
          }
          .disclaimer-text strong {
            font-weight: bold;
          }
          
          /* 签名区域样式 */
          .signature-line {
            border-top: 1px solid #000;
            width: 150px;
            margin-top: 15px;
            margin-left: auto;
            padding-top: 3px;
            text-align: center;
            font-size: 10px;
          }
        </style>
      </head>
      <body>
        <div class="print-container">
          ${printContent.innerHTML}
        </div>
      </body>
    </html>
  `);
  iframeDoc.close();
  
  // 等待iframe加载完成后打印
  iframe.onload = () => {
    // 打印
    iframe.contentWindow.focus();
    iframe.contentWindow.print();
    
    // 在打印对话框关闭后移除iframe
    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 500);
  };
};

// 将DOM元素导出为PDF - 使用后端API
export const exportToPDF = async (elementId, filename = 'order.pdf') => {
  let loadingToast = null;
  
  try {
    // 获取订单ID (从URL中获取)
    const pathParts = window.location.pathname.split('/');
    const orderId = pathParts[pathParts.length - 1];
    
    // 确认我们有一个有效的订单ID
    if (!orderId || isNaN(parseInt(orderId))) {
      throw new Error('无法获取订单ID');
    }
    
    // 构建API URL
    const apiBaseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080/api';
    const url = `${apiBaseUrl}/orders/${orderId}/pdf`;
    
    // 获取认证令牌
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('未找到认证令牌，可能会导致PDF生成失败');
    }
    
    // 创建请求头
    const headers = {
      'Accept': 'application/pdf',
    };
    
    // 添加认证令牌（如果存在）
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    // 创建下载状态提示
    loadingToast = document.createElement('div');
    loadingToast.style.position = 'fixed';
    loadingToast.style.bottom = '20px';
    loadingToast.style.right = '20px';
    loadingToast.style.background = 'rgba(0, 0, 0, 0.7)';
    loadingToast.style.color = 'white';
    loadingToast.style.padding = '10px 20px';
    loadingToast.style.borderRadius = '4px';
    loadingToast.style.zIndex = '9999';
    loadingToast.textContent = '正在生成PDF，请稍候...';
    document.body.appendChild(loadingToast);
    
    console.log(`发起PDF导出请求: ${url}, 订单ID: ${orderId}`);
    console.log('请求头:', headers);
    
    try {
      // 发起请求获取PDF - 使用fetch API手动处理二进制响应
      const response = await fetch(url, {
        method: 'GET',
        headers: headers
      });
      
      console.log('PDF导出请求响应状态:', response.status, response.statusText);
      console.log('响应头:', [...response.headers.entries()].map(h => `${h[0]}: ${h[1]}`).join(', '));
      
      if (!response.ok) {
        let errorMessage = `状态码: ${response.status} ${response.statusText}`;
        try {
          const errorText = await response.text();
          console.error('错误响应内容:', errorText);
          errorMessage += ` - ${errorText}`;
        } catch (e) {
          console.error('无法解析错误响应:', e);
        }
        throw new Error(`导出PDF失败: ${errorMessage}`);
      }
      
      // 获取PDF数据 - 明确使用arrayBuffer()而不是blob()
      const arrayBuffer = await response.arrayBuffer();
      console.log('获取到ArrayBuffer数据大小:', arrayBuffer.byteLength, '字节');
      
      if (arrayBuffer.byteLength === 0) {
        throw new Error('导出的PDF文件大小为0，可能是生成失败');
      }
      
      // 创建Blob对象 - 明确指定MIME类型
      const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
      console.log('创建Blob对象:', blob.size, '字节, 类型:', blob.type);
      
      // 移除加载提示
      if (document.body.contains(loadingToast)) {
        document.body.removeChild(loadingToast);
        loadingToast = null;
      }
      
      // 创建下载链接
      const downloadUrl = window.URL.createObjectURL(blob);
      
      // 下载或预览PDF
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = downloadUrl;
      a.download = filename || `order-${orderId}.pdf`;
      
      // 触发下载
      document.body.appendChild(a);
      a.click();
      
      // 清理资源
      setTimeout(() => {
        window.URL.revokeObjectURL(downloadUrl);
        document.body.removeChild(a);
      }, 200);
      
      console.log('PDF下载已启动');
      
    } catch (error) {
      // 移除加载提示(如果还存在)
      if (document.body.contains(loadingToast)) {
        document.body.removeChild(loadingToast);
        loadingToast = null;
      }
      
      throw error;
    }
  } catch (error) {
    console.error('导出PDF时出错:', error);
    
    // 确保加载提示被移除
    if (loadingToast && document.body.contains(loadingToast)) {
      document.body.removeChild(loadingToast);
    }
    
    // 显示友好错误信息
    alert(`导出PDF失败: ${error.message}`);
  }
};