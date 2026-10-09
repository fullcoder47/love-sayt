from app import app
from site_content import SITE


def test_home_returns_html():
    with app.test_client() as client:
        response = client.get('/')
        assert response.status_code == 200
        assert response.mimetype == 'text/html'
        page = response.get_data(as_text=True)
        assert SITE['her_name'] in page
        assert 'id="quiz"' in page
        assert 'id="no-button"' in page
        assert 'id="game-board"' in page
        assert 'id="final-modal"' in page


def test_health_endpoint():
    with app.test_client() as client:
        response = client.get('/healthz')
        assert response.status_code == 200
        assert response.json['status'] == 'ok'


def test_security_headers():
    with app.test_client() as client:
        response = client.get('/')
        assert response.headers['X-Content-Type-Options'] == 'nosniff'
        assert response.headers['X-Frame-Options'] == 'DENY'


def test_personal_data_has_minimum_content():
    assert len(SITE['quiz']) >= 8
    assert all(len(q['options']) >= 2 for q in SITE['quiz'])
    assert len(SITE['memory_cards']) == 6
    assert len(SITE['letter']) >= 3
