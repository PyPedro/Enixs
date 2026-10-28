from app import create_app, db
from app.models import Produto, Visita


def test_catalogo_e_publico_e_ignora_estoque(monkeypatch):
    monkeypatch.setenv('DATABASE_URL', 'sqlite://')
    app = create_app()

    with app.app_context():
        db.session.add(Produto(
            codigo='CAT-001',
            nome='Produto sem estoque',
            preco=49.9,
            etiqueta='NOVO',
            imagem_url='img/produto.jpg',
            variantes='[{"cor":"Preto","tamanhos":[{"nome":"M","estoque":0,"preco":49.9}]}]',
        ))
        db.session.commit()

    with app.test_client() as client:
        resposta = client.get('/catalogo')

    assert resposta.status_code == 200
    html = resposta.get_data(as_text=True)
    assert 'Produto sem estoque' in html
    assert 'catalogo.js' in html
    assert 'authModal' not in html
    assert 'ENTRAR / CADASTRAR' not in html
    with app.app_context():
        assert Visita.query.count() == 0


def test_script_do_catalogo_usa_carrinho_local_e_checkout_whatsapp(monkeypatch):
    monkeypatch.setenv('DATABASE_URL', 'sqlite://')
    app = create_app()

    with app.test_client() as client:
        resposta = client.get('/static/catalogo.js')

    assert resposta.status_code == 200
    script = resposta.get_data(as_text=True)
    assert 'localStorage.setItem' in script
    assert 'localStorage.getItem(CHAVE_CARRINHO_CATALOGO)' in script
    assert 'encodeURIComponent(mensagem)' in script
    assert 'https://wa.me/5581996967175?text=' in script
    assert "fetch(" not in script
