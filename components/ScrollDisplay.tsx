import React from "react";

interface ScrollDisplayProps {
  meters: number;
  timeSpent: number;
}

const ScrollDisplay: React.FC<ScrollDisplayProps> = ({ meters, timeSpent }) => {
  return (
    <div
      style={{
        position: "fixed",
        bottom: "10px",
        right: "10px",
        fontSize: "14px",
        padding: "5px",
        background: "rgba(0, 0, 0, 0.7)",
        color: "white",
        zIndex: 9999,
        borderRadius: "4px",
        fontFamily: "monospace",
      }}
    >
      T: {timeSpent.toFixed(0)}s | D: {meters.toFixed(2)}m
    </div>
  );
};

export default ScrollDisplay;
