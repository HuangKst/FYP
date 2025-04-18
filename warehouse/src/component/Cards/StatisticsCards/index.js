import React from "react";
import { Box, Card, Typography, Divider, Icon } from "@mui/material";
import { ArrowUpward, ArrowDownward } from '@mui/icons-material';

// ComplexStatisticsCard 组件 - 模拟Material Dashboard的卡片
const ComplexStatisticsCard = ({ color, title, count, percentage, icon, onClick }) => {
  // 颜色映射
  const getColorShade = (colorName) => {
    switch(colorName) {
      case "primary": return "#1976d2";
      case "secondary": return "#9c27b0";
      case "info": return "#0288d1";
      case "success": return "#2e7d32";
      case "warning": return "#ed6c02";
      case "error": return "#d32f2f";
      case "dark": return "#344767";
      default: return colorName;
    }
  };

  return (
    <Card 
      sx={{ 
        height: '100%', 
        borderRadius: '16px', 
        overflow: 'visible',
        boxShadow: '0 5px 15px rgba(0,0,0,0.1)', 
        position: 'relative',
        pt: 2,
        backgroundColor: 'white',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': onClick ? {
          transform: 'translateY(-5px)',
          boxShadow: '0 8px 20px rgba(0,0,0,0.15)'
        } : {}
      }}
      onClick={onClick}
    >
      <Box
        sx={{ 
          backgroundColor: getColorShade(color), 
          width: 65, 
          height: 65, 
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
          position: 'absolute',
          top: -15,
          left: 20,
        }}
      >
        {React.isValidElement(icon) ? 
          React.cloneElement(icon, { 
            style: { color: 'white', fontSize: 30 } 
          }) : 
          <Icon style={{ color: 'white', fontSize: 30 }}>{icon}</Icon>
        }
      </Box>
      
      <Box sx={{ pl: 2, pr: 2, mt: 3 }}>
        <Box sx={{ textAlign: 'right', mb: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
            {title}
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
            {count}
          </Typography>
        </Box>
      </Box>
      
      <Divider sx={{ mx: 2 }} />
      
      <Box sx={{ p: 2, pt: 1.5, display: 'flex', alignItems: 'center' }}>
        {percentage.color === "success" ? (
          <ArrowUpward sx={{ color: "#4caf50", fontSize: "1rem", mr: 0.5 }} />
        ) : (
          <ArrowDownward sx={{ color: "#f44336", fontSize: "1rem", mr: 0.5 }} />
        )}
        <Typography 
          variant="body2" 
          fontWeight="bold" 
          sx={{ 
            color: percentage.color === "success" ? "#4caf50" : "#f44336",
            mr: 0.5 
          }}
        >
          {percentage.amount}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {percentage.label}
        </Typography>
      </Box>
    </Card>
  );
};

export default ComplexStatisticsCard;
