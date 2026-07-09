from scapy.all import sniff, IP, TCP, UDP, ICMP
from datetime import datetime, timezone
import json
import redis
import sys

redis_client = redis.Redis(host="localhost", port=6379, decode_responses=True)
CHANNEL_NAME = "packets"

packet_count = 0


def check_redis_connection():
    try:
        redis_client.ping()
        print("Connected to Redis successfully.\n")
    except redis.exceptions.ConnectionError:
        print("ERROR: Could not connect to Redis on localhost:6379.")
        print("Make sure Memurai is running, then try again.")
        sys.exit(1)


def identify_protocol(packet):
    if packet.haslayer(TCP):
        tcp_layer = packet[TCP]
        if tcp_layer.dport == 80 or tcp_layer.sport == 80:
            return "HTTP"
        elif tcp_layer.dport == 443 or tcp_layer.sport == 443:
            return "HTTPS"
        else:
            return "TCP"
    elif packet.haslayer(UDP):
        return "UDP"
    elif packet.haslayer(ICMP):
        return "ICMP"
    else:
        return "OTHER"


def build_packet_metadata(packet):
    protocol = identify_protocol(packet)

    metadata = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "protocol": protocol,
        "src_ip": packet[IP].src,
        "dst_ip": packet[IP].dst,
        "size": len(packet),
        "ttl": packet[IP].ttl,
        "src_port": packet[TCP].sport if packet.haslayer(TCP)
                    else packet[UDP].sport if packet.haslayer(UDP) else None,
        "dst_port": packet[TCP].dport if packet.haslayer(TCP)
                    else packet[UDP].dport if packet.haslayer(UDP) else None,
        "flags": str(packet[TCP].flags) if packet.haslayer(TCP) else None,
    }
    return metadata


def process_packet(packet):
    global packet_count

    if not packet.haslayer(IP):
        return

    try:
        metadata = build_packet_metadata(packet)
        json_payload = json.dumps(metadata)
        redis_client.publish(CHANNEL_NAME, json_payload)
        packet_count += 1
        print(f"Published: {json_payload}")
    except Exception as e:
        print(f"Error processing packet: {e}")


if __name__ == "__main__":
    check_redis_connection()

    print(f"Day 5 sniffer starting, publishing to Redis channel '{CHANNEL_NAME}'...")
    print("Filtering: TCP and UDP only. Press Ctrl+C to stop.\n")

    try:
        sniff(prn=process_packet, store=False, filter="tcp or udp")
    except KeyboardInterrupt:
        pass
    finally:
        print(f"\n\nShutting down. Total packets published this session: {packet_count}")
        sys.exit(0)