import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

const PROTOCOL_COLORS = {
  HTTPS: '#4fd1c5',
  HTTP: '#7fe0d6',
  TCP: '#f0b429',
  UDP: '#f4d160',
  ICMP: '#7c8aa3',
  OTHER: '#3a4a68',
};

function ProtocolChart({ packets }) {
  const counts = packets.reduce((acc, packet) => {
    acc[packet.protocol] = (acc[packet.protocol] || 0) + 1;
    return acc;
  }, {});

  const labels = Object.keys(counts);
  const values = Object.values(counts);
  const colors = labels.map((label) => PROTOCOL_COLORS[label] || PROTOCOL_COLORS.OTHER);

  const data = {
    labels,
    datasets: [
      {
        data: values,
        backgroundColor: colors,
        borderColor: '#121b2e',
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    cutout: '70%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#7c8aa3',
          font: { family: 'IBM Plex Mono', size: 11 },
          boxWidth: 10,
        },
      },
    },
  };

  if (labels.length === 0) {
    return <p style={{ color: '#7c8aa3', fontSize: 13 }}>Waiting for traffic...</p>;
  }

  return <Doughnut data={data} options={options} />;
}

export default ProtocolChart;