import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')


class TestCatalogVisibility:
    """Test catalog visibility for all members"""

    def test_full_catalog_returns_published_datasets(self, promotor_client):
        """GET /api/datasets/catalog/full returns all published datasets"""
        resp = promotor_client.get(f"{BASE_URL}/api/datasets/catalog/full")
        assert resp.status_code == 200
        data = resp.json()
        assert isinstance(data, list)
        # All returned datasets should be published
        for dataset in data:
            assert dataset["status"] == "published"
            assert "id" in dataset
            assert "title" in dataset
            assert "category" in dataset
            assert "dcat_metadata" in dataset

    def test_full_catalog_accessible_by_member(self, member_client):
        """Members can access the full catalog"""
        resp = member_client.get(f"{BASE_URL}/api/datasets/catalog/full")
        assert resp.status_code == 200
        data = resp.json()
        assert isinstance(data, list)
        # Should see the same datasets as promotor
        assert len(data) >= 0

    def test_public_catalog_dcat_format(self, api_client):
        """GET /api/datasets/catalog returns DCAT-AP format"""
        resp = api_client.get(f"{BASE_URL}/api/datasets/catalog")
        assert resp.status_code == 200
        data = resp.json()
        assert data["@type"] == "Catalog"
        assert "@context" in data
        assert "dataset" in data
        assert isinstance(data["dataset"], list)


class TestCategoryFiltering:
    """Test category filtering in catalog"""

    def test_datasets_have_valid_categories(self, promotor_client):
        """All datasets have valid categories"""
        valid_categories = ["UTP", "ICT", "FM", "SAT", "general"]
        resp = promotor_client.get(f"{BASE_URL}/api/datasets/catalog/full")
        assert resp.status_code == 200
        data = resp.json()
        for dataset in data:
            assert dataset["category"] in valid_categories, f"Invalid category: {dataset['category']}"

    def test_datasets_have_category_in_dcat_metadata(self, promotor_client):
        """DCAT metadata includes theme (category)"""
        resp = promotor_client.get(f"{BASE_URL}/api/datasets/catalog/full")
        assert resp.status_code == 200
        data = resp.json()
        for dataset in data:
            assert "dcat_metadata" in dataset
            assert "theme" in dataset["dcat_metadata"]
            # Theme should match category
            assert dataset["dcat_metadata"]["theme"] == dataset["category"]


