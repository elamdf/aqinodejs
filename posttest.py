import time
import random
import requests
# host = "https://aqclub-service-tazpkivgxq-uw.a.run.app/in"
host = "http://127.0.0.1/in"
rhost = "http://127.0.0.1/api/register"
lhost = "http://127.0.0.1/api/login"
shost = "http://127.0.0.1/api/regsens"

name = "elam1"
passwd = "bruh123"
sensname = "test1"

def register():
    print(requests.post(rhost, data={"username":name, "password":passwd}).text)
def login():
    print(requests.post(lhost, data={"username":name, "password":passwd}).text)
def newsens():
    print(requests.post(shost, data={"sensorname":sensname, "username": name, "password":passwd}).text)


def send_data():
        print(requests.post(host, data={"sensorname":sensname, "username":name, "password":passwd, "temp":random.randint(24,35), "humidity":random.randint(30,80), "pressure":random.randint(950,1150), "altitude":random.randint(95, 115), "NO2":random.randint(1,10), "CO2":random.randint(1,10), "NH3":random.randint(1,10), "CO":random.randint(1,10)}).text)
