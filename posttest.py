import time
import random
import requests
# host = "https://aqclub-service-tazpkivgxq-uw.a.run.app/in"
host = "http://127.0.0.1/in"

while True:
    print(requests.post(host, data={'id':1, "name":"ElamHouse", "temp":random.randint(24,35), "humidity":random.randint(30,80), "pressure":random.randint(950,1150), "altitude":random.randint(95, 115)}))
    print(requests.post(host, data={'id':2, "name":"DavidHouse", "temp":random.randint(24,35), "humidity":random.randint(30,80), "pressure":random.randint(950,1150), "altitude":random.randint(95, 115)}))
    print(requests.post(host, data={'id':3, "name":"AHS", "temp":random.randint(24,35), "humidity":random.randint(30,80), "pressure":random.randint(950,1150), "altitude":random.randint(95, 115)}))
    time.sleep(5)
