import React from "react";
import { Box } from "@mui/material";

// 辅助函数，用于获取背景颜色
const getBgColor = (bgColor, variant) => {
  if (!bgColor) return undefined;
  if (variant === "gradient") {
    const gradientColors = {
      primary: "linear-gradient(195deg, #49a3f1, #1A73E8)",
      secondary: "linear-gradient(195deg, #EF6C00, #ab47bc)",
      info: "linear-gradient(195deg, #49a3f1, #1A73E8)",
      success: "linear-gradient(195deg, #66BB6A, #43A047)",
      warning: "linear-gradient(195deg, #FFA726, #FB8C00)",
      error: "linear-gradient(195deg, #EF5350, #E53935)",
      dark: "linear-gradient(195deg, #42424a, #191919)"
    };
    return gradientColors[bgColor] || bgColor;
  }
  // 普通颜色
  const colors = {
    primary: "#1976d2",
    secondary: "#9c27b0",
    info: "#0288d1",
    success: "#2e7d32",
    warning: "#ed6c02",
    error: "#d32f2f",
    dark: "#344767",
    light: "#f8f9fa",
  };
  return colors[bgColor] || bgColor;
};

// 获取文字颜色
const getColor = (color, bgColor) => {
  if (color === "inherit") return "inherit";
  if (color === "white") return "#fff";
  if (color === "dark") return "#344767";
  if (color === "text") return "#7b809a";
  if (bgColor && !color) {
    return bgColor === "light" ? "#344767" : "#fff";
  }
  return undefined;
};

// 获取彩色阴影
const getColoredShadow = (coloredShadow) => {
  if (!coloredShadow) return undefined;
  const shadows = {
    primary: "0 4px 20px 0 rgba(0,0,0,0.14), 0 7px 10px -5px rgba(25,118,210,0.4)",
    secondary: "0 4px 20px 0 rgba(0,0,0,0.14), 0 7px 10px -5px rgba(156,39,176,0.4)",
    info: "0 4px 20px 0 rgba(0,0,0,0.14), 0 7px 10px -5px rgba(2,136,209,0.4)",
    success: "0 4px 20px 0 rgba(0,0,0,0.14), 0 7px 10px -5px rgba(46,125,50,0.4)",
    warning: "0 4px 20px 0 rgba(0,0,0,0.14), 0 7px 10px -5px rgba(237,108,2,0.4)",
    error: "0 4px 20px 0 rgba(0,0,0,0.14), 0 7px 10px -5px rgba(211,47,47,0.4)",
    dark: "0 4px 20px 0 rgba(0,0,0,0.14), 0 7px 10px -5px rgba(52,71,103,0.4)",
    light: "0 4px 20px 0 rgba(0,0,0,0.14), 0 7px 10px -5px rgba(248,249,250,0.4)",
  };
  return shadows[coloredShadow] || undefined;
};

// 获取边框圆角
const getBorderRadius = (borderRadius) => {
  if (!borderRadius) return undefined;
  const values = {
    xs: "2px",
    sm: "4px",
    md: "8px",
    lg: "12px",
    xl: "16px",
    xxl: "24px",
  };
  return values[borderRadius] || borderRadius;
};

// MDBox 组件 - 模拟Material Dashboard的MDBox
const MDBox = ({ children, mb, mt, py, px, pt, pb, bgColor, variant, color, coloredShadow, borderRadius, display, justifyContent, alignItems, height, width, textAlign, lineHeight, ...rest }) => {
  const boxStyles = {
    marginBottom: mb ? `${mb * 8}px` : undefined,
    marginTop: mt ? `${mt * 8}px` : undefined,
    padding: py ? `${py * 8}px 0` : undefined,
    paddingTop: pt ? `${pt * 8}px` : undefined,
    paddingBottom: pb ? `${pb * 8}px` : undefined,
    paddingLeft: px ? `${px * 8}px` : undefined,
    paddingRight: px ? `${px * 8}px` : undefined,
    backgroundColor: getBgColor(bgColor, variant),
    color: getColor(color, bgColor),
    boxShadow: getColoredShadow(coloredShadow),
    borderRadius: getBorderRadius(borderRadius),
    display: display || undefined,
    justifyContent: justifyContent || undefined,
    alignItems: alignItems || undefined,
    height: height || undefined,
    width: width || undefined,
    textAlign: textAlign || undefined,
    lineHeight: lineHeight || undefined,
    ...rest.sx
  };

  return <Box sx={boxStyles} {...rest}>{children}</Box>;
};

export default MDBox; 