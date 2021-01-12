import time
import random
import requests

for i in range(20):
    print(requests.post("http://127.0.0.1:3257/in", data={'id':1, "temp":random.randint(24,35), "humidity":random.randint(30,80), "pressure":random.randint(950,1150), "altitude":random.randint(95, 115)}))
    print(requests.post("http://127.0.0.1:3257/in", data={'id':2, "temp":random.randint(24,35), "humidity":random.randint(30,80), "pressure":random.randint(950,1150), "altitude":random.randint(95, 115)}))
    print(requests.post("http://127.0.0.1:3257/in", data={'id':3, "temp":random.randint(24,35), "humidity":random.randint(30,80), "pressure":random.randint(950,1150), "altitude":random.randint(95, 115)}))
    time.sleep(1)
