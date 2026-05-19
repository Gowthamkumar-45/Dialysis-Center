import requests

url = 'http://localhost:8000/api/patients/'
# Try to get one patient to see the structure
res = requests.get(url)
print("GET patients status:", res.status_code)
if res.status_code == 200 and res.json():
    patient = res.json()[0]
    patient_id = patient['id']
    print(f"Testing update on patient {patient_id}")
    # Try a minimal update
    update_url = f'{url}{patient_id}/'
    res = requests.patch(update_url, json={'full_name': patient['full_name']})
    print("PATCH status:", res.status_code)
    if res.status_code != 200:
        print("PATCH error:", res.text)
else:
    print("No patients found or error fetching patients")
