# day2 (updated / more developed version of day1):
from scapy.all import sniff, IP, TCP, UDP, ICMP
 
 
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
 
 
def extract_tcp_flags(packet):
    if packet.haslayer(TCP):
        return str(packet[TCP].flags)
    return None
 
 
def process_packet(packet):
    if not packet.haslayer(IP):
        return
 
    protocol = identify_protocol(packet)
    src_ip = packet[IP].src
    dst_ip = packet[IP].dst
    size = len(packet)
    ttl = packet[IP].ttl
    flags = extract_tcp_flags(packet)
 
    print(f"[{protocol}] {src_ip} -> {dst_ip} | {size}B | TTL={ttl}"
          + (f" | flags={flags}" if flags else ""))
    print(f"    scapy sees: {packet.summary()}")
 
 
if __name__ == "__main__":
    print("Day 2 sniffer starting... Press Ctrl+C to stop.\n")
    sniff(prn=process_packet, store=False)