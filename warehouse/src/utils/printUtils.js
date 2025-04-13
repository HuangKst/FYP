import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

// 从DOM元素直接打印
export const printElement = (elementId) => {
  const printContent = document.getElementById(elementId);
  if (!printContent) return;
  
  const originalContents = document.body.innerHTML;
  const printContentHtml = printContent.innerHTML;
  
  // 创建一个新的HTML文档，包含完整的样式
  document.body.innerHTML = `
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          h5 { text-align: center; margin-bottom: 20px; }
          .divider { border-top: 1px solid #ddd; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="print-container">
          ${printContentHtml}
        </div>
      </body>
    </html>
  `;
  
  window.print();
  document.body.innerHTML = originalContents;
  window.location.reload();
};

// 将DOM元素导出为PDF
export const exportToPDF = async (elementId, filename = 'order.pdf') => {
  const element = document.getElementById(elementId);
  if (!element) return;
  
  try {
    const canvas = await html2canvas(element, {
      scale: 2, // 提高分辨率
      useCORS: true, // 允许加载跨域图片
      logging: false,
      onclone: (document) => {
        // 在克隆的文档上应用样式
        const style = document.createElement('style');
        style.innerHTML = `
          body { font-family: Arial, sans-serif; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
        `;
        document.head.appendChild(style);
      }
    });
    
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    const imgWidth = 210; // A4宽度 (mm)
    const pageHeight = 295; // A4高度 (mm)
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;
    
    // 添加第一页
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
    
    // 如果内容超过一页，添加更多页
    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }
    
    // 保存PDF
    pdf.save(filename);
  } catch (error) {
    console.error('导出PDF时出错:', error);
    alert('导出PDF失败，请稍后再试');
  }
}; 