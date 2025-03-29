import React from "react";
import { Box, Card, CardContent, Typography, Divider, Icon } from "@mui/material";

// 订单列表组件
const OrderList = ({ title, orders, totalAmount }) => {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">{title}</Typography>
          {totalAmount && (
            <Typography variant="subtitle1" color="primary">
              总计: ¥{totalAmount}
            </Typography>
          )}
        </Box>
        <Divider />
        <Box sx={{ mt: 2 }}>
          {orders.map((order, index) => (
            <Box key={index} sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  backgroundColor: order.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mr: 2
                }}
              >
                <Icon sx={{ color: 'white', fontSize: 20 }}>{order.icon}</Icon>
              </Box>
              <Box flex={1}>
                <Typography variant="body2">{order.title}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {order.date}
                </Typography>
              </Box>
              <Typography variant="body2" fontWeight="medium">
                {order.amount && `¥${order.amount}`}
              </Typography>
            </Box>
          ))}
        </Box>
      </CardContent>
    </Card>
  );
};

export default OrderList; 