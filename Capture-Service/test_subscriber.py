import redis
import json

redis_client = redis.Redis(host="localhost", port=6379, decode_responses=True)

pubsub = redis_client.pubsub()
pubsub.subscribe("packets")

print("Listening on 'packets' channel... Press Ctrl+C to stop.\n")

for item in pubsub.listen():
    if item["type"] == "message":
        packet_data = json.loads(item["data"])
        print(packet_data)