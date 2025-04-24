import React, { useState, useEffect, useContext } from "react";
import { 
  Box, 
  Grid, 
  Icon,
  CircularProgress
} from "@mui/material";
import { 
  InventoryOutlined, 
  ShoppingCartOutlined, 
  AddShoppingCartOutlined, 
  PendingOutlined, 
  PeopleOutlined,
  PersonOutlined
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

// 导入重构后的组件
import MDBox from "../component/MD/Box";
import MDTypography from "../component/MD/Typography";
import ComplexStatisticsCard from "../component/Cards/StatisticsCards";
import OrderList from "../component/Cards/OrderCards";
import SalesChart from "../component/Cards/SalesChart";
import MaterialPriceChart from "../component/Cards/MaterialPriceChart";
import InventoryPieChart from "../component/inventoryChart";

// Import the statistics API
import { getDashboardStats } from "../api/statsApi";
import { fetchQuoteOrders, fetchIncompleteOrders, fetchUnpaidOrders } from "../api/orderApi";

// Import auth context
import { AuthContext } from "../contexts/authContext";

export default function Home() {
  const navigate = useNavigate();
  const { role, hasPermission } = useContext(AuthContext);
  const isEmployee = role === 'employee';
  
  // State for statistics data
  const [stats, setStats] = useState({
    orders: { total: 0, previousMonth: 0 },
    inventory: { total: 0, newItems: 0 },
    customers: { total: 0, newCustomers: 0 },
    employees: { total: 0, newEmployees: 0 }
  });
  
  // 订单数据状态
  const [quoteOrders, setQuoteOrders] = useState([]);
  const [incompleteOrders, setIncompleteOrders] = useState([]);
  const [unpaidOrders, setUnpaidOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState({
    quotes: true,
    incomplete: true,
    unpaid: true
  });
  
  // 计算未付款订单总金额
  const calculateUnpaidTotal = () => {
    return unpaidOrders.reduce((sum, order) => {
      const amount = order.total_price ? parseFloat(order.total_price) : 0;
      return sum + amount;
    }, 0).toFixed(2);
  };
  
  // Loading state
  const [loading, setLoading] = useState(true);
  // Error state
  const [error, setError] = useState(null);

  // 导航处理函数
  const handleNavigate = (path) => {
    navigate(path);
  };

  // 刷新订单数据
  const fetchOrdersData = async () => {
    try {
      // 获取报价订单
      setOrdersLoading(prev => ({ ...prev, quotes: true }));
      const quotesResponse = await fetchQuoteOrders();
      if (quotesResponse.success) {
        setQuoteOrders(quotesResponse.orders || []);
      }
      
      // 获取未完成订单
      setOrdersLoading(prev => ({ ...prev, incomplete: true }));
      const incompleteResponse = await fetchIncompleteOrders();
      if (incompleteResponse.success) {
        setIncompleteOrders(incompleteResponse.orders || []);
      }
      
      // 获取未付款订单
      setOrdersLoading(prev => ({ ...prev, unpaid: true }));
      const unpaidResponse = await fetchUnpaidOrders();
      if (unpaidResponse.success) {
        setUnpaidOrders(unpaidResponse.orders || []);
      }
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    } finally {
      setOrdersLoading({
        quotes: false,
        incomplete: false,
        unpaid: false
      });
    }
  };

  // Fetch statistics on component mount
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await getDashboardStats();
        if (response.success) {
          setStats(response.data);
        } else {
          setError(response.msg || 'Failed to load dashboard data');
        }
      } catch (error) {
        console.error("Failed to fetch statistics:", error);
        setError('An error occurred while fetching dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    fetchOrdersData(); // 加载订单数据
  }, []);
  
  // 处理订单更新后刷新数据
  const handleOrderUpdated = () => {
    fetchOrdersData();
  };

  return (
    <Box sx={{ flexGrow: 1, bgcolor: "#f5f5f5", minHeight: "100vh" }}>
      <Box sx={{ p: 3 }}>
        {/* 功能卡片区域 */}
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
            <CircularProgress />
          </Box>
        ) : error ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
            <MDTypography variant="body1" color="error">{error}</MDTypography>
          </Box>
        ) : (
          <Grid container spacing={3}>
            <Grid item xs={12} sm={isEmployee ? 4 : 6} md={isEmployee ? 4 : 3}>
              <MDBox mb={1.5}>
                <ComplexStatisticsCard
                  color="primary"
                  icon={<ShoppingCartOutlined style={{ fontSize: 26 }} />}
                  title="Orders"
                  count={stats.orders.total.toString()}
                  percentage={{
                    color: "success",
                    amount: "",
                    label: `Last month: ${stats.orders.previousMonth}`,
                  }}
                  onClick={() => handleNavigate('/orders')}
                />
              </MDBox>
            </Grid>
            <Grid item xs={12} sm={isEmployee ? 4 : 6} md={isEmployee ? 4 : 3}>
              <MDBox mb={1.5}>
                <ComplexStatisticsCard
                  color="success"
                  icon={<InventoryOutlined style={{ fontSize: 26 }} />}
                  title="Inventory"
                  count={stats.inventory.total.toString()}
                  percentage={{
                    color: "success",
                    amount: "",
                    label: `New this month: ${stats.inventory.newItems}`,
                  }}
                  onClick={() => handleNavigate('/inventory')}
                />
              </MDBox>
            </Grid>
            <Grid item xs={12} sm={isEmployee ? 4 : 6} md={isEmployee ? 4 : 3}>
              <MDBox mb={1.5}>
                <ComplexStatisticsCard
                  color="info"
                  icon={<PersonOutlined style={{ fontSize: 26 }} />}
                  title="Customers"
                  count={stats.customers.total.toString()}
                  percentage={{
                    color: "success",
                    amount: "",
                    label: `New this month: ${stats.customers.newCustomers}`,
                  }}
                  onClick={() => handleNavigate('/customer')}
                />
              </MDBox>
            </Grid>
            {/* Employee卡片 - 仅对管理员和非employee角色显示 */}
            {!isEmployee && (
              <Grid item xs={12} sm={6} md={3}>
                <MDBox mb={1.5}>
                  <ComplexStatisticsCard
                    color="error"
                    icon={<PeopleOutlined style={{ fontSize: 26 }} />}
                    title="Employees"
                    count={stats.employees.total.toString()}
                    percentage={{
                      color: "success",
                      amount: "",
                      label: `New this month: ${stats.employees.newEmployees}`,
                    }}
                    onClick={() => handleNavigate('/employee')}
                  />
                </MDBox>
              </Grid>
            )}
          </Grid>
        )}

        {/* 库存饼图区域 */}
        <MDBox mt={3}>
          <Grid container spacing={3} mb={4}>
            <Grid item xs={12} md={6}>
              <InventoryPieChart 
                material="201" 
                title="201 Stainless Steel Inventory" 
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <InventoryPieChart 
                material="304" 
                title="304 Stainless Steel Inventory" 
              />
            </Grid>
          </Grid>
        </MDBox>

        {/* 图表区域 - 仅对管理员和非employee角色显示 */}
        {!isEmployee && (
          <MDBox mt={3}>
            <Grid container spacing={3} mb={4}>
              <Grid item xs={12} md={4}>
                <SalesChart />
              </Grid>
              <Grid item xs={12} md={4}>
                <MaterialPriceChart 
                  materialType="stainless_steel"
                  title="Stainless Steel Price"
                  color="#2e7d32"
                  backgroundColor="#4caf50"
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <MaterialPriceChart 
                  materialType="hot_rolled_coil"
                  title="Hot Rolled Coil Price"
                  color="#d32f2f"
                  backgroundColor="#ffc107"
                />
              </Grid>
            </Grid>
          </MDBox>
        )}

        {/* 订单区域 */}
        <MDBox>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <OrderList 
                title="Quote Orders" 
                orders={quoteOrders}
                type="quote"
                totalCount={quoteOrders.length}
                isLoading={ordersLoading.quotes}
                onOrderUpdated={handleOrderUpdated}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <OrderList 
                title="Incomplete Orders" 
                orders={incompleteOrders}
                type="incomplete"
                totalCount={incompleteOrders.length}
                isLoading={ordersLoading.incomplete}
                onOrderUpdated={handleOrderUpdated}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <OrderList 
                title="Unpaid Orders" 
                orders={unpaidOrders}
                type="unpaid"
                totalAmount={calculateUnpaidTotal()}
                totalCount={unpaidOrders.length}
                isLoading={ordersLoading.unpaid}
                onOrderUpdated={handleOrderUpdated}
              />
            </Grid>
          </Grid>
        </MDBox>
      </Box>
    </Box>
  );
}