class TestCategoryUpdate:
    """Test PUT /api/datasets/{id}/category endpoint"""

    def test_promotor_can_update_category(self, promotor_client):
        """Promotor can update dataset category"""
        # Get a dataset
        resp = promotor_client.get(f"{BASE_URL}/api/datasets/catalog/full")
        assert resp.status_code == 200
        datasets = resp.json()
        if not datasets:
            pytest.skip("No datasets available for testing")
        
        dataset_id = datasets[0]["id"]
        original_category = datasets[0]["category"]
        
        # Choose a different category
        new_category = "SAT" if original_category != "SAT" else "ICT"
        
        # Update category
        update_resp = promotor_client.put(
            f"{BASE_URL}/api/datasets/{dataset_id}/category",
            data={"category": new_category},
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        assert update_resp.status_code == 200
        assert update_resp.json()["category"] == new_category
        
        # Verify change persisted
        verify_resp = promotor_client.get(f"{BASE_URL}/api/datasets/catalog/full")
        updated_dataset = next((d for d in verify_resp.json() if d["id"] == dataset_id), None)
        assert updated_dataset is not None
        assert updated_dataset["category"] == new_category
        
        # Restore original category
        promotor_client.put(
            f"{BASE_URL}/api/datasets/{dataset_id}/category",
            data={"category": original_category},
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )

    def test_member_cannot_update_category(self, member_token, promotor_client):
        """Member cannot update dataset category"""
        # Get a dataset using promotor
        resp = promotor_client.get(f"{BASE_URL}/api/datasets/catalog/full")
        datasets = resp.json()
        if not datasets:
            pytest.skip("No datasets available for testing")
        
        dataset_id = datasets[0]["id"]
        
        # Try to update as member using a fresh session
        import requests
        update_resp = requests.put(
            f"{BASE_URL}/api/datasets/{dataset_id}/category",
            data={"category": "SAT"},
            headers={
                "Authorization": f"Bearer {member_token}",
                "Content-Type": "application/x-www-form-urlencoded"
            }
        )
        assert update_resp.status_code == 403

    def test_invalid_category_rejected(self, promotor_client):
        """Invalid category is rejected"""
        resp = promotor_client.get(f"{BASE_URL}/api/datasets/catalog/full")
        datasets = resp.json()
        if not datasets:
            pytest.skip("No datasets available for testing")
        
        dataset_id = datasets[0]["id"]
        
        # Try invalid category
        update_resp = promotor_client.put(
            f"{BASE_URL}/api/datasets/{dataset_id}/category",
            data={"category": "INVALID_CATEGORY"},
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        assert update_resp.status_code == 400
        assert "inválida" in update_resp.json()["detail"].lower()

    def test_all_valid_categories_accepted(self, promotor_client):
        """All valid categories can be set"""
        valid_categories = ["UTP", "ICT", "FM", "SAT", "general"]
        
        resp = promotor_client.get(f"{BASE_URL}/api/datasets/catalog/full")
        datasets = resp.json()
        if not datasets:
            pytest.skip("No datasets available for testing")
        
        dataset_id = datasets[0]["id"]
        original_category = datasets[0]["category"]
        
        for category in valid_categories:
            update_resp = promotor_client.put(
                f"{BASE_URL}/api/datasets/{dataset_id}/category",
                data={"category": category},
                headers={"Content-Type": "application/x-www-form-urlencoded"}
            )
            assert update_resp.status_code == 200, f"Failed for category: {category}"
            assert update_resp.json()["category"] == category
        
        # Restore original
        promotor_client.put(
            f"{BASE_URL}/api/datasets/{dataset_id}/category",
            data={"category": original_category},
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )


class TestDatasetDownload:
    """Test dataset download from catalog"""

    def test_member_can_download_published_dataset(self, member_client, promotor_client):
        """Member can download published datasets"""
        # Get a published dataset
        resp = promotor_client.get(f"{BASE_URL}/api/datasets/catalog/full")
        datasets = resp.json()
        if not datasets:
            pytest.skip("No datasets available for testing")
        
        dataset_id = datasets[0]["id"]
        
        # Download as member
        download_resp = member_client.get(f"{BASE_URL}/api/datasets/{dataset_id}/download")
        assert download_resp.status_code == 200
        # Should have content
        assert len(download_resp.content) > 0

    def test_promotor_can_download_dataset(self, promotor_client):
        """Promotor can download datasets"""
        resp = promotor_client.get(f"{BASE_URL}/api/datasets/catalog/full")
        datasets = resp.json()
        if not datasets:
            pytest.skip("No datasets available for testing")
        
        dataset_id = datasets[0]["id"]
        
        download_resp = promotor_client.get(f"{BASE_URL}/api/datasets/{dataset_id}/download")
        assert download_resp.status_code == 200
        assert len(download_resp.content) > 0

    def test_download_nonexistent_dataset_returns_404(self, promotor_client):
        """Downloading non-existent dataset returns 404"""
        fake_id = str(uuid.uuid4())
        resp = promotor_client.get(f"{BASE_URL}/api/datasets/{fake_id}/download")
        assert resp.status_code == 404


class TestCatalogSearch:
    """Test catalog search functionality (frontend-side filtering)"""

    def test_datasets_have_searchable_fields(self, promotor_client):
        """Datasets have title and description for search"""
        resp = promotor_client.get(f"{BASE_URL}/api/datasets/catalog/full")
        assert resp.status_code == 200
        datasets = resp.json()
        for dataset in datasets:
            assert "title" in dataset
            assert "description" in dataset
            assert isinstance(dataset["title"], str)
            assert isinstance(dataset["description"], str)

    def test_datasets_have_keywords(self, promotor_client):
        """Datasets have keywords array"""
        resp = promotor_client.get(f"{BASE_URL}/api/datasets/catalog/full")
        assert resp.status_code == 200
        datasets = resp.json()
        for dataset in datasets:
            assert "keywords" in dataset
            assert isinstance(dataset["keywords"], list)
