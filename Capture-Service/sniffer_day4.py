from scapy.all import sniff, IP, TCP, UDP, ICMP
from datetime import datetime, timezone
import json
import redis

redis_client = redis.Redis(host="localhost", port=6379, decode_responses=True)
CHANNEL_NAME = "packets"


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
    if not packet.haslayer(IP):
        return

    metadata = build_packet_metadata(packet)
    json_payload = json.dumps(metadata)
    redis_client.publish(CHANNEL_NAME, json_payload)
    print(f"Published: {json_payload}")


if __name__ == "__main__":
    print(f"Day 4 sniffer starting, publishing to Redis channel '{CHANNEL_NAME}'... Press Ctrl+C to stop.\n")
    sniff(prn=process_packet, store=False)