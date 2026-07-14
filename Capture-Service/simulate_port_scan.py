import redis
import json
import time
from datetime import datetime, timezone

redis_client = redis.Redis(host="localhost", port=6379, decode_responses=True)
CHANNEL_NAME = "packets"

fake_src_ip = "10.0.0.99"

print("Simulating a port scan... publishing 12 fake SYN packets.\n")

for port in range(1, 13):
    fake_packet = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "protocol": "TCP",
        "src_ip": fake_src_ip,
        "dst_ip": "192.168.1.50",
        "size": 60,
        "ttl": 64,
        "src_port": 50000 + port,
        "dst_port": port,
        "flags": "S",
    }
    redis_client.publish(CHANNEL_NAME, json.dumps(fake_packet))
    print(f"Sent fake SYN to port {port}")
    time.sleep(0.3)

print("\nDone. Check the Node server terminal for an ALERT message.")