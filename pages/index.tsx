"use client";
import { useEffect, useState } from "react";

export default function Home() {
  const [signal, setSignal] = useState<any>(null);
  const [countdown, setCountdown] = useState(60);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((c) => (c > 0 ? c - 1 : 60));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchSignal = async () => {
      const res = await fetch("/api/latest-signal");
      const data = await res.json();
      setSignal(data);
    };
    fetchSignal();
    const interval = setInterval(fetchSignal, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <main style={{ textAlign: "center", fontFamily: "sans-serif", padding: 30 }}>
      <h1 style={{ fontSize: 32 }}>📡 MinuteEdgeFX</h1>
      <p>Live 1-minute Binary Option Signals</p>
      <div style={{ marginTop: 30 }}>
        {signal ? (
          <>
            <h2 style={{ color: signal.direction === "CALL" ? "green" : "red", fontSize: 28 }}>
              {signal.direction} — {signal.confidence}% ({signal.type})
            </h2>
            <p>Pair: {signal.pair}</p>
            <p>Time: {new Date(signal.timestamp).toLocaleTimeString()}</p>
            <p>Close: {signal.close_price}</p>
          </>
        ) : (
          <p>Loading latest signal...</p>
        )}
        <p style={{ marginTop: 20 }}>Next signal in: {countdown}s</p>
      </div>
    </main>
  );
}
