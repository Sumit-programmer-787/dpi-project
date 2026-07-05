from scapy.all import sniff, IP, TCP, UDP


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
    else:
        return "OTHER"


def process_packet(packet):
    if not packet.haslayer(IP):
        return

    protocol = identify_protocol(packet)
    src_ip = packet[IP].src
    dst_ip = packet[IP].dst
    size = len(packet)

    print(f"[{protocol}] {src_ip} -> {dst_ip} | {size} bytes")


if __name__ == "__main__":
    print("Starting packet capture... Press Ctrl+C to stop.\n")
    sniff(prn=process_packet, store=False)