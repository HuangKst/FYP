import React, { useState, useEffect } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    CircularProgress,
    Tooltip,
    List,
    ListItem,
    ListItemText,
    Divider
} from '@mui/material';
import { styled } from '@mui/material/styles';

// API imports
import instance from '../../api/axios';

// 材质颜色映射
const materialColors = {
    '201': '#2196f3', // 蓝色
    '304': '#4caf50'  // 绿色
};

// 饼图切片的悬停效果样式
const PieSlice = styled('path')(({ theme }) => ({
    cursor: 'pointer',
    transition: 'transform 0.3s ease, opacity 0.2s ease',
    '&:hover': {
        transform: 'scale(1.05)',
        opacity: 0.8,
    },
}));

// 自定义提示组件
const TooltipContent = styled(Box)(({ theme }) => ({
    padding: theme.spacing(1),
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    color: '#fff',
    borderRadius: theme.shape.borderRadius,
    fontSize: '0.75rem',
    maxWidth: 200,
}));

const InventoryPieChart = ({ material, title }) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [inventoryData, setInventoryData] = useState([]);
    const [topItems, setTopItems] = useState([]);
    const [hoverItem, setHoverItem] = useState(null);
    const [totalQuantity, setTotalQuantity] = useState(0);

    useEffect(() => {
        fetchInventoryData();
    }, [material]);

    // 获取指定材质的库存数据
    const fetchInventoryData = async () => {
        try {
            setLoading(true);
            setError(null);

            // 调用API获取特定材质的库存数据
            const response = await instance.get('/inventory/all', {
                params: { material }
            });

            if (response.data && response.data.success) {
                const rawData = response.data.inventory || [];

                // 计算总数 & 排序（从高到低）
                const sortedByQuantity = [...rawData].sort((a, b) => parseFloat(b.quantity) - parseFloat(a.quantity));

                // 添加颜色：数量越大 → 越深
                const data = sortedByQuantity.map((item, index) => {
                    const color = getSliceColor(index, sortedByQuantity.length);
                    return { ...item, color };
                });
                ;

                // 计算总数量
                const total = data.reduce((sum, item) => sum + parseFloat(item.quantity || 0), 0);

                // 排序找出数量最多的前5个
                const sortedData = [...data].sort((a, b) =>
                    parseFloat(b.quantity) - parseFloat(a.quantity)
                );

                // 取前5个，如果不足5个则取全部
                const top5 = sortedData.slice(0, 5);

                setInventoryData(data);
                setTopItems(top5);
                setTotalQuantity(total);
            } else {
                setError('Failed to fetch inventory data');
            }
        } catch (err) {
            console.error(`Failed to fetch ${material} inventory data:`, err);
            setError('Error fetching inventory data');
        } finally {
            setLoading(false);
        }
    };

    // 为每个规格生成不同的颜色
    const getSliceColor = (index, total) => {
        // 基础颜色选择（按材质）
        const baseColor = material === '201'
          ? { r: 33, g: 150, b: 243 }   // 蓝色
          : { r: 76, g: 175, b: 80 };   // 绿色
      
        // 明度从 0%（最深）到 50%（最浅）过渡（数量越多 index 越小）
        const lightnessAdjust = ((total - index - 1) / total) * 50;
      
        // 计算最终颜色
        const r = Math.min(255, baseColor.r + lightnessAdjust);
        const g = Math.min(255, baseColor.g + lightnessAdjust);
        const b = Math.min(255, baseColor.b + lightnessAdjust);
      
        return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
      };
      

    // 生成饼图路径
    const generatePieSlices = () => {
        if (!inventoryData || inventoryData.length === 0) return [];

        const total = totalQuantity;
        const slices = [];

        // 饼图中心和半径 - 调整位置和半径
        const centerX = 100;
        const centerY = 120;
        const radius = 95;

        let startAngle = 0;

        inventoryData.forEach((item, index) => {
            // 计算该规格占总量的比例
            const ratio = parseFloat(item.quantity) / total;
            // 计算扇形的角度 (弧度)
            const angle = ratio * Math.PI * 2;

            // 计算扇形的起点和终点坐标
            const startX = centerX + radius * Math.cos(startAngle);
            const startY = centerY + radius * Math.sin(startAngle);

            const endAngle = startAngle + angle;
            const endX = centerX + radius * Math.cos(endAngle);
            const endY = centerY + radius * Math.sin(endAngle);

            // 判断是否需要画大弧 (当角度超过180度时)
            const largeArcFlag = angle > Math.PI ? 1 : 0;

            // 构建SVG路径
            const path = `
        M ${centerX} ${centerY}
        L ${startX} ${startY}
        A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY}
        Z
      `;

            slices.push({
                path,
                color: item.color,
                item,
                id: index,
            });

            // 更新起始角度
            startAngle = endAngle;
        });

        return slices;
    };

    // 处理鼠标悬停事件
    const handleMouseEnter = (item) => {
        setHoverItem(item);
    };

    const handleMouseLeave = () => {
        setHoverItem(null);
    };

    // 图形渲染
    return (
        <Card sx={{
            height: '100%',
            background: 'white',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)',
            borderRadius: 2
        }}>
            <CardContent sx={{ pt: 2, pb: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: '#333', mb: 1 }}>
                    {title || `${material} Inventory`}
                </Typography>

                {loading ? (
                    <Box display="flex" justifyContent="center" alignItems="center" height={230}>
                        <CircularProgress />
                    </Box>
                ) : error ? (
                    <Box display="flex" justifyContent="center" alignItems="center" height={230}>
                        <Typography variant="body2" color="error">
                            {error}
                        </Typography>
                    </Box>
                ) : inventoryData.length === 0 ? (
                    <Box display="flex" justifyContent="center" alignItems="center" height={230}>
                        <Typography variant="body2" color="textSecondary">
                            No inventory data available for {material}
                        </Typography>
                    </Box>
                ) : (
                    <Box sx={{ display: 'flex', flex: 1 }}>
                        {/* 左侧饼图 */}
                        <Box
                            position="relative"
                            sx={{
                                width: '45%',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                pl: 0
                            }}
                        >
                            <svg width="200" height="240" viewBox="0 0 200 240">
                                {generatePieSlices().map((slice, index) => (
                                    <PieSlice
                                        key={index}
                                        d={slice.path}
                                        fill={slice.color}
                                        onMouseEnter={() => handleMouseEnter(slice.item)}
                                        onMouseLeave={handleMouseLeave}
                                    />
                                ))}
                            </svg>

                            {/* 库存总量显示在左下角 */}
                            <Box
                                position="absolute"
                                bottom={10}
                                left={5}
                                sx={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'flex-start',
                                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                                    padding: '4px 8px',
                                    borderRadius: '4px'
                                }}
                            >
                                <Typography
                                    variant="body2"
                                    sx={{ color: '#666', fontSize: '0.75rem' }}
                                >
                                    Total Inventory:
                                </Typography>
                                <Typography
                                    variant="h6"
                                    component="div"
                                    sx={{ fontWeight: 'bold', color: '#333' }}
                                >
                                    {totalQuantity.toFixed(0)}
                                </Typography>
                            </Box>

                            {/* 悬停提示 */}
                            {hoverItem && (
                                <Box
                                    position="absolute"
                                    sx={{
                                        top: '2%',
                                        left: '2%',
                                        transform: 'translate(0, 0)',
                                        backgroundColor: 'rgba(0, 0, 0, 0.85)',
                                        color: '#fff',
                                        padding: '8px 12px',
                                        borderRadius: '4px',
                                        fontSize: '0.75rem',
                                        zIndex: 1000,
                                        pointerEvents: 'none',
                                        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.2)',
                                    }}
                                >
                                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                        {hoverItem.specification}
                                    </Typography>
                                    <Typography variant="caption" display="block">
                                        Quantity: {parseFloat(hoverItem.quantity).toFixed(2)}
                                    </Typography>
                                    <Typography variant="caption" display="block">
                                        Percent: {((parseFloat(hoverItem.quantity) / totalQuantity) * 100).toFixed(1)}%
                                    </Typography>
                                </Box>
                            )}

                        </Box>

                        {/* 右侧TOP 5列表 */}
                        <Box
                            sx={{
                                width: '55%',
                                pl: 0,
                                pr: 2,
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'flex-start',
                                pt: 0
                            }}
                        >
                            <Box
                                sx={{
                                    borderRadius: '4px',
                                    py: 1,
                                    px: 2,
                                    mx: 0,
                                    mt: 0,
                                    mb: 'auto',
                                    backgroundColor: 'rgba(245, 245, 245, 0.5)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'flex-start'
                                }}
                            >
                                <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 0.5, fontSize: '0.9rem' }}>
                                    Top {topItems.length} Inventory Items
                                </Typography>

                                {topItems.map((item, index) => (
                                    <Box
                                        key={index}
                                        sx={{
                                            mb: index < topItems.length - 1 ? 0.7 : 0,
                                            display: 'flex',
                                            flexDirection: 'column'
                                        }}
                                    >
                                        <Box sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            mb: 0.3
                                        }}>
                                            <Box
                                                sx={{
                                                    width: 8,
                                                    height: 8,
                                                    bgcolor: item.color,
                                                    borderRadius: '50%',
                                                    mr: 1
                                                }}
                                            />
                                            <Typography variant="body2" noWrap sx={{ fontWeight: 500, flex: 1, fontSize: '0.85rem' }}>
                                                {item.specification}
                                            </Typography>
                                        </Box>
                                        <Box sx={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            width: '100%',
                                            pl: 2.5
                                        }}>
                                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                                                {parseFloat(item.quantity).toFixed(2)}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                                                {((parseFloat(item.quantity) / totalQuantity) * 100).toFixed(1)}%
                                            </Typography>
                                        </Box>
                                    </Box>
                                ))}
                            </Box>
                        </Box>
                    </Box>
                )}
            </CardContent>
        </Card>
    );
};

export default InventoryPieChart;
