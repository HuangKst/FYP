import React from "react";
import { 
  Box, 
  Grid, 
  Icon
} from "@mui/material";
import { 
  InventoryOutlined, 
  ShoppingCartOutlined, 
  AddShoppingCartOutlined, 
  PendingOutlined, 
  PeopleOutlined
} from '@mui/icons-material';

// 导入重构后的组件
import MDBox from "../component/MD/Box";
import MDTypography from "../component/MD/Typography";
import ComplexStatisticsCard from "../component/Cards/StatisticsCards";
import ChartMock from "../component/Cards/ChartCards";
import OrderList from "../component/Cards/OrderCards";

export default function Home() {
  // 模拟数据
  const mockSalesData = "20,40,30,60,45,80,70,90";
  const mockStainlessSteelData = "10,30,50,45,60,80,70,90";
  const mockCarbonSteelData = "5,25,40,30,70,60,85,75";
  
  // 模拟订单数据
  const queueOrders = [
    { title: "订单 #12345", date: "2023-05-12", icon: "shopping_cart", color: "#1976d2" },
    { title: "订单 #12346", date: "2023-05-13", icon: "shopping_cart", color: "#1976d2" },
    { title: "订单 #12347", date: "2023-05-14", icon: "shopping_cart", color: "#1976d2" },
  ];
  
  const uncompletedOrders = [
    { title: "订单 #12240", date: "2023-05-10", icon: "pending", color: "#ed6c02" },
    { title: "订单 #12241", date: "2023-05-11", icon: "pending", color: "#ed6c02" },
  ];
  
  const unpaidOrders = [
    { title: "订单 #12200", date: "2023-05-08", amount: "5,400", icon: "payments", color: "#d32f2f" },
    { title: "订单 #12210", date: "2023-05-09", amount: "3,200", icon: "payments", color: "#d32f2f" },
    { title: "订单 #12220", date: "2023-05-10", amount: "7,800", icon: "payments", color: "#d32f2f" },
  ];

  return (
    <Box sx={{ flexGrow: 1, bgcolor: "#f5f5f5", minHeight: "100vh" }}>
      <Box sx={{ p: 3 }}>
        {/* 功能卡片区域 */}
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={2.4}>
            <MDBox mb={1.5}>
              <ComplexStatisticsCard
                color="primary"
                icon={<ShoppingCartOutlined style={{ fontSize: 26 }} />}
                title="订单"
                count="245"
                percentage={{
                  color: "success",
                  amount: "+12%",
                  label: "比上周",
                }}
              />
            </MDBox>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <MDBox mb={1.5}>
              <ComplexStatisticsCard
                color="success"
                icon={<AddShoppingCartOutlined style={{ fontSize: 26 }} />}
                title="创建订单"
                count="15"
                percentage={{
                  color: "success",
                  amount: "+5%",
                  label: "比上月",
                }}
              />
            </MDBox>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <MDBox mb={1.5}>
              <ComplexStatisticsCard
                color="warning"
                icon={<PendingOutlined style={{ fontSize: 26 }} />}
                title="待处理"
                count="18"
                percentage={{
                  color: "error",
                  amount: "+8%",
                  label: "比昨天",
                }}
              />
            </MDBox>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <MDBox mb={1.5}>
              <ComplexStatisticsCard
                color="secondary"
                icon={<InventoryOutlined style={{ fontSize: 26 }} />}
                title="库存"
                count="1,254"
                percentage={{
                  color: "success",
                  amount: "+3%",
                  label: "比上月",
                }}
              />
            </MDBox>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <MDBox mb={1.5}>
              <ComplexStatisticsCard
                color="error"
                icon={<PeopleOutlined style={{ fontSize: 26 }} />}
                title="员工"
                count="32"
                percentage={{
                  color: "success",
                  amount: "",
                  label: "刚刚更新",
                }}
              />
            </MDBox>
          </Grid>
        </Grid>

        {/* 图表区域 */}
        <MDBox mt={4.5}>
          <Grid container spacing={3} mb={4}>
            <Grid item xs={12} md={4}>
              <ChartMock 
                color="#1976d2" 
                title="总销售额" 
                data={mockSalesData} 
                description="本月销售额增长 +15%" 
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <ChartMock 
                color="#2e7d32" 
                title="不锈钢期货价格波动" 
                data={mockStainlessSteelData} 
                description="过去30天价格波动" 
                realTimePrice="15,320" 
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <ChartMock 
                color="#d32f2f" 
                title="碳钢价格波动" 
                data={mockCarbonSteelData} 
                description="过去30天价格波动" 
                realTimePrice="9,840" 
              />
            </Grid>
          </Grid>
        </MDBox>

        {/* 订单区域 */}
        <MDBox>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <OrderList 
                title="排队订单" 
                orders={queueOrders} 
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <OrderList 
                title="未完成订单" 
                orders={uncompletedOrders} 
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <OrderList 
                title="未付款订单" 
                orders={unpaidOrders} 
                totalAmount="16,400" 
              />
            </Grid>
          </Grid>
        </MDBox>
      </Box>
    </Box>
  );
}
