import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')


class TestAuth:
    """Test authentication flow"""

    def test_login_promotor_success(self, api_client):
        """Promotor can login with valid credentials"""
        resp = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@fenitel.es",
            "password": "FenitelAdmin2025!"
        })
        assert resp.status_code == 200
        data = resp.json()
        assert "token" in data
        assert "user" in data
        assert data["user"]["role"] == "promotor"
        assert data["user"]["email"] == "admin@fenitel.es"

    def test_login_member_success(self, api_client):
        """Member can login with valid credentials"""
        resp = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": "empresa@demo.com",
            "password": "Demo123456!"
        })
        assert resp.status_code == 200
        data = resp.json()
        assert "token" in data
        assert data["user"]["role"] == "miembro"

    def test_login_invalid_credentials(self, api_client):
        """Login fails with wrong password"""
        resp = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@fenitel.es",
            "password": "WrongPassword!"
        })
        assert resp.status_code == 401

    def test_register_new_member(self, api_client):
        """New member can register"""
        ts = str(uuid.uuid4())[:8]
        resp = api_client.post(f"{BASE_URL}/api/auth/register", json={
            "name": f"TEST_Empresa {ts}",
            "email": f"test_{ts}@test.com",
            "organization": f"TEST_Org {ts}",
            "nif": f"B{ts[:8]}",
            "phone": "+34 600 000 000",
            "address": "Test Address",
            "password": "TestPass123!"
        })
        assert resp.status_code == 200
        data = resp.json()
        assert data["role"] == "miembro"
        assert data["incorporation_status"] == "pending_contract"
        assert data["contract_signed"] == False

    def test_register_duplicate_email(self, api_client):
        """Registration fails with duplicate email"""
        resp = api_client.post(f"{BASE_URL}/api/auth/register", json={
            "name": "Test User",
            "email": "empresa@demo.com",
            "organization": "Test Org",
            "nif": "Z99999999",
            "password": "TestPass123!"
        })
        assert resp.status_code == 400

    def test_get_me_promotor(self, promotor_client):
        """Get current user info as promotor"""
        resp = promotor_client.get(f"{BASE_URL}/api/auth/me")
        assert resp.status_code == 200
        data = resp.json()
        assert data["role"] == "promotor"
        assert data["email"] == "admin@fenitel.es"

    def test_get_me_member(self, member_client):
        """Get current user info as member"""
        resp = member_client.get(f"{BASE_URL}/api/auth/me")
        assert resp.status_code == 200
        data = resp.json()
        assert data["role"] == "miembro"

    def test_unauthorized_access(self, api_client):
        """Accessing protected endpoint without token fails"""
        resp = api_client.get(f"{BASE_URL}/api/auth/me")
        assert resp.status_code == 403
