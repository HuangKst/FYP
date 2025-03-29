import React from "react";
import { Typography } from "@mui/material";

// MDTypography 组件 - 模拟Material Dashboard的MDTypography
const MDTypography = ({ 
  children, 
  color, 
  variant, 
  fontWeight, 
  textTransform, 
  fontSize,
  component,
  display,
  ...rest 
}) => {
  const typographyStyles = {
    color: color === "white" ? "#fff" : 
           color === "text" ? "#7b809a" : 
           color === "dark" ? "#344767" : 
           color === "success" ? "#4CAF50" :
           color === "error" ? "#F44335" :
           color === "info" ? "#1A73E8" :
           color === "warning" ? "#FB8C00" :
           color === "primary" ? "#1976d2" :
           color === "secondary" ? "#9c27b0" :
           undefined,
    fontWeight: fontWeight === "light" ? 300 :
               fontWeight === "regular" ? 400 :
               fontWeight === "medium" ? 500 :
               fontWeight === "bold" ? 700 :
               undefined,
    textTransform: textTransform || "none",
    fontSize: fontSize,
    display: display || undefined,
    ...rest.sx
  };

  return (
    <Typography 
      variant={variant} 
      component={component || "div"} 
      sx={typographyStyles} 
      {...rest}
    >
      {children}
    </Typography>
  );
};

export default MDTypography; 