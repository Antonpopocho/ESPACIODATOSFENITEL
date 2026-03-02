import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

@pytest.fixture
def api_client():
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session

@pytest.fixture
def promotor_token(api_client):
    response = api_client.post(f"{BASE_URL}/api/auth/login", json={
        "email": "admin@fenitel.es",
        "password": "FenitelAdmin2025!"
    })
    if response.status_code == 200:
        return response.json().get("token")
    pytest.skip(f"Promotor auth failed: {response.text}")

@pytest.fixture
def member_token(api_client):
    response = api_client.post(f"{BASE_URL}/api/auth/login", json={
        "email": "empresa@demo.com",
        "password": "Demo123456!"
    })
    if response.status_code == 200:
        return response.json().get("token")
    pytest.skip(f"Member auth failed: {response.text}")

@pytest.fixture
def promotor_client(api_client, promotor_token):
    api_client.headers.update({"Authorization": f"Bearer {promotor_token}"})
    return api_client

@pytest.fixture
def member_client(api_client, member_token):
    api_client.headers.update({"Authorization": f"Bearer {member_token}"})
    return api_client
