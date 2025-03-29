import React from "react";
import { Box, Card, CardContent, Typography } from "@mui/material";

// 图表模拟组件
const ChartMock = ({ color, title, data, description, realTimePrice }) => {
  // 简单的模拟线条图
  const mockChart = () => {
    return (
      <Box sx={{ height: '200px', position: 'relative' }}>
        <svg width="100%" height="100%" viewBox="0 0 300 100">
          <polyline
            points={data}
            fill="none"
            stroke={color}
            strokeWidth="2"
          />
        </svg>
        {realTimePrice && (
          <Box sx={{ position: 'absolute', bottom: 10, right: 20 }}>
            <Typography variant="subtitle2" color="textSecondary">
              实时价格
            </Typography>
            <Typography variant="h6" color={color}>
              ¥{realTimePrice}
            </Typography>
          </Box>
        )}
      </Box>
    );
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
        <Typography variant="body2" color="textSecondary" gutterBottom>
          {description}
        </Typography>
        {mockChart()}
      </CardContent>
    </Card>
  );
};

export default ChartMock;
