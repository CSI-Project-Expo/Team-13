import { useState, useEffect, useRef } from "react";

export default function Stopwatch({ startTime, isRunning = true, onTimeUpdate }) {
  const [elapsedTime, setElapsedTime] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!startTime) {
      setElapsedTime(0);
      return;
    }

    // Calculate initial elapsed time
    const start = new Date(startTime).getTime();
    const now = Date.now();
    const initial = Math.floor((now - start) / 1000);
    setElapsedTime(initial);

    if (isRunning) {
      // Update every second
      intervalRef.current = setInterval(() => {
        const currentTime = Date.now();
        const elapsed = Math.floor((currentTime - start) / 1000);
        setElapsedTime(elapsed);
        
        if (onTimeUpdate) {
          onTimeUpdate(elapsed);
        }
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [startTime, isRunning, onTimeUpdate]);

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  if (!startTime) return null;

  return (
    <div className="stopwatch">
      <div className="stopwatch__display">
        <span className="stopwatch__icon">⏱️</span>
        <span className="stopwatch__time">{formatTime(elapsedTime)}</span>
      </div>
      {isRunning && <div className="stopwatch__pulse" />}
    </div>
  );
}
