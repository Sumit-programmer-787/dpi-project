from scapy.all import sniff, IP, TCP, UDP, ICMP
from datetime import datetime, timezone


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
    print(metadata)


if __name__ == "__main__":
    print("Day 3 sniffer starting... Press Ctrl+C to stop.\n")
    sniff(prn=process_packet, store=False)