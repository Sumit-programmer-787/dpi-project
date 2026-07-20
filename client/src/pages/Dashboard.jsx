import { useState, useEffect } from 'react';
import socket from '../socket';
import ProtocolChart from '../components/ProtocolChart';
import TrafficChart from '../components/TrafficChart';

function Dashboard() {
  const [packets, setPackets] = useState([]);
  const [latestPacket, setLatestPacket] = useState(null);
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
      setLatestPacket(packet);
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
      <h1>Live Traffic Monitor</h1>
      <div className="status-line">
        <span className={`status-dot ${isConnected ? 'connected' : ''}`} />
        {isConnected ? 'Connected' : 'Disconnected'}
      </div>

      <div className="grid">
        <div className="panel">
          <p className="panel-title">Traffic / Last 30s</p>
          <TrafficChart latestPacket={latestPacket} />
        </div>

        <div className="panel">
          <p className="panel-title">Protocol Composition</p>
          <ProtocolChart packets={packets} />
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: '1fr' }}>
        <div className="panel">
          <p className="panel-title">Recent Packets</p>
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
                  <td><span className="protocol-tag">{packet.protocol}</span></td>
                  <td>{packet.src_ip}:{packet.src_port ?? '-'}</td>
                  <td>{packet.dst_ip}:{packet.dst_port ?? '-'}</td>
                  <td>{packet.size}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;