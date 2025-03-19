import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";

interface ComplianceGaugeProps {
  score: number;
}

export default function ComplianceGauge({ score }: ComplianceGaugeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [displayScore, setDisplayScore] = useState(0);
  
  // Animate the score counter
  useEffect(() => {
    const interval = setInterval(() => {
      setDisplayScore((prev) => {
        if (prev < score) {
          return Math.min(prev + 1, score);
        }
        clearInterval(interval);
        return prev;
      });
    }, 20);
    
    return () => clearInterval(interval);
  }, [score]);
  
  // Draw the gauge on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    // Set canvas dimensions for high DPI displays
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    
    // Clear canvas
    ctx.clearRect(0, 0, rect.width, rect.height);
    
    // Calculate dimensions
    const centerX = rect.width / 2;
    const centerY = rect.height - 30;
    const radius = Math.min(centerX, centerY) - 10;
    
    // Draw background arc (grey)
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, Math.PI, 0, false);
    ctx.lineWidth = 20;
    ctx.strokeStyle = "#e5e7eb"; // Light grey
    ctx.stroke();
    
    // Calculate score color
    let scoreColor;
    if (displayScore >= 90) {
      scoreColor = "#10b981"; // Green
    } else if (displayScore >= 70) {
      scoreColor = "#f59e0b"; // Amber
    } else {
      scoreColor = "#ef4444"; // Red
    }
    
    // Draw score arc
    const scoreAngle = Math.PI - (displayScore / 100) * Math.PI;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, Math.PI, scoreAngle, true);
    ctx.lineWidth = 20;
    ctx.strokeStyle = scoreColor;
    ctx.stroke();
    
    // Draw ticks for 0%, 25%, 50%, 75%, 100%
    const tickLength = 10;
    const tickWidth = 2;
    const tickPositions = [0, 25, 50, 75, 100];
    
    tickPositions.forEach(pos => {
      const angle = Math.PI - (pos / 100) * Math.PI;
      const innerX = centerX + (radius - 10) * Math.cos(angle);
      const innerY = centerY + (radius - 10) * Math.sin(angle);
      const outerX = centerX + (radius + tickLength) * Math.cos(angle);
      const outerY = centerY + (radius + tickLength) * Math.sin(angle);
      
      ctx.beginPath();
      ctx.moveTo(innerX, innerY);
      ctx.lineTo(outerX, outerY);
      ctx.lineWidth = tickWidth;
      ctx.strokeStyle = "#9ca3af"; // Grey
      ctx.stroke();
      
      // Add labels
      ctx.font = "12px system-ui, sans-serif";
      ctx.fillStyle = "#6b7280"; // Text color
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      
      const labelX = centerX + (radius + tickLength + 15) * Math.cos(angle);
      const labelY = centerY + (radius + tickLength + 15) * Math.sin(angle);
      
      ctx.fillText(`${pos}%`, labelX, labelY);
    });
    
    // Draw score text in center
    ctx.font = "bold 28px system-ui, sans-serif";
    ctx.fillStyle = scoreColor;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`${displayScore}%`, centerX, centerY - radius / 2);
    
    // Draw "Compliance Score" text
    ctx.font = "14px system-ui, sans-serif";
    ctx.fillStyle = "#6b7280"; // Text color
    ctx.fillText("Compliance Score", centerX, centerY - radius / 2 + 30);
    
    // Draw rating text
    let ratingText;
    if (displayScore >= 90) {
      ratingText = "Excellent";
    } else if (displayScore >= 80) {
      ratingText = "Good";
    } else if (displayScore >= 70) {
      ratingText = "Fair";
    } else if (displayScore >= 50) {
      ratingText = "Poor";
    } else {
      ratingText = "Critical";
    }
    
    ctx.font = "bold 16px system-ui, sans-serif";
    ctx.fillStyle = scoreColor;
    ctx.fillText(ratingText, centerX, centerY - radius / 2 + 55);
  }, [displayScore]);
  
  return (
    <div className="relative w-full max-w-[300px] aspect-square">
      <canvas 
        ref={canvasRef} 
        className="w-full h-full"
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
}