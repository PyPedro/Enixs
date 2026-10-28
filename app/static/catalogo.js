const CHAVE_CARRINHO_CATALOGO = 'fitnessclub-catalogo-carrinho';
let carrinho = carregarCarrinho();
let produtoTemp = null;
let galeriaImagemAmpliada = null;
let imagemOrigemAmpliada = null;
let indiceImagemAmpliada = 0;

function mostrarAviso(mensagem, titulo = 'Aviso Fitness Club') {
    const modal = document.getElementById('customModal');
    const msgElement = document.getElementById('modalMensagem');
    const tituloElement = document.getElementById('modalTitulo');
    if (!modal || !msgElement || !tituloElement) {
        console.error(`${titulo}: ${mensagem}`);
        return;
    }
    tituloElement.textContent = titulo;
    msgElement.textContent = mensagem;
    modal.style.display = 'flex';
}

function fecharModalCustom() {
    const modal = document.getElementById('customModal');
    if (modal) modal.style.display = 'none';
}

function carregarCarrinho() {
    try {
        const salvo = localStorage.getItem(CHAVE_CARRINHO_CATALOGO);
        if (!salvo) return [];
        const itens = JSON.parse(salvo);
        if (!Array.isArray(itens)) throw new Error('O conteúdo salvo não é uma lista.');
        return itens;
    } catch (erro) {
        console.error('Não foi possível carregar o carrinho salvo.', erro);
        mostrarAviso('Não foi possível carregar o carrinho salvo neste navegador.', 'Erro no carrinho');
        return [];
    }
}

function salvarCarrinho() {
    try {
        localStorage.setItem(CHAVE_CARRINHO_CATALOGO, JSON.stringify(carrinho));
    } catch (erro) {
        console.error('Não foi possível salvar o carrinho no navegador.', erro);
        mostrarAviso('Não foi possível salvar o carrinho neste navegador. Verifique o espaço disponível e as permissões de armazenamento.', 'Erro no carrinho');
    }
}

