import { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
} from 'chart.js';

ChartJS.register(LineElement, PointElement, CategoryScale, LinearScale, Tooltip);

const WINDOW_SECONDS = 30;

function TrafficChart({ latestPacket }) {
  const [history, setHistory] = useState(
    Array.from({ length: WINDOW_SECONDS }, () => 0),
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setHistory((prev) => [...prev.slice(1), 0]);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!latestPacket) return;

    setHistory((prev) => {
      const updated = [...prev];
      updated[updated.length - 1] += 1;
      return updated;
    });
  }, [latestPacket]);

  const data = {
    labels: history.map((_, i) => `${WINDOW_SECONDS - i}s`),
    datasets: [
      {
        data: history,
        borderColor: '#4fd1c5',
        backgroundColor: 'rgba(79, 209, 197, 0.08)',
        fill: true,
        tension: 0.3,
        pointRadius: 0,
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    animation: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      x: {
        grid: { color: '#1f2b42' },
        ticks: { color: '#7c8aa3', font: { family: 'IBM Plex Mono', size: 10 }, maxTicksLimit: 6 },
      },
      y: {
        grid: { color: '#1f2b42' },
        ticks: { color: '#7c8aa3', font: { family: 'IBM Plex Mono', size: 10 } },
        beginAtZero: true,
      },
    },
  };

  return <Line data={data} options={options} />;
}

export default TrafficChart;