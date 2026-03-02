import pytest
import requests
import os
import uuid
import io

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')


class TestMembers:
    """Test members management"""

    def test_list_members_as_promotor(self, promotor_client):
        """Promotor can list members"""
        resp = promotor_client.get(f"{BASE_URL}/api/members")
        assert resp.status_code == 200
        data = resp.json()
        assert isinstance(data, list)
        # Members should not include promotors
        for member in data:
            assert member["role"] != "promotor"

    def test_list_members_unauthorized_for_member(self, member_client):
        """Member cannot list all members"""
        resp = member_client.get(f"{BASE_URL}/api/members")
        assert resp.status_code == 403


class TestContracts:
    """Test contract signing flow"""

    def test_get_my_contract(self, member_client):
        """Member can get their contract"""
        resp = member_client.get(f"{BASE_URL}/api/contracts/my")
        assert resp.status_code == 200
        data = resp.json()
        assert "id" in data
        assert "status" in data
        assert "user_id" in data

    def test_sign_contract(self, api_client):
        """A fresh member can sign their contract"""
        ts = str(uuid.uuid4())[:8]
        # Register new user
        reg_resp = api_client.post(f"{BASE_URL}/api/auth/register", json={
            "name": f"TEST_Signer {ts}",
            "email": f"signer_{ts}@test.com",
            "organization": f"TEST_SignerOrg {ts}",
            "nif": f"C{ts[:8]}",
            "password": "TestPass123!"
        })
        assert reg_resp.status_code == 200

        # Login as new user
        login_resp = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": f"signer_{ts}@test.com",
            "password": "TestPass123!"
        })
        assert login_resp.status_code == 200
        token = login_resp.json()["token"]
        api_client.headers.update({"Authorization": f"Bearer {token}"})

        # Sign contract
        sign_resp = api_client.post(f"{BASE_URL}/api/contracts/sign")
        assert sign_resp.status_code == 200
        data = sign_resp.json()
        assert "signature_hash" in data

        # Verify contract is signed
        contract_resp = api_client.get(f"{BASE_URL}/api/contracts/my")
        assert contract_resp.status_code == 200
        assert contract_resp.json()["status"] == "signed"
        assert contract_resp.json()["signature_hash"] is not None

    def test_sign_contract_already_signed(self, api_client):
        """Signing an already signed contract returns error"""
        ts = str(uuid.uuid4())[:8]
        api_client.post(f"{BASE_URL}/api/auth/register", json={
            "name": f"TEST_DoubleSign {ts}",
            "email": f"doublesign_{ts}@test.com",
            "organization": f"TEST_Org {ts}",
            "nif": f"D{ts[:8]}",
            "password": "TestPass123!"
        })
        login_resp = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": f"doublesign_{ts}@test.com",
            "password": "TestPass123!"
        })
        token = login_resp.json()["token"]
        api_client.headers.update({"Authorization": f"Bearer {token}"})
        api_client.post(f"{BASE_URL}/api/contracts/sign")
        # Try signing again
        resp = api_client.post(f"{BASE_URL}/api/contracts/sign")
        assert resp.status_code == 400


class TestPayments:
    """Test payment management by promotor"""

    def test_list_payments_as_promotor(self, promotor_client):
        """Promotor can list all payments"""
        resp = promotor_client.get(f"{BASE_URL}/api/payments")
        assert resp.status_code == 200
        data = resp.json()
        assert isinstance(data, list)
        for p in data:
            assert "user_id" in p
            assert "status" in p

    def test_list_payments_forbidden_for_member(self, member_client):
        """Member cannot list payments"""
        resp = member_client.get(f"{BASE_URL}/api/payments")
        assert resp.status_code == 403

    def test_update_payment_status(self, promotor_client, api_client):
        """Promotor can update payment status"""
        ts = str(uuid.uuid4())[:8]
        api_client.post(f"{BASE_URL}/api/auth/register", json={
            "name": f"TEST_PayUser {ts}",
            "email": f"payuser_{ts}@test.com",
            "organization": f"TEST_Org {ts}",
            "nif": f"E{ts[:8]}",
            "password": "TestPass123!"
        })
        login_resp = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": f"payuser_{ts}@test.com",
            "password": "TestPass123!"
        })
        user_id = login_resp.json()["user"]["id"]

        # Update payment
        resp = promotor_client.put(
            f"{BASE_URL}/api/payments/{user_id}",
            json={"status": "paid", "amount": 500.0, "notes": "TEST_payment"}
        )
        assert resp.status_code == 200

        # Verify via payments list
        list_resp = promotor_client.get(f"{BASE_URL}/api/payments")
        payments = {p["user_id"]: p for p in list_resp.json()}
        assert payments[user_id]["status"] == "paid"


