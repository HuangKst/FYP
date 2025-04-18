import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Tooltip,
  Select,
  MenuItem,
  IconButton,
  FormControl
} from "@mui/material";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { getSalesStats } from "../../../api/statsApi";

const SalesChart = () => {
  // 当前选中的年份
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  
  // 可用年份列表
  const availableYears = [
    currentYear - 2,
    currentYear - 1,
    currentYear,
    currentYear + 1
  ];
  
  // 视图状态: 'quarter', 'month', 'week'
  const [viewMode, setViewMode] = useState('quarter');
  
  // 记录当前选中的季度和月份，用于下钻
  const [selectedQuarter, setSelectedQuarter] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(null);
  
  // 数据状态
  const [data, setData] = useState({
    labels: [],
    sales: [],
    totalSales: 0,
    growth: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hoverIndex, setHoverIndex] = useState(null);
  const [animated, setAnimated] = useState(false);

  // 视图配置
  const viewConfigs = {
    quarter: {
      labels: ['1', '2', '3', '4'],
      title: `${selectedYear} Sales`,
      description: 'Quarterly Performance',
      dataCount: 4,
      apiPeriod: 'quarterly'
    },
    month: {
      labels: selectedQuarter ? 
        (selectedQuarter === 1 ? ['1', '2', '3'] :
         selectedQuarter === 2 ? ['4', '5', '6'] :
         selectedQuarter === 3 ? ['7', '8', '9'] :
         ['10', '11', '12']) : [],
      title: `${selectedYear} Q${selectedQuarter} Sales`,
      description: 'Monthly Performance',
      dataCount: 3,
      apiPeriod: 'monthly'
    },
    week: {
      labels: ['1', '2', '3', '4', '5'],
      title: `${selectedYear} Month ${selectedMonth} Sales`,
      description: 'Weekly Performance',
      dataCount: 5,
      apiPeriod: 'weekly'
    }
  };

  // 获取当前视图配置
  const currentViewConfig = viewConfigs[viewMode];

  // 月份名称映射
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // 获取数据
  useEffect(() => {
    fetchData();
  }, [selectedYear, viewMode, selectedQuarter, selectedMonth]);

  // 获取数据的方法
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // 根据当前视图模式构建API参数
      const apiParams = {
        period: currentViewConfig.apiPeriod,
        year: selectedYear
      };
      
      // 添加季度和月份参数（如果有）
      if (selectedQuarter && viewMode !== 'quarter') {
        apiParams.quarter = selectedQuarter;
      }
      
      if (selectedMonth && viewMode === 'week') {
        apiParams.month = selectedMonth;
      }
      
      console.log('Fetching sales data with params:', apiParams);
      
      // 调用API获取数据，传递所有参数
      const response = await getSalesStats(
        apiParams.period,
        apiParams.year,
        apiParams.quarter,
        apiParams.month
      );
      
      if (response.success) {
        // 处理API返回的数据
        let processedData = processApiData(response.data);
        setData(processedData);
      } else {
        setError(response.msg || 'Failed to load sales data');
      }
    } catch (err) {
      console.error('Error fetching sales data:', err);
      setError('An error occurred while fetching sales data');
    } finally {
      setLoading(false);
      // 重置动画状态
      setAnimated(false);
      setTimeout(() => setAnimated(true), 100);
    }
  };

  // 处理API返回的数据，确保数据格式正确且完整
  const processApiData = (apiData) => {
    const count = currentViewConfig.dataCount;
    const expectedLabels = currentViewConfig.labels;
    
    // 确保sales数组存在且格式正确
    let sales = Array.isArray(apiData.sales) ? [...apiData.sales] : [];
    
    // 如果数据不足，用0填充
    while (sales.length < count) {
      sales.push(0);
    }
    
    // 如果数据超出需要的数量，则截断
    if (sales.length > count) {
      sales = sales.slice(0, count);
    }
    
    // 处理视图特定的数据映射
    if (viewMode === 'month' && selectedQuarter) {
      // 对于月视图，确保只显示当前季度的月份数据
      const startIndex = (selectedQuarter - 1) * 3;
      const endIndex = startIndex + 3;
      
      // 如果API返回了完整的月度数据，提取当前季度的部分
      if (apiData.sales && apiData.sales.length >= 12) {
        sales = apiData.sales.slice(startIndex, endIndex);
      }
    }
    
    return {
      labels: expectedLabels,
      sales: sales,
      totalSales: apiData.totalSales || 0,
      growth: apiData.growth || 0
    };
  };

  // 处理年份变化
  const handleYearChange = (event) => {
    setSelectedYear(event.target.value);
    // 重置视图到季度
    setViewMode('quarter');
    setSelectedQuarter(null);
    setSelectedMonth(null);
  };

  // 处理返回上一级
  const handleBack = () => {
    if (viewMode === 'month') {
      setViewMode('quarter');
      setSelectedQuarter(null);
    } else if (viewMode === 'week') {
      setViewMode('month');
      setSelectedMonth(null);
    }
  };

  // 处理点击条形图
  const handleBarClick = (index) => {
    if (viewMode === 'quarter') {
      // 从季度视图点击，转到月份视图
      setSelectedQuarter(parseInt(currentViewConfig.labels[index]));
      setViewMode('month');
    } else if (viewMode === 'month') {
      // 从月份视图点击，转到周视图
      const quarterMonths = selectedQuarter ? 
        (selectedQuarter === 1 ? [1, 2, 3] :
         selectedQuarter === 2 ? [4, 5, 6] :
         selectedQuarter === 3 ? [7, 8, 9] :
         [10, 11, 12]) : [];
      setSelectedMonth(quarterMonths[index]);
      setViewMode('week');
    }
    // 周视图点击不做任何操作
  };

  // 处理鼠标悬停
  const handleMouseEnter = (index) => {
    setHoverIndex(index);
  };

  const handleMouseLeave = () => {
    setHoverIndex(null);
  };

  // 获取期间标签文本
  const getPeriodLabelText = (index) => {
    const label = currentViewConfig.labels[index];
    if (viewMode === 'quarter') {
      return `Q${label}`;
    } else if (viewMode === 'month') {
      // 计算实际月份索引
      const quarterMonths = selectedQuarter ? 
        (selectedQuarter === 1 ? [0, 1, 2] :
         selectedQuarter === 2 ? [3, 4, 5] :
         selectedQuarter === 3 ? [6, 7, 8] :
         [9, 10, 11]) : [];
      const monthIndex = quarterMonths[index];
      return monthNames[monthIndex];
    } else {
      return `Week ${label}`;
    }
  };

  // 图表尺寸
  const svgWidth = 400;
  const svgHeight = 200;
  const margin = { top: 20, right: 15, bottom: 30, left: 15 };
  const width = svgWidth - margin.left - margin.right;
  const height = svgHeight - margin.top - margin.bottom;

  // 获取数据的最大值，为空时提供默认值
  const getMaxValue = () => {
    if (!data.sales || data.sales.length === 0) return 60;
    return Math.max(...data.sales, 1);
  };

  // 生成条形图元素
  const getBarElements = () => {
    if (!data.sales || data.sales.length === 0) return [];

    const maxValue = getMaxValue();
    const barWidth = width / data.sales.length * 0.6;
    const spacing = width / data.sales.length * 0.4;

    return data.sales.map((value, index) => {
      const x = margin.left + (index * (width / data.sales.length)) + (spacing / 2);
      const barHeight = (value / maxValue) * height;
      const y = height + margin.top - (animated ? barHeight : 0);
      
      const isHovered = index === hoverIndex;
      
      return {
        x,
        y,
        width: barWidth,
        height: animated ? barHeight : 0,
        value,
        isHovered,
        label: currentViewConfig.labels[index],
        periodLabel: getPeriodLabelText(index)
      };
    });
  };

  // 生成网格线
  const getHorizontalGridLines = () => {
    const maxValue = getMaxValue();
    const gridCount = 3;
    
    return Array.from({ length: gridCount }, (_, i) => {
      const value = maxValue * ((gridCount - i) / gridCount);
      const y = margin.top + (i * (height / gridCount));
      
      return {
        y,
        value: Math.round(value),
        width: width
      };
    });
  };

  // 格式化金额显示
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ p: 2 }}>
        {/* 标题栏与控件 */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {viewMode !== 'quarter' && (
              <IconButton 
                size="small" 
                onClick={handleBack}
                sx={{ mr: 1 }}
              >
                <ArrowBackIcon fontSize="small" />
              </IconButton>
            )}
            <div>
              <Typography variant="h6">{currentViewConfig.title}</Typography>
              <Typography variant="body2" color="text.secondary">
                {currentViewConfig.description}
              </Typography>
            </div>
          </Box>
          <FormControl size="small" sx={{ minWidth: 80 }}>
            <Select
              value={selectedYear}
              onChange={handleYearChange}
              variant="outlined"
              sx={{ height: 32 }}
            >
              {availableYears.map(year => (
                <MenuItem key={year} value={year}>{year}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
        
        {/* 添加一个空的Box来增加垂直间距，与MaterialPriceChart保持一致 */}
        <Box mb={2}></Box>
        
        {/* 图表区域 */}
        <Box 
          sx={{ 
            backgroundColor: '#1976d2', 
            borderRadius: '8px',
            overflow: 'hidden',
            mb: 2,
            p: 1,
            height: '200px'
          }}
        >
          {loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" height="200px">
              <CircularProgress sx={{ color: '#fff' }} />
            </Box>
          ) : error ? (
            <Box display="flex" justifyContent="center" alignItems="center" height="200px">
              <Typography color="#fff">{error}</Typography>
            </Box>
          ) : (
            <svg width="100%" height={svgHeight} viewBox={`0 0 ${svgWidth} ${svgHeight}`}>
              {/* 网格线 */}
              {getHorizontalGridLines().map((line, index) => (
                <g key={`grid-${index}`}>
                  <line 
                    x1={margin.left} 
                    y1={line.y} 
                    x2={margin.left + width} 
                    y2={line.y}
                    stroke="rgba(255, 255, 255, 0.2)" 
                    strokeWidth="1"
                  />
                  <text 
                    x={margin.left - 5} 
                    y={line.y + 5} 
                    textAnchor="end" 
                    fill="white" 
                    fontSize="12"
                  >
                    {line.value}
                  </text>
                </g>
              ))}
              
              {/* 条形图 */}
              {getBarElements().map((bar, index) => (
                <g 
                  key={`bar-${index}`}
                  onMouseEnter={() => handleMouseEnter(index)}
                  onMouseLeave={handleMouseLeave}
                  onClick={() => handleBarClick(index)}
                  style={{ cursor: viewMode === 'week' ? 'default' : 'pointer' }}
                >
                  <Tooltip 
                    title={`${bar.periodLabel}: ${formatCurrency(bar.value)}`} 
                    arrow
                    open={bar.isHovered}
                    placement="top"
                  >
                    <rect
                      x={bar.x}
                      y={bar.y}
                      width={bar.width}
                      height={bar.height}
                      fill="white"
                      rx="2"
                      ry="2"
                      opacity={bar.isHovered ? 0.9 : 0.7}
                      style={{
                        transition: 'height 0.8s ease-out, y 0.8s ease-out, opacity 0.3s'
                      }}
                    />
                  </Tooltip>
                  <text
                    x={bar.x + (bar.width / 2)}
                    y={height + margin.top + 20}
                    textAnchor="middle"
                    fill="white"
                    fontSize="14"
                  >
                    {bar.label}
                  </text>
                </g>
              ))}
            </svg>
          )}
        </Box>

        {/* 在图表下方添加总销售额 */}
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box display="flex" alignItems="center">
            <Typography variant="caption" color="text.secondary">
              Just updated
            </Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ display: 'inline-block', mr: 1 }}>
              Total Sales:
            </Typography>
            <Typography variant="body1" color="primary" fontWeight="bold" sx={{ display: 'inline-block' }}>
              {formatCurrency(data.totalSales)}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default SalesChart; 