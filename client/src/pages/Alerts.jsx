import { useState, useEffect } from 'react';
import axios from 'axios';
import socket from '../socket';

function Alerts() {
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    // On first load, fetch existing alerts from the API built on Day 10,
    // so the page shows real history immediately, not just an empty
    // list waiting for something new to happen. Socket.IO only delivers
    // events that occur AFTER a browser connects -- it has no memory of
    // anything that happened before that, which is exactly why this
    // separate fetch is still needed even with live updates in place.
    axios.get('http://localhost:5001/api/alerts')
      .then((response) => {
        setAlerts(response.data);
      })
      .catch((error) => {
        console.error('Failed to load alerts:', error.message);
      });

    function onNewAlert(alert) {
      // New live alerts are added to the front of the list, same
      // pattern as packets on the Dashboard. No slice() limit here,
      // since alerts are naturally much less frequent than packets and
      // won't grow the list unreasonably large during a normal session.
      setAlerts((previousAlerts) => [alert, ...previousAlerts]);
    }

    socket.on('new_alert', onNewAlert);

    return () => {
      socket.off('new_alert', onNewAlert);
    };
  }, []);

  return (
    <div>
      <h1>Alerts</h1>
      <div className="grid" style={{ gridTemplateColumns: '1fr', padding: '0 24px 24px' }}>
        <div className="panel">
          <p className="panel-title">Detected Threats</p>

          {alerts.length === 0 && (
            <p className="empty-state">No alerts detected yet.</p>
          )}

          {alerts.map((alert) => (
            <div key={alert._id} className={`alert-card ${alert.severity}`}>
              <span className={`severity-badge ${alert.severity}`}>
                {alert.severity}
              </span>
              <div className="alert-body">
                <p className="alert-message">{alert.message}</p>
                <span className="alert-meta">
                  {alert.type} · {new Date(alert.timestamp).toLocaleString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Alerts;