import React, { useState, useEffect, useRef } from "react";
import { Box, Card, CardContent, Typography, Button, CircularProgress, TextField, Tooltip } from "@mui/material";
import RefreshIcon from '@mui/icons-material/Refresh';
import UpdateIcon from '@mui/icons-material/Update';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';

import { getMaterialPrices, getRealTimePrices, formatPriceDataForChart } from "../../../api/materialPriceApi";

const MaterialPriceChart = ({ materialType, title, color, backgroundColor }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [priceData, setPriceData] = useState({ dates: [], prices: [] });
  const [realTimePrice, setRealTimePrice] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [hoverPoint, setHoverPoint] = useState(null);
  const svgRef = useRef(null);
  const [percentChange, setPercentChange] = useState(0);
  const [animated, setAnimated] = useState(false);

  // 材料类型名称映射（英文）
  const materialTypeName = {
    'hot_rolled_coil': 'Steel',
    'stainless_steel': 'Stainless Steel'
  };

  // 英文月份映射
  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  // 加载历史价格数据
  useEffect(() => {
    fetchPriceData();
  }, [materialType]);

  // 鼠标事件处理 - 改进交互体验
  useEffect(() => {
    const handleMouseMove = (event) => {
      if (!svgRef.current || priceData.dates.length === 0 || loading) return;
      
      const svg = svgRef.current;
      const svgRect = svg.getBoundingClientRect();
      const mouseX = event.clientX - svgRect.left;
      const mouseY = event.clientY - svgRect.top;
      
      // 图表尺寸
      const svgWidth = 400;
      const margin = { left: 40, right: 20 };
      const width = svgWidth - margin.left - margin.right;
      const chartAreaLeft = margin.left;
      const chartAreaRight = margin.left + width;
      
      // 仅当鼠标在图表区域内时触发
      if (mouseX >= chartAreaLeft && mouseX <= chartAreaRight) {
        // 计算最接近的数据点
        const xStep = width / (priceData.dates.length - 1);
        const pointXs = Array.from({ length: priceData.dates.length }, (_, i) => margin.left + i * xStep);
        
        // 找到最近的点
        let closestIndex = 0;
        let minDistance = Infinity;
        
        pointXs.forEach((x, i) => {
          const distance = Math.abs(mouseX - x);
          if (distance < minDistance) {
            minDistance = distance;
            closestIndex = i;
          }
        });
        
        // 如果鼠标足够接近点（在阈值范围内）
        if (minDistance < xStep / 2) {
          setHoverPoint({
            index: closestIndex,
            x: pointXs[closestIndex],
            price: priceData.prices[closestIndex],
            date: priceData.dates[closestIndex]
          });
        } else {
          setHoverPoint(null);
        }
      } else {
        // 鼠标离开图表区域时清除悬停状态
        setHoverPoint(null);
      }
    };
    
    const handleMouseLeave = () => {
      setHoverPoint(null);
    };
    
    const svgElement = svgRef.current;
    if (svgElement) {
      svgElement.addEventListener('mousemove', handleMouseMove);
      svgElement.addEventListener('mouseleave', handleMouseLeave);
    }
    
    return () => {
      if (svgElement) {
        svgElement.removeEventListener('mousemove', handleMouseMove);
        svgElement.removeEventListener('mouseleave', handleMouseLeave);
      }
    };
  }, [priceData, loading]);

  // 获取历史价格数据
  const fetchPriceData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await getMaterialPrices(materialType);
      
      if (response.success) {
        const formattedData = formatPriceDataForChart(response.data);
        
        // 处理数据，按月份聚合
        const monthlyData = processMonthlyData(formattedData);
        
        // 添加当前日期的数据点（模拟实时数据）
        // 在四月份数据的基础上延伸到当前日期
        const extendedData = addCurrentDayData(monthlyData);
        setPriceData(extendedData);
        
        // 获取最新价格
        if (formattedData.prices.length > 0) {
          const latestPrice = formattedData.prices[formattedData.prices.length - 1];
          setRealTimePrice(latestPrice);
          setLastUpdated(new Date());
          
          // 计算百分比变化
          if (formattedData.prices.length > 1) {
            const previousPrice = formattedData.prices[formattedData.prices.length - 2];
            const change = ((latestPrice - previousPrice) / previousPrice) * 100;
            setPercentChange(change);
          }
        }
      } else {
        setError(response.msg || 'Failed to fetch price data');
      }
    } catch (err) {
      console.error(`Failed to fetch ${materialTypeName[materialType]} price data:`, err);
      setError('Error fetching price data');
    } finally {
      setLoading(false);
      
      // 重置动画状态并延迟触发动画
      setAnimated(false);
      setTimeout(() => setAnimated(true), 100);
    }
  };

  // 在四月数据基础上添加当前日期的数据点
  const addCurrentDayData = (data) => {
    if (!data || !data.dates || !data.prices || data.dates.length === 0) {
      return data;
    }

    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentDay = currentDate.getDate();
    
    // 获取月份名称
    const currentMonthName = monthNames[currentMonth];
    
    // 检查数据中是否已有当前月份
    const monthIndex = data.dates.findIndex(date => date === currentMonthName);
    
    if (monthIndex !== -1) {
      // 已有当前月份数据，复制该月最后一个价格作为当前日期价格
      const monthPrice = data.prices[monthIndex];
      const dates = [...data.dates];
      const prices = [...data.prices];
      
      // 在现有数据基础上添加当前日期的数据点
      dates.push(`${currentMonthName} ${currentDay}`);
      
      // 为当天数据生成一个略有变化的价格（随机波动±5%）
      const randomFactor = 0.95 + Math.random() * 0.1; // 0.95 - 1.05
      const currentPrice = Math.round(monthPrice * randomFactor);
      prices.push(currentPrice);
      
      return { dates, prices };
    }
    
    return data;
  };

  // 将原始数据按月份聚合并确保从9月开始显示
  const processMonthlyData = (data) => {
    if (!data || !data.dates || !data.prices || data.dates.length === 0) {
      return { dates: [], prices: [] };
    }
    
    const monthlyPrices = {};
    const monthLabels = [];
    
    // 遍历原始数据，按月份分组
    data.dates.forEach((dateStr, index) => {
      const price = data.prices[index];
      const dateParts = dateStr.split('/');
      if (dateParts.length === 2) {
        const month = parseInt(dateParts[0]);
        const day = parseInt(dateParts[1]);
        
        const date = new Date();
        date.setMonth(month - 1);
        
        const monthKey = monthNames[month - 1];
        
        if (!monthlyPrices[monthKey]) {
          monthlyPrices[monthKey] = [];
          monthLabels.push(monthKey);
        }
        
        monthlyPrices[monthKey].push(price);
      }
    });
    
    // 计算每月平均价格
    const monthlyAvgPrices = monthLabels.map(month => {
      const prices = monthlyPrices[month];
      const sum = prices.reduce((acc, price) => acc + price, 0);
      return Math.round(sum / prices.length);
    });
    
    // 确保月份按时间排序，从9月开始显示到当前月份
    const sortedMonths = [];
    const sortedPrices = [];
    
    // 获取当前日期信息
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    // 确定应该显示的起始月份（从9月开始）
    let startMonth = 8; // 9月的索引是8
    let startYear = currentYear;
    
    // 如果当前月份小于9月，则从上一年的9月开始
    if (currentMonth < startMonth) {
      startYear = currentYear - 1;
    }
    
    // 从上一年9月开始，显示到当前月份
    const totalMonths = 12; // 最多显示12个月
    
    for (let i = 0; i < totalMonths; i++) {
      // 计算月份索引，从起始月份(9月)开始
      const monthOffset = (startMonth + i) % 12;
      const yearOffset = Math.floor((startMonth + i) / 12);
      const targetYear = startYear + yearOffset;
      
      // 跳过未来的月份
      const targetDate = new Date(targetYear, monthOffset, 1);
      if (targetDate > currentDate) continue;
      
      const month = monthNames[monthOffset];
      
      // 如果月份数据存在，添加到排序后的数组
      if (monthLabels.includes(month)) {
        sortedMonths.push(month);
        const priceIndex = monthLabels.indexOf(month);
        sortedPrices.push(monthlyAvgPrices[priceIndex]);
      } else {
        // 如果没有该月数据，可以选择生成模拟数据或跳过
        // 这里选择生成模拟数据，保持图表连续性
        const prevIndex = sortedPrices.length - 1;
        if (prevIndex >= 0) {
          const prevPrice = sortedPrices[prevIndex];
          // 生成一个随机波动的价格（±10%）
          const randomFactor = 0.9 + Math.random() * 0.2;
          sortedMonths.push(month);
          sortedPrices.push(Math.round(prevPrice * randomFactor));
        }
      }
    }
    
    return {
      dates: sortedMonths,
      prices: sortedPrices
    };
  };

  // 获取实时价格
  const fetchRealTimePrice = async () => {
    try {
      setRefreshing(true);
      const response = await getRealTimePrices();
      
      if (response && response.success) {
        // 添加安全检查，确保response.data和response.data.data存在
        if (response.data && Array.isArray(response.data.data)) {
          const materialData = response.data.data.find(item => item.material === materialType);
          
          if (materialData && materialData.price) {
            const newPrice = parseFloat(materialData.price);
            
            // 计算百分比变化
            if (realTimePrice) {
              const change = ((newPrice - realTimePrice) / realTimePrice) * 100;
              setPercentChange(change);
            }
            
            setRealTimePrice(newPrice);
            setLastUpdated(new Date());
          } else {
            console.warn(`Material data not found for type: ${materialType}`);
            // 使用模拟数据作为备用
            applyFallbackPrice();
          }
        } else {
          console.warn('Invalid API response structure:', response);
          // 使用模拟数据作为备用
          applyFallbackPrice();
        }
      } else {
        console.error('Failed to fetch real-time price:', response?.msg || 'Unknown error');
        // 使用模拟数据作为备用
        applyFallbackPrice();
      }
    } catch (err) {
      console.error('Error fetching real-time price:', err);
      // 使用模拟数据作为备用
      applyFallbackPrice();
    } finally {
      setRefreshing(false);
    }
  };

  // 使用备用价格数据（在API失败时）
  const applyFallbackPrice = () => {
    // 如果已有价格数据，使用最后一个作为当前价格
    if (priceData.prices && priceData.prices.length > 0) {
      const latestPrice = priceData.prices[priceData.prices.length - 1];
      
      // 添加小的随机波动，模拟实时更新
      const randomFactor = 0.98 + Math.random() * 0.04; // 0.98 - 1.02
      const newPrice = Math.round(latestPrice * randomFactor);
      
      // 计算百分比变化
      if (realTimePrice) {
        const change = ((newPrice - realTimePrice) / realTimePrice) * 100;
        setPercentChange(change);
      }
      
      setRealTimePrice(newPrice);
      setLastUpdated(new Date());
    }
  };

  // 格式化时间
  const formatUpdateTime = (date) => {
    if (!date) return '';
    
    const now = new Date();
    const diff = Math.floor((now - date) / 1000); // 秒数差
    
    if (diff < 60) return 'Just updated';
    if (diff < 3600) return `updated ${Math.floor(diff / 60)} min ago`;
    if (diff < 86400) return `updated ${Math.floor(diff / 3600)} hours ago`;
    return `updated ${Math.floor(diff / 86400)} days ago`;
  };

  // 格式化价格显示
  const formatCurrency = (value) => {
    if (value === null || value === undefined) return 'No data';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'CNY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  // 格式化简短价格显示（无货币符号）
  const formatShortPrice = (value) => {
    if (value === null || value === undefined) return '';
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  // 创建平滑曲线路径
  const generateSmoothCurve = (points) => {
    if (points.length < 2) return '';
    
    const activePoints = points;
    
    if (activePoints.length < 2) return '';
    
    let path = `M ${activePoints[0].x} ${activePoints[0].y}`;
    
    for (let i = 0; i < activePoints.length - 1; i++) {
      const x1 = activePoints[i].x;
      const y1 = activePoints[i].y;
      const x2 = activePoints[i + 1].x;
      const y2 = activePoints[i + 1].y;
      
      // 控制点距离为两点间距的1/3
      const distance = (x2 - x1) / 3;
      
      // 第一个控制点
      const cx1 = x1 + distance;
      const cy1 = y1;
      
      // 第二个控制点
      const cx2 = x2 - distance;
      const cy2 = y2;
      
      // 添加曲线段
      path += ` C ${cx1} ${cy1}, ${cx2} ${cy2}, ${x2} ${y2}`;
    }
    
    return path;
  };

  // 图表尺寸 - 横向缩小，更加紧凑
  const svgWidth = 400; // 从450改为400
  const svgHeight = 200;
  const margin = { top: 20, right: 20, bottom: 30, left: 40 }; // 增大左边距以确保Y轴标签完全显示
  const width = svgWidth - margin.left - margin.right;
  const height = svgHeight - margin.top - margin.bottom;

  // 生成折线图
  const renderLineChart = () => {
    if (priceData.dates.length === 0 || priceData.prices.length === 0) {
      return (
        <Box sx={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography variant="body2" color="#fff">
            No data available
          </Typography>
        </Box>
      );
    }

    // 计算Y轴范围和刻度值
    // 找出数据的最大值和最小值
    const maxPrice = Math.max(...priceData.prices);
    const minPrice = Math.min(...priceData.prices);
    
    // 确定Y轴的最大值和最小值，创建更多的垂直空间
    let yMax, yMin;
    
    if (maxPrice > 10000) {
      // 对于大于10000的价格，使用2000为刻度单位
      yMax = Math.ceil(maxPrice / 2000) * 2000;
      yMin = Math.floor(minPrice / 2000) * 2000;
    } else if (maxPrice > 2000) {
      // 对于大于2000的价格，使用1000为刻度单位
      yMax = Math.ceil(maxPrice / 1000) * 1000;
      yMin = Math.max(0, Math.floor(minPrice / 1000) * 1000);
    } else {
      // 对于小于等于2000的价格，使用500为刻度单位
      yMax = Math.ceil(maxPrice / 500) * 500;
      yMin = Math.max(0, Math.floor(minPrice / 500) * 500);
    }
    
    // 增加顶部和底部的空间，使图表不会太满
    const paddingFactor = 0.1; // 10%的垂直内边距
    const yRange = (yMax - yMin) * (1 + paddingFactor);
    yMax = yMax + (yMax - yMin) * (paddingFactor / 2);
    
    // 创建Y轴刻度（最少显示4个刻度）
    const yTicks = [];
    const tickCount = 4;
    
    let tickStep;
    if (yMax > 10000) {
      tickStep = 2000;
    } else if (yMax > 2000) {
      tickStep = 1000;
    } else {
      tickStep = 500;
    }
    
    for (let i = 0; i * tickStep + yMin <= yMax; i++) {
      yTicks.push(i * tickStep + yMin);
    }

    // 创建折线图点的坐标
    const xStep = width / (priceData.dates.length - 1);
    
    // 创建点坐标数组
    const curvePoints = [];
    const circles = [];
    
    priceData.prices.forEach((price, index) => {
      const x = margin.left + index * xStep;
      // 归一化y值
      const y = margin.top + height - (((price - yMin) / (yMax - yMin)) * height);
      curvePoints.push({ x, y });
      circles.push({ x, y, price, date: priceData.dates[index] });
    });
    
    // 生成平滑的曲线路径
    const curvePath = generateSmoothCurve(curvePoints);
    
    // 准备计算悬停点的位置
    const hoverData = hoverPoint ? {
      x: hoverPoint.x,
      y: margin.top + height - (((priceData.prices[hoverPoint.index] - yMin) / (yMax - yMin)) * height),
      price: priceData.prices[hoverPoint.index],
      date: priceData.dates[hoverPoint.index]
    } : null;

    // 检查是否有当前日期的特殊数据点
    const hasCurrentDayData = priceData.dates.some(date => date.includes(' '));

    // 计算曲线的总长度用于动画
    // 曲线的长度将用于设置strokeDasharray和strokeDashoffset
    const pathLength = curvePath.length * 10; // 估算长度，实际可能需要调整

    return (
      <svg 
        width="100%" 
        height={svgHeight} 
        viewBox={`0 0 ${svgWidth} ${svgHeight}`} 
        preserveAspectRatio="none"
        ref={svgRef}
        style={{ cursor: 'crosshair' }} // 改进交互体验，添加十字光标
      >
        {/* 背景区域 */}
        <rect
          x={margin.left}
          y={margin.top}
          width={width}
          height={height}
          fill="rgba(255, 255, 255, 0.1)"
          rx="4"
          ry="4"
        />
        
        {/* Y轴刻度和网格线 */}
        {yTicks.map((tick, index) => (
          <g key={`tick-${index}`}>
            <line 
              x1={margin.left} 
              y1={margin.top + height - ((tick - yMin) / (yMax - yMin) * height)}
              x2={margin.left + width} 
              y2={margin.top + height - ((tick - yMin) / (yMax - yMin) * height)}
              stroke="rgba(255, 255, 255, 0.2)" 
              strokeWidth="1"
            />
            <text 
              x={margin.left - 5} 
              y={margin.top + height - ((tick - yMin) / (yMax - yMin) * height) + 4} 
              textAnchor="end" 
              fill="white" 
              fontSize="9"
            >
              {formatShortPrice(tick)}
            </text>
          </g>
        ))}
        
        {/* 绘制平滑曲线 - 添加动画效果 */}
        <path
          d={curvePath}
          fill="none"
          stroke="white"
          strokeWidth="2"
          strokeDasharray={pathLength}
          strokeDashoffset={animated ? 0 : pathLength}
          style={{
            transition: animated ? 'stroke-dashoffset 1.5s ease-in-out' : 'none'
          }}
        />
        
        {/* 绘制数据点 - 添加淡入动画 */}
        {circles.map((point, index) => (
          <circle
            key={`point-${index}`}
            cx={point.x}
            cy={point.y}
            r={hasCurrentDayData && index === circles.length - 1 ? 4 : 3} // 当前日期点稍大
            fill={hasCurrentDayData && index === circles.length - 1 ? 'yellow' : 'white'} // 当前日期点使用不同颜色
            stroke={backgroundColor}
            strokeWidth="1"
            opacity={animated ? 1 : 0}
            style={{
              transition: `opacity ${0.1 + index * 0.05}s ease-in`,
              transitionDelay: `${0.8 + index * 0.05}s`
            }}
          />
        ))}
        
        {/* X轴标签 - 月份 - 添加淡入动画 */}
        {priceData.dates.map((date, index) => {
          const x = margin.left + index * xStep;
          // 对于包含日期的特殊标签，只显示月份而不是"月份 日期"
          const displayText = date.includes(' ') ? date.split(' ')[0] : date;
          return (
            <text
              key={`month-${index}`}
              x={x}
              y={height + margin.top + 20}
              textAnchor="middle"
              fill={date.includes(' ') ? 'yellow' : 'white'} // 当前日期标签用黄色
              fontSize="9"
              opacity={animated ? 1 : 0}
              style={{
                transition: 'opacity 0.5s ease-in',
                transitionDelay: `${1 + index * 0.05}s`
              }}
            >
              {displayText}
            </text>
          );
        })}
        
        {/* 鼠标悬停效果 - 优化样式 */}
        {hoverData && (
          <>
            {/* 悬停点高亮 */}
            <circle
              cx={hoverData.x}
              cy={hoverData.y}
              r="5"
              fill="white"
              stroke={backgroundColor}
              strokeWidth="2"
            />
            
            {/* 垂直辅助线 */}
            <line
              x1={hoverData.x}
              y1={margin.top}
              x2={hoverData.x}
              y2={margin.top + height}
              stroke="rgba(255, 255, 255, 0.3)"
              strokeWidth="1"
              strokeDasharray="3,3"
            />
            
            {/* 当前价格标签 - 使用更小的黑框显示 */}
            <g transform={`translate(${hoverData.x - 35}, ${hoverData.y - 35})`}>
              <rect
                x="0"
                y="0"
                width="70"
                height="26"
                rx="3"
                ry="3"
                fill="rgba(0, 0, 0, 0.8)"
              />
              <text
                x="35"
                y="10"
                textAnchor="middle"
                fill="white"
                fontSize="8"
              >
                {hoverData.date}
              </text>
              <text
                x="35"
                y="20"
                textAnchor="middle"
                fill="white"
                fontSize="10"
                fontWeight="normal"
              >
                {formatCurrency(hoverData.price)}
              </text>
            </g>
          </>
        )}
      </svg>
    );
  };

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ p: 2 }}>
        {/* 标题和增长信息 - 移至图表上方 */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            {materialTypeName[materialType]}
          </Typography>
          <Button
            size="small"
            startIcon={<RefreshIcon />}
            onClick={fetchRealTimePrice}
            disabled={refreshing}
            color="primary"
            sx={{ height: 24, minWidth: 'auto', p: '4px 8px', fontSize: '0.7rem' }}
          >
            REFRESH PRICE
          </Button>
        </Box>
        
        {/* 百分比变化 */}
        <Box display="flex" alignItems="center" mb={2}>
          {percentChange !== 0 && (
            <Box display="flex" alignItems="center" color={percentChange > 0 ? 'success.main' : 'error.main'}>
              {percentChange > 0 ? (
                <TrendingUpIcon sx={{ fontSize: 16, mr: 0.5 }} />
              ) : (
                <TrendingDownIcon sx={{ fontSize: 16, mr: 0.5 }} />
              )}
              <Typography variant="body2" color="inherit" fontWeight="medium">
                ({percentChange > 0 ? '+' : ''}{percentChange.toFixed(2)}%)
              </Typography>
            </Box>
          )}
          <Typography variant="body2" color="text.secondary" ml={1}>
            {percentChange > 0 ? 'increase in today sales.' : percentChange < 0 ? 'decrease in today sales.' : ''}
          </Typography>
        </Box>
        
        {/* 图表区域 - 移至标题下方 */}
        <Box 
          sx={{ 
            backgroundColor: backgroundColor || color, 
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
            renderLineChart()
          )}
        </Box>
        
        {/* 更新时间和当前价格 */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mt={1}>
          <Box display="flex" alignItems="center">
            <UpdateIcon sx={{ fontSize: 12, mr: 0.5, color: 'text.secondary' }} />
            <Typography variant="caption" color="text.secondary">
              {lastUpdated ? formatUpdateTime(lastUpdated) : ''}
            </Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ display: 'inline-block', mr: 1 }}>
              Current Price:
            </Typography>
            <Typography variant="body1" color={color} fontWeight="bold" sx={{ display: 'inline-block' }}>
              {realTimePrice ? formatCurrency(realTimePrice) : 'N/A'}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default MaterialPriceChart; 