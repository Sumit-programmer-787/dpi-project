import { useState, useEffect } from 'react';
import socket from '../socket';

function Dashboard() {
  const [packets, setPackets] = useState([]);
  const [isConnected, setIsConnected] = useState(socket.connected);

  useEffect(() => {
    function onConnect() {
      setIsConnected(true);
    }

    function onDisconnect() {
      setIsConnected(false);
    }

    function onNewPacket(packet) {
      setPackets((previousPackets) => [packet, ...previousPackets].slice(0, 20));
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('new_packet', onNewPacket);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('new_packet', onNewPacket);
    };
  }, []);

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Status: {isConnected ? 'Connected' : 'Disconnected'}</p>

      <table>
        <thead>
          <tr>
            <th>Time</th>
            <th>Protocol</th>
            <th>Source</th>
            <th>Destination</th>
            <th>Size</th>
          </tr>
        </thead>
        <tbody>
          {packets.map((packet) => (
            <tr key={packet._id}>
              <td>{new Date(packet.timestamp).toLocaleTimeString()}</td>
              <td>{packet.protocol}</td>
              <td>{packet.src_ip}:{packet.src_port ?? '-'}</td>
              <td>{packet.dst_ip}:{packet.dst_port ?? '-'}</td>
              <td>{packet.size}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Dashboard;