class TestDatasets:
    """Test dataset upload and management"""

    def test_get_catalog(self, api_client):
        """Public catalog endpoint accessible"""
        resp = api_client.get(f"{BASE_URL}/api/datasets/catalog")
        assert resp.status_code == 200
        data = resp.json()
        assert "@type" in data
        assert data["@type"] == "Catalog"
        assert "dataset" in data

    def test_list_datasets_as_promotor(self, promotor_client):
        """Promotor can list all datasets"""
        resp = promotor_client.get(f"{BASE_URL}/api/datasets")
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

    def test_upload_dataset_requires_effective_member(self, member_client):
        """Member without effective incorporation cannot upload"""
        csv_content = b"col1,col2\nval1,val2"
        resp = member_client.post(
            f"{BASE_URL}/api/datasets",
            data={
                "title": "TEST_Dataset",
                "description": "Test dataset",
                "category": "general",
                "license": "CC-BY-4.0",
                "access_rights": "restricted"
            },
            files={"file": ("test.csv", io.BytesIO(csv_content), "text/csv")},
            headers={"Authorization": member_client.headers.get("Authorization")}
        )
        # Should fail - member is not effective provider
        assert resp.status_code in [400, 403]


class TestAudit:
    """Test audit log functionality"""

    def test_list_audit_logs_as_promotor(self, promotor_client):
        """Promotor can see audit logs"""
        resp = promotor_client.get(f"{BASE_URL}/api/audit")
        assert resp.status_code == 200
        data = resp.json()
        assert isinstance(data, list)
        # Audit logs should have required fields
        if data:
            log = data[0]
            assert "user_id" in log
            assert "action" in log
            assert "timestamp" in log

    def test_list_audit_forbidden_for_member(self, member_client):
        """Member cannot see audit logs"""
        resp = member_client.get(f"{BASE_URL}/api/audit")
        assert resp.status_code == 403

    def test_export_audit_csv(self, promotor_client):
        """Promotor can export audit as CSV"""
        resp = promotor_client.get(f"{BASE_URL}/api/audit/export")
        assert resp.status_code == 200
        assert "text/csv" in resp.headers.get("content-type", "")


class TestGovernance:
    """Test governance features"""

    def test_list_committee(self, promotor_client):
        """Promotor can list committee members"""
        resp = promotor_client.get(f"{BASE_URL}/api/governance/committee")
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

    def test_list_decisions(self, promotor_client):
        """Promotor can list governance decisions"""
        resp = promotor_client.get(f"{BASE_URL}/api/governance/decisions")
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

    def test_create_decision(self, promotor_client):
        """Promotor can create a governance decision"""
        resp = promotor_client.post(
            f"{BASE_URL}/api/governance/decisions",
            json={
                "title": "TEST_Decision",
                "description": "A test governance decision",
                "decision_type": "policy",
                "participants": [],
                "attachments": []
            }
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["title"] == "TEST_Decision"
        assert data["status"] == "active"

    def test_create_decision_forbidden_for_member(self, member_client):
        """Member cannot create governance decisions"""
        resp = member_client.post(
            f"{BASE_URL}/api/governance/decisions",
            json={
                "title": "Unauthorized Decision",
                "description": "Should fail",
                "decision_type": "policy"
            }
        )
        assert resp.status_code == 403
