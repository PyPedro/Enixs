(() => {
    const hero = document.querySelector('.home-hero-section');
    if (!hero) return;

    const slides = Array.from(hero.querySelectorAll('.home-hero-slide'));
    const pagination = hero.querySelector('.home-hero-pagination');
    const previousButton = hero.querySelector('.home-hero-prev');
    const nextButton = hero.querySelector('.home-hero-next');

    if (!pagination || !previousButton || !nextButton || slides.length < 2) {
        hero.querySelector('.home-hero-controls')?.setAttribute('hidden', '');
        return;
    }

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const dots = slides.map((_, index) => {
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'home-hero-dot';
        dot.setAttribute('aria-label', `Ir para campanha ${index + 1}`);
        dot.setAttribute('aria-current', index === 0 ? 'true' : 'false');
        dot.addEventListener('click', () => mostrarSlide(index));
        pagination.append(dot);
        return dot;
    });

    let indiceAtual = 0;
    let temporizador;
    let pausado = false;

    function mostrarSlide(indice) {
        indiceAtual = (indice + slides.length) % slides.length;
        slides.forEach((slide, posicao) => {
            const ativo = posicao === indiceAtual;
            slide.classList.toggle('is-active', ativo);
            slide.setAttribute('aria-hidden', String(!ativo));
            dots[posicao].setAttribute('aria-current', String(ativo));
        });
        reiniciarRotacao();
    }

    function pararRotacao() {
        window.clearInterval(temporizador);
        temporizador = undefined;
    }

    function iniciarRotacao() {
        pararRotacao();
        if (pausado || document.hidden || reducedMotion.matches) return;
        temporizador = window.setInterval(() => mostrarSlide(indiceAtual + 1), 6500);
    }

    function reiniciarRotacao() {
        iniciarRotacao();
    }

    previousButton.addEventListener('click', () => mostrarSlide(indiceAtual - 1));
    nextButton.addEventListener('click', () => mostrarSlide(indiceAtual + 1));

    pagination.addEventListener('keydown', (event) => {
        if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
            event.preventDefault();
            const direcao = event.key === 'ArrowRight' ? 1 : -1;
            mostrarSlide(indiceAtual + direcao);
            dots[indiceAtual].focus();
        }
    });

    hero.addEventListener('pointerenter', () => {
        pausado = true;
        pararRotacao();
    });
    hero.addEventListener('pointerleave', () => {
        pausado = false;
        iniciarRotacao();
    });
    hero.addEventListener('focusin', () => {
        pausado = true;
        pararRotacao();
    });
    hero.addEventListener('focusout', (event) => {
        if (!hero.contains(event.relatedTarget)) {
            pausado = false;
            iniciarRotacao();
        }
    });
    document.addEventListener('visibilitychange', iniciarRotacao);
    reducedMotion.addEventListener('change', iniciarRotacao);

    iniciarRotacao();
})();