function escaparHtml(valor) {
    return String(valor ?? '').replace(/[&<>"']/g, caractere => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    })[caractere]);
}

function formatarValor(valor) {
    return `R$ ${Number(valor || 0).toFixed(2).replace('.', ',')}`;
}

function fecharBuscaModal() {
    const modal = document.getElementById('searchModal');
    if (modal) modal.style.display = 'none';
}

function abrirBuscaModal() {
    const modal = document.getElementById('searchModal');
    if (!modal) return;
    modal.style.display = 'flex';
    setTimeout(() => document.getElementById('searchInput')?.focus(), 100);
    const lojaSecao = document.getElementById('loja');
    const cabecalho = document.querySelector('.main-header');
    if (lojaSecao && cabecalho) {
        window.scrollTo({
            top: lojaSecao.getBoundingClientRect().top + window.scrollY - cabecalho.offsetHeight - 20,
            behavior: 'smooth'
        });
    }
}

function filtrarProdutos() {
    const campo = document.getElementById('searchInput');
    const feedback = document.getElementById('searchFeedback');
    if (!campo || !feedback) return;
    const termo = campo.value.toLowerCase().trim();
    const cards = document.querySelectorAll('.product-card');
    let encontrados = 0;
    cards.forEach(card => {
        const nome = card.querySelector('.product-name')?.textContent.toLowerCase() || '';
        const corresponde = nome.includes(termo);
        card.style.display = corresponde ? 'flex' : 'none';
        if (corresponde) encontrados++;
    });
    feedback.style.display = 'block';
    feedback.textContent = encontrados
        ? `Mostrando ${encontrados} produto(s).`
        : `Nenhum produto encontrado para "${termo}".`;
}

function trocarImagemProduto(botao, imagemUrl) {
    const galeria = botao.closest('.product-gallery');
    const imagemPrincipal = galeria?.querySelector('.product-main-image');
    if (!imagemPrincipal) return;
    const requisicao = Number(galeria.dataset.imageRequest || 0) + 1;
    galeria.dataset.imageRequest = requisicao;
    const imagemPreparada = new Image();
    imagemPreparada.src = imagemUrl;
    imagemPreparada.decode().then(() => {
        if (Number(galeria.dataset.imageRequest) === requisicao) imagemPrincipal.src = imagemUrl;
    }).catch(() => {
        if (Number(galeria.dataset.imageRequest) === requisicao) imagemPrincipal.src = imagemUrl;
    });
    if (botao.dataset.fullSrc) imagemPrincipal.dataset.fullSrc = botao.dataset.fullSrc;
    const miniaturas = Array.from(galeria.querySelectorAll('.product-thumbnail'));
    miniaturas.forEach(miniatura => {
        miniatura.classList.remove('active');
        miniatura.setAttribute('aria-selected', 'false');
    });
    botao.classList.add('active');
    botao.setAttribute('aria-selected', 'true');
    const contador = galeria.querySelector('.gallery-counter');
    if (contador) contador.textContent = `${miniaturas.indexOf(botao) + 1} / ${miniaturas.length}`;
}

function precarregarImagemGaleria(botao, direcao = 0) {
    const galeria = botao.closest('.product-gallery');
    if (!galeria) return;
    const miniaturas = Array.from(galeria.querySelectorAll('.product-thumbnail'));
    let alvo = botao;
    if (direcao) {
        const atual = miniaturas.findIndex(miniatura => miniatura.classList.contains('active'));
        alvo = miniaturas[(atual + direcao + miniaturas.length) % miniaturas.length];
    }
    if (!alvo || alvo.dataset.preloaded) return;
    alvo.dataset.preloaded = 'true';
    new Image().src = alvo.dataset.gallerySrc;
}

function navegarGaleria(botao, direcao) {
    const galeria = botao.closest('.product-gallery');
    if (!galeria) return;
    const miniaturas = Array.from(galeria.querySelectorAll('.product-thumbnail'));
    const atual = miniaturas.findIndex(miniatura => miniatura.classList.contains('active'));
    const miniatura = miniaturas[(atual + direcao + miniaturas.length) % miniaturas.length];
    trocarImagemProduto(miniatura, miniatura.dataset.gallerySrc);
    miniatura.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
}

function abrirImagemProduto(imagem) {
    const modal = document.getElementById('productImageViewer');
    const galeria = imagem.closest('.product-gallery');
    if (!modal || !imagem.dataset.fullSrc) return;
    galeriaImagemAmpliada = galeria;
    imagemOrigemAmpliada = imagem;
    const miniaturas = galeria ? Array.from(galeria.querySelectorAll('.product-thumbnail')) : [];
    indiceImagemAmpliada = Math.max(0, miniaturas.findIndex(miniatura => miniatura.classList.contains('active')));
    atualizarImagemAmpliada();
    modal.style.display = 'flex';
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('image-viewer-open');
    modal.querySelector('.image-viewer-close')?.focus();
}

function atualizarImagemAmpliada() {
    const modal = document.getElementById('productImageViewer');
    const imagem = document.getElementById('productImageViewerImage');
    const contador = document.getElementById('productImageViewerCounter');
    if (!modal || !imagem || !contador) return;
    const miniaturas = galeriaImagemAmpliada
        ? Array.from(galeriaImagemAmpliada.querySelectorAll('.product-thumbnail'))
        : [];
    const principal = galeriaImagemAmpliada?.querySelector('.product-main-image') || imagemOrigemAmpliada;
    const miniatura = miniaturas[indiceImagemAmpliada];
    imagem.src = miniatura?.dataset.fullSrc || principal?.dataset.fullSrc || '';
    imagem.alt = miniatura?.getAttribute('aria-label') || principal?.alt || '';
    contador.textContent = miniaturas.length > 1 ? `${indiceImagemAmpliada + 1} / ${miniaturas.length}` : '';
    modal.querySelector('.image-viewer-prev').hidden = miniaturas.length < 2;
    modal.querySelector('.image-viewer-next').hidden = miniaturas.length < 2;
}

function navegarImagemAmpliada(direcao) {
    if (!galeriaImagemAmpliada) return;
    const miniaturas = Array.from(galeriaImagemAmpliada.querySelectorAll('.product-thumbnail'));
    if (miniaturas.length < 2) return;
    indiceImagemAmpliada = (indiceImagemAmpliada + direcao + miniaturas.length) % miniaturas.length;
    const miniatura = miniaturas[indiceImagemAmpliada];
    trocarImagemProduto(miniatura, miniatura.dataset.gallerySrc);
    atualizarImagemAmpliada();
}

function fecharVisualizadorProduto(evento) {
    const modal = document.getElementById('productImageViewer');
    if (!modal || (evento && evento.target !== modal)) return;
    modal.style.display = 'none';
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('image-viewer-open');
    imagemOrigemAmpliada?.focus();
    galeriaImagemAmpliada = null;
    imagemOrigemAmpliada = null;
}

function toggleCarrinho() {
    const drawer = document.getElementById('cartDrawer');
    const overlay = document.getElementById('cartOverlay');
    if (drawer && overlay) {
        drawer.classList.toggle('open');
        overlay.classList.toggle('open');
    }
}

function tamanhosDisponiveis(produto) {
    const ordem = ['P', 'M', 'G', 'GG', 'XG', 'XGG'];
    const nomes = new Set((produto.variantes || []).flatMap(variante =>
        (variante.tamanhos || []).map(tamanho => String(tamanho.nome || '').toUpperCase()).filter(Boolean)
    ));
    return Array.from(nomes).sort((a, b) => {
        const posicaoA = ordem.indexOf(a);
        const posicaoB = ordem.indexOf(b);
        return (posicaoA < 0 ? ordem.length : posicaoA) - (posicaoB < 0 ? ordem.length : posicaoB);
    });
}

function opcoesDeTamanho(produto, tamanho) {
    return (produto.variantes || []).flatMap(variante => (variante.tamanhos || [])
        .filter(opcao => String(opcao.nome).toUpperCase() === tamanho)
        .map(opcao => ({
            cor: variante.cor ?? null,
            preco: Number(opcao.preco) || 0
        })));
}

function faixaDePreco(produto, tamanho) {
    const valores = opcoesDeTamanho(produto, tamanho).map(opcao => opcao.preco);
    if (!valores.length) return '';
    const menor = Math.min(...valores);
    const maior = Math.max(...valores);
    return menor === maior ? formatarValor(menor) : `${formatarValor(menor)} a ${formatarValor(maior)}`;
}

function abrirModalGrade(id, nome, variantes, imagem, ehConjunto = false, relacionado = null) {
    produtoTemp = { id, nome, imagem, variantes, ehConjunto, relacionado, modoCompra: 'individual' };
    document.getElementById('gradeNomeProduto').textContent = nome;
    document.getElementById('productColorChoices').textContent = 'Cores variadas. As cores serão escolhidas aleatoriamente.';
    const modos = document.getElementById('productPurchaseModes');
    modos.style.display = ehConjunto && relacionado ? 'flex' : 'none';
    if (relacionado) {
        document.getElementById('bundlePrimaryName').textContent = nome;
        document.getElementById('bundleRelatedName').textContent = relacionado.nome;
        preencherOpcoesTamanhoConjunto('bundlePrimarySize', produtoTemp);
        preencherOpcoesTamanhoConjunto('bundleRelatedSize', relacionado);
    }
    selecionarModoCompra('individual');
    document.getElementById('gradeModal').style.display = 'flex';
}

function selecionarModoCompra(modo) {
    if (!produtoTemp) return;
    produtoTemp.modoCompra = modo;
    const compraEmConjunto = modo === 'conjunto' && produtoTemp.ehConjunto && produtoTemp.relacionado;
    document.getElementById('productGradeRows').hidden = Boolean(compraEmConjunto);
    document.getElementById('bundlePurchasePanel').hidden = !compraEmConjunto;
    document.querySelectorAll('#productPurchaseModes [data-purchase-mode]').forEach(botao => {
        const selecionado = botao.dataset.purchaseMode === modo;
        botao.classList.toggle('active', selecionado);
        botao.setAttribute('aria-pressed', String(selecionado));
    });
    document.getElementById('gradeConfirmButton').textContent = compraEmConjunto
        ? 'ADICIONAR CONJUNTO À SACOLA'
        : 'ADICIONAR À SACOLA';
    renderizarTamanhosProduto();
    if (produtoTemp.relacionado) atualizarDisponibilidadeConjunto();
}

function preencherOpcoesTamanhoConjunto(selectId, produto) {
    const seletor = document.getElementById(selectId);
    seletor.replaceChildren();
    tamanhosDisponiveis(produto).forEach(tamanho => {
        seletor.add(new Option(`${tamanho} · ${faixaDePreco(produto, tamanho)}`, tamanho));
    });
}

function atualizarDisponibilidadeConjunto() {
    if (!produtoTemp?.relacionado) return;
    const tamanhoPrincipal = document.getElementById('bundlePrimarySize').value;
    const tamanhoRelacionado = document.getElementById('bundleRelatedSize').value;
    const quantidade = document.getElementById('bundleQuantity');
    quantidade.removeAttribute('max');
    quantidade.disabled = false;
    quantidade.value = Math.max(1, Number(quantidade.value) || 1);
    const precoPrincipal = Math.min(...opcoesDeTamanho(produtoTemp, tamanhoPrincipal).map(item => item.preco));
    const precoRelacionado = Math.min(...opcoesDeTamanho(produtoTemp.relacionado, tamanhoRelacionado).map(item => item.preco));
    document.getElementById('bundlePrice').textContent =
        `Conjunto a partir de ${formatarValor(precoPrincipal + precoRelacionado)} por par`;
}

function renderizarTamanhosProduto() {
    const tamanhos = tamanhosDisponiveis(produtoTemp);
    document.getElementById('productGradeRows').innerHTML = tamanhos.map((tamanho, indice) => `
        <div class="size-row">
            <div class="size-row-label">
                <span class="size-row-letter">${escaparHtml(tamanho)}</span>
                <span class="size-row-meta">${escaparHtml(faixaDePreco(produtoTemp, tamanho))}</span>
            </div>
            <label class="size-chip">
                <span>Qtd.</span>
                <input type="number" id="inputGrade_${indice}" class="size-input" min="0" value="0">
            </label>
        </div>
    `).join('');
}

function fecharModalGrade() {
    document.getElementById('gradeModal').style.display = 'none';
}

function criarItens(produto, tamanho, quantidade) {
    const opcoes = opcoesDeTamanho(produto, tamanho);
    if (!opcoes.length) return [];
    const itens = new Map();
    for (let unidade = 0; unidade < quantidade; unidade++) {
        const opcao = opcoes[Math.floor(Math.random() * opcoes.length)];
        const cartId = `${produto.id}_${opcao.cor ?? 'sem-cor'}_${tamanho}`;
        const item = itens.get(cartId);
        if (item) {
            item.quantidade++;
        } else {
            itens.set(cartId, {
                cartId,
                id: produto.id,
                tamanho,
                cor: opcao.cor,
                corAleatoria: true,
                nome: produto.nome,
                imagem: produto.imagem,
                preco: opcao.preco,
                quantidade: 1
            });
        }
    }
    return Array.from(itens.values());
}

function confirmarGrade() {
    if (!produtoTemp) return;
    let novosItens = [];
    if (produtoTemp.modoCompra === 'conjunto' && produtoTemp.ehConjunto && produtoTemp.relacionado) {
        const tamanhoPrincipal = document.getElementById('bundlePrimarySize').value;
        const tamanhoRelacionado = document.getElementById('bundleRelatedSize').value;
        const quantidade = Math.max(0, Math.floor(Number(document.getElementById('bundleQuantity').value) || 0));
        if (!quantidade) {
            mostrarAviso('Informe uma quantidade de conjuntos maior que zero.', 'Atenção');
            return;
        }
        novosItens = [
            ...criarItens(produtoTemp, tamanhoPrincipal, quantidade),
            ...criarItens(produtoTemp.relacionado, tamanhoRelacionado, quantidade)
        ];
    } else {
        tamanhosDisponiveis(produtoTemp).forEach((tamanho, indice) => {
            const quantidade = Math.max(0, Math.floor(Number(document.getElementById(`inputGrade_${indice}`).value) || 0));
            if (quantidade) novosItens.push(...criarItens(produtoTemp, tamanho, quantidade));
        });
    }
    if (!novosItens.length) {
        mostrarAviso('Selecione a quantidade de pelo menos 1 tamanho para adicionar à sacola.', 'Atenção');
        return;
    }
    novosItens.forEach(novo => {
        const existente = carrinho.find(item => item.cartId === novo.cartId);
        if (existente) existente.quantidade += novo.quantidade;
        else carrinho.push(novo);
    });
    fecharModalGrade();
    atualizarCarrinho();
    if (!document.getElementById('cartDrawer').classList.contains('open')) toggleCarrinho();
}

function alterarQuantidade(cartId, delta) {
    const item = carrinho.find(produto => produto.cartId === cartId);
    if (!item) return;
    item.quantidade += delta;
    if (item.quantidade <= 0) {
        carrinho = carrinho.filter(produto => produto !== item);
    }
    atualizarCarrinho();
}

function removerItemCarrinho(cartId) {
    carrinho = carrinho.filter(item => item.cartId !== cartId);
    atualizarCarrinho();
}

function atualizarCarrinho() {
    salvarCarrinho();
    const erroCarrinho = document.getElementById('catalogCartError');
    if (erroCarrinho) {
        erroCarrinho.textContent = '';
        erroCarrinho.style.display = 'none';
    }
    const cartItems = document.getElementById('cartItems');
    const cartCount = document.getElementById('cartCount');
    const subtotalElement = document.getElementById('cartSubtotal');
    const totalElement = document.getElementById('cartDrawerTotal');
    const quantidadeTotal = carrinho.reduce((total, item) => total + Number(item.quantidade || 0), 0);
    if (cartCount) cartCount.textContent = quantidadeTotal;
    const subtotal = carrinho.reduce((total, item) =>
        total + (Number(item.preco) || 0) * (Number(item.quantidade) || 0), 0);
    if (subtotalElement) subtotalElement.textContent = formatarValor(subtotal);
    if (totalElement) totalElement.textContent = formatarValor(subtotal);
    if (!cartItems) return;
    if (!carrinho.length) {
        cartItems.innerHTML = '<p class="empty-cart">Seu pedido está vazio.</p>';
        return;
    }
    cartItems.innerHTML = carrinho.map(item => `
        <div class="cart-item" style="display:flex; gap:10px; align-items:center; margin-bottom:15px; border-bottom:1px solid var(--border-color); padding-bottom:12px;">
            ${item.imagem
                ? `<img src="${escaparHtml(item.imagem)}" alt="${escaparHtml(item.nome)}" style="width:55px;height:55px;object-fit:cover;border-radius:6px;border:1px solid var(--border-color);">`
                : ''}
            <div style="flex:1;">
                <h4 style="font-size:12px;margin:0 0 4px;color:#111;">${escaparHtml(item.nome)}</h4>
                <span style="font-size:11px;color:#666;">Tam. ${escaparHtml(item.tamanho)} · ${formatarValor(item.preco)} cada</span>
                <div style="display:flex;align-items:center;gap:7px;margin-top:6px;">
                    <button type="button" data-cart-action="decrease" data-cart-id="${escaparHtml(item.cartId)}" aria-label="Diminuir quantidade">−</button>
                    <span>${Number(item.quantidade)}</span>
                    <button type="button" data-cart-action="increase" data-cart-id="${escaparHtml(item.cartId)}" aria-label="Aumentar quantidade">+</button>
                    <button type="button" data-cart-action="remove" data-cart-id="${escaparHtml(item.cartId)}" aria-label="Remover ${escaparHtml(item.nome)}">Remover</button>
                </div>
            </div>
            <strong style="font-size:13px;color:var(--brand-purple);">${formatarValor(item.preco * item.quantidade)}</strong>
        </div>
    `).join('');
}

function finalizarPedido() {
    let itens;
    try {
        itens = JSON.parse(localStorage.getItem(CHAVE_CARRINHO_CATALOGO) || '[]');
    } catch (erro) {
        console.error('Não foi possível ler o carrinho para finalizar o pedido.', erro);
        mostrarAviso('Não foi possível ler o carrinho salvo neste navegador.', 'Erro no carrinho');
        return;
    }
    if (!Array.isArray(itens) || itens.length === 0) {
        mostrarAviso('Seu carrinho está vazio.', 'Carrinho Vazio');
        return;
    }
    const total = itens.reduce((soma, item) =>
        soma + Number(item.preco) * Number(item.quantidade), 0);
    if (total < 500) {
        const erroCarrinho = document.getElementById('catalogCartError');
        if (erroCarrinho) {
            erroCarrinho.textContent = `O pedido mínimo é de R$ 500,00. Adicione mais ${formatarValor(500 - total)} em produtos para finalizar.`;
            erroCarrinho.style.display = 'block';
        }
        return;
    }

    const erroCarrinho = document.getElementById('catalogCartError');
    if (erroCarrinho) {
        erroCarrinho.textContent = '';
        erroCarrinho.style.display = 'none';
    }
    const campoNome = document.getElementById('catalogCustomerName');
    const erroModal = document.getElementById('catalogCheckoutError');
    if (campoNome) campoNome.value = '';
    if (erroModal) {
        erroModal.textContent = '';
        erroModal.style.display = 'none';
    }
    const modal = document.getElementById('catalogCheckoutModal');
    if (!modal) {
        mostrarAviso('Não foi possível abrir o formulário de finalização. Atualize a página e tente novamente.', 'Erro no pedido');
        return;
    }
    modal.style.display = 'flex';
    campoNome?.focus();
}

function fecharModalCheckout() {
    const modal = document.getElementById('catalogCheckoutModal');
    if (modal) modal.style.display = 'none';
}

function confirmarEnvioPedido(evento) {
    evento.preventDefault();
    const campoNome = document.getElementById('catalogCustomerName');
    const nome = campoNome?.value.trim() || '';
    const erroModal = document.getElementById('catalogCheckoutError');
    if (!nome) {
        if (erroModal) {
            erroModal.textContent = 'Informe seu nome para enviar o pedido.';
            erroModal.style.display = 'block';
        }
        campoNome?.focus();
        return;
    }

    let itens;
    try {
        itens = JSON.parse(localStorage.getItem(CHAVE_CARRINHO_CATALOGO) || '[]');
    } catch (erro) {
        console.error('Não foi possível ler o carrinho para finalizar o pedido.', erro);
        fecharModalCheckout();
        mostrarAviso('Não foi possível ler o carrinho salvo neste navegador.', 'Erro no carrinho');
        return;
    }
    if (!Array.isArray(itens) || itens.length === 0) {
        fecharModalCheckout();
        mostrarAviso('Seu carrinho está vazio.', 'Carrinho Vazio');
        return;
    }

    const total = itens.reduce((soma, item) =>
        soma + Number(item.preco) * Number(item.quantidade), 0);
    if (total < 500) {
        fecharModalCheckout();
        const erroCarrinho = document.getElementById('catalogCartError');
        if (erroCarrinho) {
            erroCarrinho.textContent = `O pedido mínimo é de R$ 500,00. Adicione mais ${formatarValor(500 - total)} em produtos para finalizar.`;
            erroCarrinho.style.display = 'block';
        }
        return;
    }
    const linhasProdutos = itens.map(item =>
        `${Number(item.quantidade)}x ${item.nome} - Tam. ${item.tamanho} - Subtotal: ${formatarValor(Number(item.preco) * Number(item.quantidade))}`
    );
    const mensagem = [
        `Olá, o meu nome é ${nome}. Segue o resumo do meu pedido:`,
        ...linhasProdutos,
        `Total do Pedido: ${formatarValor(total)}`
    ].join('\n');
    window.location.href = `https://wa.me/5581996967175?text=${encodeURIComponent(mensagem)}`;
}

document.getElementById('cartItems')?.addEventListener('click', evento => {
    const botao = evento.target.closest('button[data-cart-action]');
    if (!botao) return;
    if (botao.dataset.cartAction === 'increase') alterarQuantidade(botao.dataset.cartId, 1);
    if (botao.dataset.cartAction === 'decrease') alterarQuantidade(botao.dataset.cartId, -1);
    if (botao.dataset.cartAction === 'remove') removerItemCarrinho(botao.dataset.cartId);
});

document.addEventListener('keydown', evento => {
    if (evento.key === 'Escape') fecharModalCheckout();
    const modal = document.getElementById('productImageViewer');
    if (modal && modal.getAttribute('aria-hidden') !== 'true') {
        if (evento.key === 'Escape') fecharVisualizadorProduto();
        if (evento.key === 'ArrowLeft') navegarImagemAmpliada(-1);
        if (evento.key === 'ArrowRight') navegarImagemAmpliada(1);
    }
    if (evento.key === 'Escape' || evento.key === 'Enter') fecharBuscaModal();
});

atualizarCarrinho();
