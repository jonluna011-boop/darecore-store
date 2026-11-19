/* ==========================================
   DARECORE - SCRIPT MAESTRO COMPLETO
   ========================================== */

let selectedCustomBaseIndex = 0;
let cart = JSON.parse(localStorage.getItem('darecore_cart')) || [];
let activeCartTab = 'cart';
let isSyncing = false;
let currentSearchTerm = '';
let heroSlideIndex = 0;
let heroAutoTimer = null;

const ORDER_STATUSES = [
    'Pago pendiente',
    'Pedido pendiente',
    'En proceso',
    'Listo para enviar',
    'Enviado'
];

const STORE_URL = 'https://darecore-store-web.vercel.app';
const AVATAR_URL = 'https://i.ibb.co/cSm45r2D/darecorelogo.png';

const EMAIL_WEBHOOK_URL = '';

const EMAILJS_CONFIG = {
    publicKey: 'oPqh5dU4hbXT_uZng',
    serviceId: 'service_a3uxsit',
    newProductTemplateId: 'template_gxvi2ue',
    abandonedCartTemplateId: 'template_gxvi2ue'
};

const CINEMA_CARD_THEMES = [
    {
        bg: 'radial-gradient(circle at 80% 18%, rgba(255, 42, 0, 0.38) 0%, rgba(153, 27, 27, 0.22) 45%, rgba(18, 18, 23, 0.96) 85%)',
        glow: 'rgba(255, 42, 0, 0.34)',
        dot: '#ff2a00',
        heroBg: 'radial-gradient(circle at 80% 35%, #8f1d14 0%, #2a0c0d 52%, #0a0a0d 100%)'
    },
    {
        bg: 'radial-gradient(circle at 80% 18%, rgba(59, 130, 246, 0.36) 0%, rgba(30, 58, 138, 0.22) 45%, rgba(18, 18, 23, 0.96) 85%)',
        glow: 'rgba(59, 130, 246, 0.32)',
        dot: '#60a5fa',
        heroBg: 'radial-gradient(circle at 80% 35%, #1e3a8a 0%, #111827 55%, #090a0d 100%)'
    },
    {
        bg: 'radial-gradient(circle at 80% 18%, rgba(245, 158, 11, 0.34) 0%, rgba(146, 64, 14, 0.22) 45%, rgba(18, 18, 23, 0.96) 85%)',
        glow: 'rgba(245, 158, 11, 0.32)',
        dot: '#fbbf24',
        heroBg: 'radial-gradient(circle at 80% 35%, #78350f 0%, #1c1917 55%, #09090b 100%)'
    },
    {
        bg: 'radial-gradient(circle at 80% 18%, rgba(6, 182, 212, 0.36) 0%, rgba(21, 94, 117, 0.22) 45%, rgba(18, 18, 23, 0.96) 85%)',
        glow: 'rgba(6, 182, 212, 0.32)',
        dot: '#22d3ee',
        heroBg: 'radial-gradient(circle at 80% 35%, #155e75 0%, #0f172a 55%, #080a0c 100%)'
    },
    {
        bg: 'radial-gradient(circle at 80% 18%, rgba(168, 85, 247, 0.36) 0%, rgba(88, 28, 135, 0.22) 45%, rgba(18, 18, 23, 0.96) 85%)',
        glow: 'rgba(168, 85, 247, 0.32)',
        dot: '#c084fc',
        heroBg: 'radial-gradient(circle at 80% 35%, #581c87 0%, #181024 55%, #09080d 100%)'
    },
    {
        bg: 'radial-gradient(circle at 80% 18%, rgba(16, 185, 129, 0.34) 0%, rgba(6, 95, 70, 0.22) 45%, rgba(18, 18, 23, 0.96) 85%)',
        glow: 'rgba(16, 185, 129, 0.30)',
        dot: '#34d399',
        heroBg: 'radial-gradient(circle at 80% 35%, #065f46 0%, #0d1b18 55%, #080c0b 100%)'
    }
];

document.addEventListener('DOMContentLoaded', () => {
    updateTopAnnouncementBanner();
    styleBrandLogoInHeader();
    layoutPublicHeaderZones();
    cleanExtraHeroBlocks();
    initHeroShowcase();
    initStore();
    setupSearch();
    setupDareLab();
    initAdminPanel();
    initCartSystem();
    checkAbandonedCartReminder();
});

window.addEventListener('resize', layoutPublicHeaderZones);

function isHomePageSection() {
    const path = window.location.pathname.toLowerCase();
    const isSubpage =
        path.includes('hombre') ||
        path.includes('mujer') ||
        path.includes('oversize') ||
        path.includes('personalizar') ||
        path.includes('admin');

    if (isSubpage) return false;

    return (
        path === '/' ||
        path === '' ||
        path.endsWith('/index.html') ||
        path === 'index.html'
    );
}

function generateFolio(prefix) {
    const randomPart = Math.floor(100000 + Math.random() * 900000);
    return `${prefix}-${randomPart}`;
}

function styleBrandLogoInHeader() {
    const isAdminPage = window.location.pathname.toLowerCase().includes('admin');
    const candidates = document.querySelectorAll('header a, header div, header span, nav a, nav div, nav span, .navbar a, .brand, .logo, h1, h2, .admin-title');

    candidates.forEach(el => {
        if (el.dataset.darecoreStyled) return;
        if (el.children.length > 0 && !el.querySelector('.brand-dare')) return;

        const rawText = (el.textContent || '').trim();

        if (/^DARECORE\s+ADMIN$/i.test(rawText)) {
            el.dataset.darecoreStyled = 'true';
            el.innerHTML = `<span class="brand-dare">DARE</span><span class="brand-core-orange">CORE</span> <span style="color:#6b7280;font-weight:800;letter-spacing:1px;">ADMIN</span>`;
            return;
        }

        if (/^DARECORE$/i.test(rawText)) {
            el.dataset.darecoreStyled = 'true';
            el.innerHTML = `<span class="brand-dare">DARE</span><span class="brand-core-red">CORE</span>`;
            if (!isAdminPage && el.closest('header, nav, .navbar, .site-header')) {
                el.dataset.darecoreLogo = 'left';
            }
        }
    });
}

function layoutPublicHeaderZones() {
    if (window.location.pathname.toLowerCase().includes('admin')) return;

    const header = document.querySelector('header');
    const navContainer = document.querySelector('header .nav-container') || header;
    if (!navContainer) return;

    if (window.innerWidth > 1024) {
        navContainer.style.setProperty('display', 'grid', 'important');
        navContainer.style.setProperty('grid-template-columns', 'auto minmax(0, 1fr) auto', 'important');
        navContainer.style.setProperty('align-items', 'center', 'important');
        navContainer.style.setProperty('width', '100%', 'important');
        navContainer.style.setProperty('max-width', '1440px', 'important');
        navContainer.style.setProperty('margin', '0 auto', 'important');
        navContainer.style.setProperty('padding', '0 24px', 'important');
        navContainer.style.setProperty('gap', '32px', 'important');

        const logo = navContainer.querySelector('.logo, a[href*="index.html"]');
        const navLinks = navContainer.querySelector('.nav-links, ul');
        const navActions = navContainer.querySelector('.nav-actions');

        if (logo) {
            logo.style.setProperty('grid-column', '1', 'important');
            logo.style.setProperty('justify-self', 'start', 'important');
            logo.style.setProperty('margin', '0', 'important');
            logo.style.setProperty('white-space', 'nowrap', 'important');
        }

        if (navLinks) {
            navLinks.style.setProperty('grid-column', '2', 'important');
            navLinks.style.setProperty('justify-self', 'center', 'important');
            navLinks.style.setProperty('display', 'flex', 'important');
            navLinks.style.setProperty('flex-direction', 'row', 'important');
            navLinks.style.setProperty('align-items', 'center', 'important');
            navLinks.style.setProperty('gap', '28px', 'important');
            navLinks.style.setProperty('list-style', 'none', 'important');
            navLinks.style.setProperty('margin', '0', 'important');
            navLinks.style.setProperty('padding', '0', 'important');
            navLinks.style.setProperty('flex-wrap', 'nowrap', 'important');

            navLinks.querySelectorAll('li').forEach(li => {
                li.style.setProperty('display', 'inline-flex', 'important');
                li.style.setProperty('align-items', 'center', 'important');
                li.style.setProperty('margin', '0', 'important');
                li.style.setProperty('padding', '0', 'important');
                li.style.setProperty('white-space', 'nowrap', 'important');
            });

            navLinks.querySelectorAll('a').forEach(a => {
                a.style.setProperty('white-space', 'nowrap', 'important');
            });
        }

        if (navActions) {
            navActions.style.setProperty('grid-column', '3', 'important');
            navActions.style.setProperty('justify-self', 'end', 'important');
            navActions.style.setProperty('display', 'flex', 'important');
            navActions.style.setProperty('flex-direction', 'row', 'important');
            navActions.style.setProperty('align-items', 'center', 'important');
            navActions.style.setProperty('gap', '12px', 'important');
            navActions.style.setProperty('margin', '0', 'important');
            navActions.style.setProperty('flex-shrink', '0', 'important');
        }
    } else {
        navContainer.style.setProperty('display', 'flex', 'important');
        navContainer.style.setProperty('flex-wrap', 'wrap', 'important');
        navContainer.style.setProperty('justify-content', 'space-between', 'important');
        navContainer.style.setProperty('gap', '12px', 'important');
        navContainer.style.setProperty('padding', '0 16px', 'important');
    }
}

function cleanExtraHeroBlocks() {
    const descTarget = 'NUESTRAS PIEZAS DE HOMBRE SON CONSTRUIDAS CON HILO OPEN-END PEINADO.';
    const extraTexts = [
        'SPOTLIGHT / DRAG RACE CLUB',
        'MONTE CARLO RACING #04',
        'DROP ACTIVO: APEX & GYM',
        'DISEÑOS DE ALTO RENDIMIENTO CON ESTÉTICA UNDERGROUND.',
        'DISENOS DE ALTO RENDIMIENTO CON ESTETICA UNDERGROUND.',
        'ALGODÓN 240G+ CON RIB GRUESO DE 3.2 CM',
        'ALGODON 240G+ CON RIB GRUESO DE 3.2 CM',
        'GRAMAJE POR PIEZA',
        'ANCHO DEL RIB DE CUELLO',
        'DEFORMACIÓN GARANTIZADA',
        'DEFORMACION GARANTIZADA',
        'ANATOMÍA DEL CORTE BOXY',
        'ANATOMIA DEL CORTE BOXY',
        'DROP SHOULDER 25 CM+',
        'SQUAT-PROOF & SEAMLESS',
        'ALTA COMPRESIÓN Y SOPORTE',
        'ALTA COMPRESION Y SOPORTE',
        'ESPECIFICACIÓN TÉCNICA',
        'ESPECIFICACION TECNICA',
        'ALGODÓN PEINADO 240G - 400G',
        'ALGODON PEINADO 240G - 400G'
    ];

    document.querySelectorAll('p, span, div, h1, h2, h3, h4, section, article').forEach(el => {
        if (el.id === 'darecoreHeroWrapper' || el.closest('#darecoreHeroWrapper')) return;
        const txt = (el.textContent || '').trim().toUpperCase();
        if (!txt) return;

        const isCottonDesc = el.children.length === 0 && (txt.includes('CONSTRUIDAS CON HILO OPEN-END PEINADO') || txt === descTarget);
        const isExtraBlockText = extraTexts.some(item => txt === item || (el.children.length === 0 && txt.includes(item)));

        if (isCottonDesc || isExtraBlockText) {
            if (el.children.length === 0) {
                el.textContent = '';
            }
            el.style.display = 'none';
            const smallContainer = el.closest('section, article, div');
            if (
                smallContainer &&
                smallContainer.id !== 'darecoreHeroWrapper' &&
                smallContainer.id !== 'productGrid' &&
                !smallContainer.classList.contains('product-grid') &&
                smallContainer.innerText.trim().length < 350
            ) {
                smallContainer.style.display = 'none';
            }
        }
    });

    const headings = Array.from(document.querySelectorAll('h2, h3, h4'));
    const columnHeads = headings.filter(h => {
        const t = (h.textContent || '').trim().toUpperCase();
        return t.includes('COLECCIONES') || t.includes('AYUDA') || t.includes('LEGAL');
    });

    if (columnHeads.length >= 2) {
        const boxes = columnHeads.map(h => h.closest('div, section, article') || h.parentElement).filter(Boolean);
        const uniqueBoxes = Array.from(new Set(boxes));

        if (uniqueBoxes.length >= 2) {
            const parent = uniqueBoxes[0].parentElement;
            if (parent && !parent.classList.contains('darecore-cinema-columns-grid')) {
                const wrapper = document.createElement('div');
                wrapper.className = 'darecore-cinema-columns-grid';
                parent.insertBefore(wrapper, uniqueBoxes[0]);

                uniqueBoxes.forEach(box => {
                    box.classList.add('darecore-cinema-column-card');
                    wrapper.appendChild(box);
                });
            }
        }
    }
}

/* ==========================================
   HERO CAROUSEL AUTOMÁTICO (SOLO INICIO)
   ========================================== */
function getHeroSlides() {
    const products = getStoredProducts().filter(p => p && p.image);
    if (products.length > 0) {
        return products.slice(0, 5).map((p, idx) => {
            const theme = CINEMA_CARD_THEMES[idx % CINEMA_CARD_THEMES.length];
            return {
                id: p.id || p.firestoreId,
                kicker: p.tag || 'DROP UNDERGROUND • EDICIÓN LIMITADA',
                title: p.name,
                desc: p.desc || 'Corte boxy heavyweight diseñado para destacar en la escena urbana.',
                watermark: (p.category || 'DARECORE').toUpperCase(),
                image: p.image,
                price: p.price,
                heroBg: theme.heroBg
            };
        });
    }

    return [
        {
            id: null,
            kicker: 'DROP 01 • HEAVYWEIGHT 280G',
            title: 'Boxy Tee Nocturne',
            desc: 'Algodón de alto gramaje con caída estructurada y estética cinematográfica oscura.',
            watermark: 'DARECORE',
            image: AVATAR_URL,
            price: 550,
            heroBg: CINEMA_CARD_THEMES[0].heroBg
        },
        {
            id: null,
            kicker: 'DARE LAB • CUSTOM STUDIO',
            title: 'Oversized Graphite',
            desc: 'Tonos carbón y silueta amplia lista para personalizar con tu propio arte.',
            watermark: 'UNDERGROUND',
            image: AVATAR_URL,
            price: 620,
            heroBg: CINEMA_CARD_THEMES[1].heroBg
        }
    ];
}

function initHeroShowcase() {
    const existingHero = document.getElementById('darecoreHeroWrapper');

    if (!isHomePageSection()) {
        clearInterval(heroAutoTimer);
        if (existingHero) existingHero.remove();
        return;
    }

    const grid = document.getElementById('productGrid') || document.querySelector('.product-grid');
    if (!grid) return;

    let heroWrapper = existingHero;
    if (!heroWrapper) {
        heroWrapper = document.createElement('section');
        heroWrapper.id = 'darecoreHeroWrapper';
        heroWrapper.className = 'darecore-hero-wrapper';
        const anchor = grid.closest('section') || grid;
        anchor.parentNode.insertBefore(heroWrapper, anchor);
    }

    renderHeroSlide(0);
    startHeroAutoPlay();
}

function renderHeroSlide(index) {
    if (!isHomePageSection()) {
        clearInterval(heroAutoTimer);
        const existingHero = document.getElementById('darecoreHeroWrapper');
        if (existingHero) existingHero.remove();
        return;
    }

    const heroWrapper = document.getElementById('darecoreHeroWrapper');
    if (!heroWrapper) return;

    const slides = getHeroSlides();
    heroSlideIndex = ((index % slides.length) + slides.length) % slides.length;
    const current = slides[heroSlideIndex];

    const dotsHtml = slides.map((_, idx) =>
        `<button type="button" class="darecore-hero-dot ${idx === heroSlideIndex ? 'active' : ''}" onclick="goToHeroSlide(${idx})" aria-label="Slide ${idx + 1}"></button>`
    ).join('');

    const ctaAction = current.id
        ? `openProductModal('${current.id}')`
        : `document.getElementById('productGrid')?.scrollIntoView({ behavior: 'smooth' })`;

    heroWrapper.innerHTML = `
        <div class="darecore-hero-stage" style="background: ${current.heroBg};">
            <div class="darecore-hero-watermark">${current.watermark}</div>
            <div class="darecore-hero-content">
                <span class="darecore-hero-kicker">${current.kicker}</span>
                <h1 class="darecore-hero-title">${current.title}</h1>
                <p class="darecore-hero-desc">${current.desc}</p>
                <div class="darecore-hero-actions">
                    <button type="button" class="darecore-hero-cta" onclick="${ctaAction}">
                        Ver prenda • $${Number(current.price || 550).toLocaleString('es-MX')} MXN
                    </button>
                </div>
            </div>
            <div class="darecore-hero-visual">
                <img src="${current.image}" alt="${current.title}">
            </div>
            <div class="darecore-hero-dots">${dotsHtml}</div>
        </div>
    `;
}

function goToHeroSlide(index) {
    renderHeroSlide(index);
    startHeroAutoPlay();
}

function startHeroAutoPlay() {
    clearInterval(heroAutoTimer);
    if (!isHomePageSection()) return;
    heroAutoTimer = setInterval(() => {
        renderHeroSlide(heroSlideIndex + 1);
    }, 4500);
}

/* ==========================================
   FRANJA SUPERIOR, TOAST VERDE Y MODAL CONFIRMACIÓN
   ========================================== */
function updateTopAnnouncementBanner() {
    const targetText = 'NUEVA COLECCIÓN DISPONIBLE • PERSONALIZA TU PRENDA IDEAL';
    const allElements = document.querySelectorAll('header *, nav *, section *, div *, p, span, a');

    allElements.forEach(el => {
        if (el.children.length === 0 && el.textContent) {
            const raw = el.textContent.trim();
            const upper = raw.toUpperCase();
            const isPromoStrip =
                upper.includes('EDICIÓN LIMITADA') ||
                upper.includes('EDICION LIMITADA') ||
                upper.includes('HECHO EN MÉXICO') ||
                upper.includes('HECHO EN MEXICO') ||
                upper.includes('NUEVA COLECCIÓN DISPONIBLE') ||
                upper.includes('NUEVA COLECCION DISPONIBLE') ||
                upper.includes('DARE LAB CUSTOM STUDIO');

            if (isPromoStrip) {
                el.textContent = targetText;
            }
        }
    });
}

function showFloatingToast(message) {
    let toast = document.getElementById('darecoreFloatingToast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'darecoreFloatingToast';
        toast.style.cssText = [
            'position: fixed',
            'top: 50%',
            'left: 50%',
            'transform: translate(-50%, -50%) scale(0.95)',
            'background: #16a34a',
            'color: #ffffff',
            'padding: 14px 26px',
            'border-radius: 999px',
            'font-size: 13px',
            'font-weight: 800',
            'letter-spacing: 0.4px',
            'box-shadow: 0 16px 36px rgba(0, 0, 0, 0.55)',
            'border: 1px solid rgba(255, 255, 255, 0.25)',
            'z-index: 99999',
            'opacity: 0',
            'pointer-events: none',
            'text-align: center',
            'max-width: 90vw',
            'transition: opacity 0.22s ease, transform 0.22s ease'
        ].join(';');
        document.body.appendChild(toast);
    }

    toast.textContent = message;
    requestAnimationFrame(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translate(-50%, -50%) scale(1)';
    });

    clearTimeout(window._darecoreToastTimer);
    window._darecoreToastTimer = setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translate(-50%, -50%) scale(0.95)';
    }, 2400);
}

function showConfirmModal(message) {
    return new Promise((resolve) => {
        let overlay = document.getElementById('darecoreConfirmModal');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'darecoreConfirmModal';
            overlay.style.cssText = [
                'display: none',
                'position: fixed',
                'inset: 0',
                'background: rgba(0, 0, 0, 0.78)',
                'backdrop-filter: blur(8px)',
                'z-index: 100000',
                'justify-content: center',
                'align-items: center',
                'padding: 20px'
            ].join(';');
            document.body.appendChild(overlay);
        }

        overlay.innerHTML = `
            <div style="background: #121216; color: #ffffff; border: 1px solid rgba(255,255,255,0.12); border-radius: 26px; padding: 28px; max-width: 400px; width: 100%; box-shadow: 0 24px 60px rgba(0, 0, 0, 0.8); text-align: center;">
                <div style="font-size: 11px; font-weight: 800; color: #9ca3af; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px;">DARECORE</div>
                <div style="font-size: 15px; font-weight: 700; color: #ffffff; line-height: 1.45; margin-bottom: 24px;">${message}</div>
                <div style="display: flex; gap: 12px; justify-content: center;">
                    <button id="darecoreConfirmAccept" type="button" style="flex: 1; background: #16a34a; color: #ffffff; border: none; padding: 12px 16px; border-radius: 999px; font-size: 13px; font-weight: 800; cursor: pointer; text-transform: uppercase;">Aceptar</button>
                    <button id="darecoreConfirmCancel" type="button" style="flex: 1; background: #dc2626; color: #ffffff; border: none; padding: 12px 16px; border-radius: 999px; font-size: 13px; font-weight: 800; cursor: pointer; text-transform: uppercase;">Cancelar</button>
                </div>
            </div>
        `;

        overlay.style.display = 'flex';

        const cleanup = (result) => {
            overlay.style.display = 'none';
            resolve(result);
        };

        document.getElementById('darecoreConfirmAccept').onclick = () => cleanup(true);
        document.getElementById('darecoreConfirmCancel').onclick = () => cleanup(false);
        overlay.onclick = (e) => {
            if (e.target === overlay) cleanup(false);
        };
    });
}

function getStatusBadgeStyle(status) {
    switch (status) {
        case 'Pago pendiente':
            return 'background: rgba(249, 115, 22, 0.18); color: #fb923c; border: 1px solid rgba(249, 115, 22, 0.45);';
        case 'En proceso':
            return 'background: rgba(255, 193, 7, 0.16); color: #ffc107; border: 1px solid rgba(255, 193, 7, 0.45);';
        case 'Listo para enviar':
            return 'background: rgba(59, 130, 246, 0.18); color: #60a5fa; border: 1px solid rgba(59, 130, 246, 0.45);';
        case 'Enviado':
            return 'background: rgba(34, 197, 94, 0.16); color: #4ade80; border: 1px solid rgba(34, 197, 94, 0.45);';
        case 'Pedido pendiente':
        default:
            return 'background: rgba(255, 59, 27, 0.16); color: #ff6b52; border: 1px solid rgba(255, 59, 27, 0.45);';
    }
}

/* ==========================================
1. GESTIÓN DE PRODUCTOS, DIFUMINADO MULTICOLOR Y TOUCH MÓVIL
   ========================================== */
function getStoredProducts() {
    if (window.db && !isSyncing) {
        isSyncing = true;
        window.db.collection('products').orderBy('id', 'desc').get().then((snapshot) => {
            if (!snapshot.empty) {
                const cloudProducts = snapshot.docs.map(doc => ({ ...doc.data(), firestoreId: doc.id }));
                localStorage.setItem('darecore_products', JSON.stringify(cloudProducts));
                if (!currentSearchTerm.trim()) {
                    initStore();
                    renderHeroSlide(heroSlideIndex);
                }
            }
        }).catch(err => console.log("Modo offline:", err))
          .finally(() => { setTimeout(() => { isSyncing = false; }, 2000); });
    }

    const local = localStorage.getItem('darecore_products');
    if (local) {
        try {
            const parsed = JSON.parse(local);
            if (Array.isArray(parsed)) return parsed;
        } catch (e) { /* fallback */ }
    }
    return [];
}

function saveProductsLocal(products) {
    localStorage.setItem('darecore_products', JSON.stringify(products));
}

function initStore() {
    const grid = document.getElementById('productGrid') || document.querySelector('.product-grid');
    if (!grid) return;

    const path = window.location.pathname.toLowerCase();
    let currentCategory = 'inicio';
    if (path.includes('hombre')) currentCategory = 'hombre';
    else if (path.includes('mujer')) currentCategory = 'mujer';
    else if (path.includes('oversize')) currentCategory = 'oversize';

    const allProducts = getStoredProducts();
    const filtered = currentCategory === 'inicio'
        ? allProducts
        : allProducts.filter(p => p.category === currentCategory || p.category === 'inicio');

    renderProducts(filtered);
}

function setupTouchPopCards() {
    const cards = document.querySelectorAll('.product-card');
    if (!cards.length) return;

    const activateCard = (targetCard) => {
        cards.forEach(c => {
            if (c !== targetCard) c.classList.remove('touch-pop-active');
        });
        if (targetCard) targetCard.classList.add('touch-pop-active');
    };

    cards.forEach(card => {
        card.addEventListener('touchstart', () => {
            activateCard(card);
        }, { passive: true });
    });

    document.addEventListener('touchmove', (e) => {
        const touch = e.touches[0];
        if (!touch) return;
        const el = document.elementFromPoint(touch.clientX, touch.clientY);
        const hoveredCard = el ? el.closest('.product-card') : null;
        if (hoveredCard) {
            activateCard(hoveredCard);
        }
    }, { passive: true });
}

function renderProducts(products) {
    const grid = document.getElementById('productGrid') || document.querySelector('.product-grid');
    if (!grid) return;

    grid.innerHTML = '';
    if (!products || products.length === 0) {
        grid.innerHTML = '<p style="color: #71717a; grid-column: 1/-1; text-align: center; padding: 48px; background: #ffffff; border-radius: 24px; border: 1.5px solid rgba(0,0,0,0.08);">No hay prendas registradas todavía. Agrega tus productos desde el Panel de Administración.</p>';
        return;
    }

    products.forEach((p, idx) => {
        const theme = CINEMA_CARD_THEMES[idx % CINEMA_CARD_THEMES.length];
        const card = document.createElement('div');
        card.className = 'product-card';
        card.style.setProperty('--dot-color', theme.dot);
        card.style.setProperty('--card-border', theme.dot);
        card.style.setProperty('--card-glow', theme.glow);
        card.style.setProperty('--card-aura', theme.bg);

        card.innerHTML = `
            <div class="product-card-top">
                <span class="product-tag">${p.tag || 'DARECORE'}</span>
                <span class="product-color-dot"></span>
            </div>
            <div class="product-img" style="background-image: url('${p.image || ''}');"></div>
            <div class="product-name">${p.name}</div>
            <div class="product-desc">${p.desc}</div>
            <div class="product-footer">
                <span class="price">$${Number(p.price).toLocaleString('es-MX')} <small style="font-weight:600; opacity:0.75;">MXN</small></span>
                <button class="btn-add" onclick="event.stopPropagation(); addToCart('${p.id || p.firestoreId}')">Agregar</button>
            </div>
        `;

        card.addEventListener('click', () => {
            openProductModal(p.id || p.firestoreId);
        });

        grid.appendChild(card);
    });

    setupTouchPopCards();
}

/* ==========================================
2. BUSCADOR GLOBAL INTELIGENTE
   ========================================== */
function setupSearch() {
    const searchInput = document.getElementById('searchInput') || document.querySelector('.search-box');
    if (!searchInput) return;

    const applyFilter = (rawValue) => {
        currentSearchTerm = (rawValue || '').toLowerCase().trim();
        const products = getStoredProducts();

        if (!currentSearchTerm) {
            initStore();
            return;
        }

        const filtered = products.filter(p =>
            (p.name && p.name.toLowerCase().includes(currentSearchTerm)) ||
            (p.desc && p.desc.toLowerCase().includes(currentSearchTerm)) ||
            (p.category && p.category.toLowerCase().includes(currentSearchTerm)) ||
            (p.tag && p.tag.toLowerCase().includes(currentSearchTerm))
        );
        renderProducts(filtered);
    };

    searchInput.addEventListener('input', (e) => applyFilter(e.target.value));
}

/* ==========================================
3. MODAL DE VISTA RÁPIDA
   ========================================== */
function openProductModal(productId) {
    const products = getStoredProducts();
    const product = products.find(p => p.id == productId || p.firestoreId == productId);
    if (!product) return;

    let modalOverlay = document.getElementById('quickViewModal');
    if (!modalOverlay) {
        modalOverlay = document.createElement('div');
        modalOverlay.id = 'quickViewModal';
        modalOverlay.style.cssText = "display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.85); backdrop-filter:blur(10px); z-index:9999; justify-content:center; align-items:center; padding:20px;";
        document.body.appendChild(modalOverlay);
    }

    modalOverlay.innerHTML = `
        <div class="product-modal-content" style="background:#121217; border:1.5px solid #ff2a00; padding:30px; border-radius:28px; max-width:680px; width:100%; position:relative; display:grid; grid-template-columns: 1fr 1fr; gap:24px; box-shadow:0 28px 70px rgba(0,0,0,0.85);">
            <button onclick="closeProductModal()" class="product-modal-close" style="position:absolute; top:14px; right:18px; background:rgba(255,255,255,0.08); border:none; color:#fff; width:34px; height:34px; border-radius:50%; font-size:20px; cursor:pointer;">&times;</button>
            <div style="background-image: url('${product.image}'); background-size: cover; background-position: center; height:300px; border-radius:20px; background-color:#1e1e24;"></div>
            <div style="display: flex; flex-direction: column; justify-content: center; color: #ffffff;">
                <span style="color: #ff2a00; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing:1px; margin-bottom: 6px;">${product.tag || 'DARECORE'}</span>
                <h2 style="font-size: 22px; font-weight: 900; margin-bottom: 10px; color: #ffffff;">${product.name}</h2>
                <p style="color: #a1a1aa; font-size: 13px; margin-bottom: 18px; line-height: 1.5;">${product.desc}</p>
                <div style="font-size: 20px; font-weight: 900; color: #ffffff; margin-bottom: 22px;">$${Number(product.price).toLocaleString('es-MX')} MXN</div>
                <button onclick="addToCart('${product.id || product.firestoreId}'); closeProductModal();" style="background:linear-gradient(135deg, #ff2a00 0%, #ff5500 100%); color:#fff; border:none; padding:14px 20px; border-radius:999px; font-weight:800; cursor:pointer; text-transform: uppercase; letter-spacing:0.5px;">Agregar al Carrito</button>
            </div>
        </div>
    `;
    modalOverlay.style.display = 'flex';
}

function closeProductModal() {
    const modalOverlay = document.getElementById('quickViewModal');
    if (modalOverlay) modalOverlay.style.display = 'none';
}

/* ==========================================
4. DARE LAB (PERSONALIZACIÓN Y COTIZACIÓN)
   ========================================== */
function getCustomBases() {
    const local = localStorage.getItem('darecore_custom_bases');
    if (local) {
        try {
            const parsed = JSON.parse(local);
            if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        } catch (e) { /* fallback */ }
    }
    return [
        { id: 'b1', name: 'Hoodie Heavyweight Oversized (380g)', price: 1150, desc: 'Algodón premium con fleece afelpado interno.' },
        { id: 'b2', name: 'Playera Boxy Fit Heavy (240G/280G)', price: 550, desc: 'Corte urbano relajado, cuello robusto.' },
        { id: 'b3', name: 'Sweater Crewneck Minimal (350g)', price: 980, desc: 'Silueta clásica estructurada.' },
        { id: 'b4', name: 'Sudadera 400G Heavyweight', price: 1250, desc: 'Doble capa sin cordón, máxima densidad.' }
    ];
}

function compressImageFile(file, maxWidth = 800, quality = 0.7) {
    return new Promise((resolve) => {
        if (!file || !file.type.startsWith('image/')) {
            resolve(null);
            return;
        }
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                if (width > maxWidth) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', quality));
            };
            img.onerror = () => resolve(null);
            img.src = event.target.result;
        };
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(file);
    });
}

function resetDareLabForm() {
    selectedCustomBaseIndex = 0;
    const fileInput = document.getElementById('customDesignFile');
    if (fileInput) fileInput.value = '';
    const notesInput = document.getElementById('customNotes');
    if (notesInput) notesInput.value = '';
    const techSelect = document.getElementById('customTechniqueSelect');
    if (techSelect) techSelect.selectedIndex = 0;
    renderCustomBasesPublic();
}

function setupDareLab() {
    const container = document.getElementById('customBasesContainer');
    if (!container) return;

    renderCustomBasesPublic();

    const techSelect = document.getElementById('customTechniqueSelect');
    if (techSelect) {
        techSelect.addEventListener('change', updateCustomSummary);
    }

    const mockupBtn = document.getElementById('requestMockupBtn');
    if (mockupBtn) {
        mockupBtn.addEventListener('click', async (e) => {
            e.preventDefault();

            const whatsappInput = document.getElementById('customWhatsapp');
            const whatsapp = whatsappInput ? whatsappInput.value.trim() : '';
            if (!whatsapp) {
                showFloatingToast('Ingresa tu WhatsApp para enviarte tu mockup');
                if (whatsappInput) whatsappInput.focus();
                return;
            }

            const bases = getCustomBases();
            const selectedBase = bases[selectedCustomBaseIndex] || bases[0];
            const techSelectElement = document.getElementById('customTechniqueSelect');
            const selectedOption = techSelectElement ? techSelectElement.options[techSelectElement.selectedIndex] : null;
            const techName = selectedOption ? selectedOption.value : 'Estándar';
            const extraCost = selectedOption ? Number(selectedOption.getAttribute('data-extra') || 0) : 0;
            const total = Number(selectedBase.price) + extraCost;

            const fileInput = document.getElementById('customDesignFile');
            const fileObj = fileInput && fileInput.files[0] ? fileInput.files[0] : null;
            const fileName = fileObj ? fileObj.name : 'Lo enviaré por chat';
            const notes = document.getElementById('customNotes')?.value.trim() || 'Sin notas adicionales';

            const currentUser = window.auth && window.auth.currentUser ? window.auth.currentUser : null;
            const orderNumber = generateFolio('PEDIDO');
            const initialStatus = 'Pago pendiente';
            const createdAt = new Date().toISOString();

            const mensaje = `Hola Dare core, me gustaría procesar el pago de mi pedido #${orderNumber}`;
            const waUrl = `https://wa.me/5214777035509?text=${encodeURIComponent(mensaje)}`;
            const waWindow = window.open('about:blank', '_blank');

            let compressedImageBase64 = '';
            if (fileObj) {
                compressedImageBase64 = (await compressImageFile(fileObj)) || '';
            }

            let docId = null;
            if (window.db) {
                try {
                    const docRef = await window.db.collection('darelab_orders').add({
                        orderNumber: orderNumber,
                        orderType: 'pedido_darelab',
                        status: initialStatus,
                        userEmail: currentUser ? currentUser.email : 'Invitado (sin sesión)',
                        userName: currentUser ? currentUser.displayName : 'Invitado',
                        whatsapp: whatsapp,
                        baseName: selectedBase.name,
                        technique: techName,
                        fileName: fileName,
                        imageData: compressedImageBase64,
                        notes: notes,
                        total: total,
                        createdAt: createdAt
                    });
                    docId = docRef.id;
                } catch (err) {
                    console.error("Error guardando solicitud de Dare Lab:", err);
                }
            }

            saveClientPendingOrder({
                id: docId || orderNumber,
                collection: 'darelab_orders',
                folio: orderNumber,
                typeLabel: 'Dare Lab',
                summary: `${selectedBase.name} (${techName})`,
                total: total,
                status: initialStatus,
                delivered: false,
                createdAt: createdAt
            });

            resetDareLabForm();
            showFloatingToast(`Solicitud #${orderNumber} agregada a Pedido pendiente`);

            if (waWindow) {
                waWindow.location.href = waUrl;
            } else {
                window.location.href = waUrl;
            }
        });
    }
}

function renderCustomBasesPublic() {
    const container = document.getElementById('customBasesContainer');
    if (!container) return;

    const bases = getCustomBases();
    container.innerHTML = '';

    bases.forEach((base, index) => {
        const isSelected = index === selectedCustomBaseIndex;
        const card = document.createElement('div');
        card.className = `option-card ${isSelected ? 'selected' : ''}`;
        card.style.cssText = `border: 1.5px solid ${isSelected ? '#ff2a00' : 'rgba(0,0,0,0.12)'}; padding: 18px; cursor: pointer; transition: all 0.22s ease; border-radius: 22px; background: #ffffff;`;

        card.innerHTML = `
            <div style="font-weight: 800; font-size: 14px; color: #0b0b0e; margin-bottom: 5px;">${base.name}</div>
            <div style="font-size: 12px; color: #52525b; margin-bottom: 10px;">${base.desc}</div>
            <div style="font-weight: 900; font-size: 15px; color: #ff2a00;">$${Number(base.price).toLocaleString('es-MX')} MXN</div>
        `;

        card.addEventListener('click', () => {
            selectedCustomBaseIndex = index;
            document.querySelectorAll('#customBasesContainer .option-card').forEach(c => {
                c.classList.remove('selected');
                c.style.borderColor = 'rgba(0,0,0,0.12)';
            });
            card.classList.add('selected');
            card.style.borderColor = '#ff2a00';
            updateCustomSummary();
        });

        container.appendChild(card);
    });

    updateCustomSummary();
}

function updateCustomSummary() {
    const bases = getCustomBases();
    const selectedBase = bases[selectedCustomBaseIndex] || bases[0];

    const techSelect = document.getElementById('customTechniqueSelect');
    if (!techSelect) return;

    const selectedOption = techSelect.options[techSelect.selectedIndex];
    const extraCost = selectedOption ? Number(selectedOption.getAttribute('data-extra') || 0) : 0;
    const totalPrice = Number(selectedBase.price) + extraCost;

    const summaryBaseName = document.getElementById('summaryBaseName');
    const summaryTechName = document.getElementById('summaryTechName');
    const summaryTotalPrice = document.getElementById('summaryTotalPrice');

    if (summaryBaseName) summaryBaseName.innerText = selectedBase.name;
    if (summaryTechName) summaryTechName.innerText = selectedOption ? selectedOption.value : '';
    if (summaryTotalPrice) summaryTotalPrice.innerText = `$${totalPrice.toLocaleString('es-MX')} MXN`;
}

/* ==========================================
5. SISTEMA DE CARRITO, ESTATUS, RECORDATORIO 24H Y PAGOS
   ========================================== */
function getClientPendingOrdersLocal() {
    try {
        const raw = localStorage.getItem('darecore_client_orders');
        const parsed = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
        return [];
    }
}

function saveClientPendingOrder(orderEntry) {
    const list = getClientPendingOrdersLocal();
    const filtered = list.filter(item => item.folio !== orderEntry.folio);
    filtered.unshift(orderEntry);
    localStorage.setItem('darecore_client_orders', JSON.stringify(filtered.slice(0, 25)));
}

async function getDeliveredFoliosSet() {
    const deliveredSet = new Set();
    if (!window.db) return deliveredSet;

    try {
        const snap = await window.db.collection('delivered_folios').get();
        snap.forEach(docSnap => {
            const data = docSnap.data();
            if (data.folio) deliveredSet.add(data.folio);
            if (data.orderId) deliveredSet.add(data.orderId);
            deliveredSet.add(docSnap.id);
        });
    } catch (err) {
        console.log("No se pudieron consultar folios entregados:", err);
    }
    return deliveredSet;
}

async function fetchClientPendingOrders() {
    const localOrders = getClientPendingOrdersLocal();
    const currentUser = window.auth && window.auth.currentUser ? window.auth.currentUser : null;
    const mergedMap = new Map();
    const deliveredSet = await getDeliveredFoliosSet();

    localOrders.forEach(item => {
        if (item && item.folio) {
            const isMarkedDelivered = Boolean(item.delivered) ||
                deliveredSet.has(item.folio) ||
                (item.id && deliveredSet.has(item.id));
            mergedMap.set(item.folio, {
                ...item,
                delivered: isMarkedDelivered
            });
        }
    });

    if (window.db) {
        await Promise.all(Array.from(mergedMap.values()).map(async (entry) => {
            if (!entry.id || !entry.collection) return;
            try {
                const docSnap = await window.db.collection(entry.collection).doc(entry.id).get();
                if (docSnap.exists) {
                    const data = docSnap.data();
                    mergedMap.set(entry.folio, {
                        ...entry,
                        delivered: false,
                        status: data.status || entry.status || 'Pago pendiente',
                        total: data.total !== undefined ? data.total : entry.total
                    });
                } else {
                    mergedMap.set(entry.folio, {
                        ...entry,
                        delivered: true
                    });
                }
            } catch (err) {
                console.log("No se pudo refrescar estatus de pedido:", err);
            }
        }));

        if (currentUser && currentUser.email) {
            try {
                const [cartSnap, labSnap, deliveredSnap] = await Promise.all([
                    window.db.collection('orders').where('userEmail', '==', currentUser.email).get(),
                    window.db.collection('darelab_orders').where('userEmail', '==', currentUser.email).get(),
                    window.db.collection('delivered_orders').where('userEmail', '==', currentUser.email).get()
                ]);

                cartSnap.forEach(docSnap => {
                    const d = docSnap.data();
                    const folio = d.purchaseNumber || docSnap.id;
                    const summaryText = Array.isArray(d.items)
                        ? d.items.map(i => `${i.qty}x ${i.name}`).join(', ')
                        : 'Compra en tienda';
                    mergedMap.set(folio, {
                        id: docSnap.id,
                        collection: 'orders',
                        folio: folio,
                        typeLabel: 'Carrito',
                        summary: summaryText,
                        total: d.total || 0,
                        status: d.status || 'Pago pendiente',
                        delivered: false,
                        createdAt: d.createdAt || ''
                    });
                });

                labSnap.forEach(docSnap => {
                    const d = docSnap.data();
                    const folio = d.orderNumber || docSnap.id;
                    mergedMap.set(folio, {
                        id: docSnap.id,
                        collection: 'darelab_orders',
                        folio: folio,
                        typeLabel: 'Dare Lab',
                        summary: `${d.baseName || 'Prenda'} (${d.technique || 'Estándar'})`,
                        total: d.total || 0,
                        status: d.status || 'Pago pendiente',
                        delivered: false,
                        createdAt: d.createdAt || ''
                    });
                });

                deliveredSnap.forEach(docSnap => {
                    const d = docSnap.data();
                    const folio = d.folio || d.purchaseNumber || d.orderNumber || docSnap.id;
                    mergedMap.set(folio, {
                        id: docSnap.id,
                        collection: 'delivered_orders',
                        folio: folio,
                        typeLabel: d.typeLabel || 'Pedido',
                        summary: d.summary || 'Pedido completado',
                        total: d.total || 0,
                        status: 'Entregado',
                        delivered: true,
                        createdAt: d.createdAt || ''
                    });
                });
            } catch (err) {
                console.log("No se pudieron sincronizar pedidos por correo:", err);
            }
        }
    }

    const combined = Array.from(mergedMap.values()).sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
    }).slice(0, 25);

    localStorage.setItem('darecore_client_orders', JSON.stringify(combined));
    return combined;
}

function syncAbandonedCartState() {
    if (cart.length === 0) {
        localStorage.removeItem('darecore_cart_updated_at');
        localStorage.removeItem('darecore_cart_reminded_24h');
        const currentUser = window.auth && window.auth.currentUser ? window.auth.currentUser : null;
        if (window.db && currentUser && currentUser.uid) {
            window.db.collection('abandoned_carts').doc(currentUser.uid).delete().catch(() => {});
        }
        return;
    }

    const nowIso = new Date().toISOString();
    localStorage.setItem('darecore_cart_updated_at', nowIso);

    const currentUser = window.auth && window.auth.currentUser ? window.auth.currentUser : null;
    if (window.db && currentUser && currentUser.email) {
        const remindAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
        window.db.collection('abandoned_carts').doc(currentUser.uid).set({
            uid: currentUser.uid,
            userName: currentUser.displayName || 'Cliente',
            userEmail: currentUser.email,
            items: cart.map(i => ({ name: i.name, qty: Number(i.qty || 1), price: Number(i.price) })),
            updatedAt: nowIso,
            remindAt: remindAt,
            storeUrl: STORE_URL,
            avatarUrl: AVATAR_URL,
            emailSubject: 'Tienes un carrito pendiente en DareCore Store',
            emailBody: `Tienes un carrito pendiente en DareCore Store. No pierdas la oportunidad de lucir con estilo a donde vayas. Visita la tienda: ${STORE_URL}`
        }, { merge: true }).catch(() => {});
    }
}

function checkAbandonedCartReminder() {
    if (cart.length === 0) return;
    const updatedAt = localStorage.getItem('darecore_cart_updated_at');
    if (!updatedAt) return;

    const elapsedMs = Date.now() - new Date(updatedAt).getTime();
    const twentyFourHoursMs = 24 * 60 * 60 * 1000;
    const alreadyReminded = localStorage.getItem('darecore_cart_reminded_24h') === 'true';

    if (elapsedMs >= twentyFourHoursMs && !alreadyReminded) {
        localStorage.setItem('darecore_cart_reminded_24h', 'true');
        const currentUser = window.auth && window.auth.currentUser ? window.auth.currentUser : null;
        if (currentUser && currentUser.email) {
            triggerAutomatedEmail({
                type: 'abandoned_cart_24h',
                recipients: [currentUser.email],
                subject: 'Tienes un carrito pendiente en DareCore Store',
                message: `Tienes un carrito pendiente en DareCore Store. No pierdas la oportunidad de lucir con estilo a donde vayas.\n\nIr a la tienda: ${STORE_URL}`
            });
        }
    }
}

async function triggerAutomatedEmail(payload) {
    if (window.db) {
        try {
            await window.db.collection('mail_queue').add({
                ...payload,
                storeUrl: STORE_URL,
                avatarUrl: AVATAR_URL,
                createdAt: new Date().toISOString(),
                status: 'queued'
            });
        } catch (err) {
            console.log("No se pudo encolar notificación:", err);
        }
    }

    if (EMAIL_WEBHOOK_URL) {
        try {
            await fetch(EMAIL_WEBHOOK_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...payload,
                    storeUrl: STORE_URL,
                    avatarUrl: AVATAR_URL
                })
            });
        } catch (err) {
            console.log("Webhook de correo no disponible:", err);
        }
    }

    const templateId = payload.type === 'abandoned_cart_24h'
        ? EMAILJS_CONFIG.abandonedCartTemplateId
        : EMAILJS_CONFIG.newProductTemplateId;

    if (EMAILJS_CONFIG.publicKey && EMAILJS_CONFIG.serviceId && templateId && Array.isArray(payload.recipients)) {
        await Promise.all(payload.recipients.map(email =>
            fetch('https://api.emailjs.com/api/v1.0/email/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    lib_version: '4.4.1',
                    user_id: EMAILJS_CONFIG.publicKey,
                    service_id: EMAILJS_CONFIG.serviceId,
                    template_id: templateId,
                    template_params: {
                        to_email: email,
                        subject: payload.subject,
                        message: payload.message,
                        product_name: payload.productName || '',
                        product_price: payload.productPrice || '',
                        store_url: STORE_URL,
                        avatar_url: AVATAR_URL
                    }
                })
            }).catch(() => {})
        ));
    }
}

function addToCart(productId) {
    const products = getStoredProducts();
    const product = products.find(p => p.id == productId || p.firestoreId == productId);
    if (!product) return;

    const existingItem = cart.find(item => (item.id == productId || item.firestoreId == productId));
    if (existingItem) {
        existingItem.qty += 1;
    } else {
        cart.push({ ...product, qty: 1 });
    }

    saveCart();
    updateCartUI();
    showFloatingToast(`"${product.name}" agregado al carrito`);
}

function changeCartQty(index, delta) {
    if (!cart[index]) return;
    const nextQty = Number(cart[index].qty || 1) + delta;
    if (nextQty <= 0) {
        cart.splice(index, 1);
    } else {
        cart[index].qty = nextQty;
    }
    saveCart();
    updateCartUI();
    openCartModal('cart');
}

function saveCart() {
    localStorage.setItem('darecore_cart', JSON.stringify(cart));
    syncAbandonedCartState();
}

function updateCartUI() {
    const badges = document.querySelectorAll('.cart-badge');
    const totalCount = cart.reduce((sum, item) => sum + Number(item.qty || 1), 0);
    badges.forEach(b => b.innerText = totalCount);
}

function initCartSystem() {
    updateCartUI();

    const cartBtns = document.querySelectorAll('.cart-btn');
    cartBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            openCartModal(activeCartTab);
        });
    });
}

function switchCartTab(tabName) {
    activeCartTab = tabName;
    openCartModal(tabName);
}

async function openCartModal(tab = activeCartTab) {
    activeCartTab = tab;

    let modalOverlay = document.getElementById('cartModalOverlay');
    if (!modalOverlay) {
        modalOverlay = document.createElement('div');
        modalOverlay.id = 'cartModalOverlay';
        modalOverlay.style.cssText = "display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.85); backdrop-filter:blur(8px); z-index:9999; justify-content:flex-end; align-items:stretch;";
        document.body.appendChild(modalOverlay);
    }

    const pendingOrders = await fetchClientPendingOrders();
    const subtotal = cart.reduce((sum, item) => sum + (Number(item.price) * Number(item.qty || 1)), 0);

    const cartTabStyle = activeCartTab === 'cart'
        ? 'background:#ff2a00; color:#fff; border:1px solid #ff2a00;'
        : 'background:#1a1a20; color:#bbb; border:1px solid rgba(255,255,255,0.1);';

    const pendingTabStyle = activeCartTab === 'pending'
        ? 'background:#ff2a00; color:#fff; border:1px solid #ff2a00;'
        : 'background:#1a1a20; color:#bbb; border:1px solid rgba(255,255,255,0.1);';

    let bodyContentHtml = '';

    if (activeCartTab === 'cart') {
        if (cart.length === 0) {
            bodyContentHtml = '<p style="color:#9ca3af; text-align:center; padding:40px 15px;">Tu carrito está vacío. Agrega prendas o revisa la pestaña <strong>Pedido pendiente</strong>.</p>';
        } else {
            bodyContentHtml = cart.map((item, idx) => {
                const qty = Number(item.qty || 1);
                const lineTotal = Number(item.price) * qty;
                return `
                    <div style="display:flex; gap:12px; align-items:center; background:#18181e; padding:12px; border-radius:20px; margin-bottom:10px; border:1px solid rgba(255,255,255,0.08);">
                        <img src="${item.image || ''}" style="width:56px; height:56px; object-fit:cover; border-radius:14px; background:#24242c;">
                        <div style="flex-grow:1; min-width:0;">
                            <div style="font-weight:700; font-size:13px; color:#fff; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${item.name}</div>
                            <div style="font-size:11px; color:#9ca3af;">$${Number(item.price).toLocaleString('es-MX')} MXN c/u • <strong style="color:#fff;">$${lineTotal.toLocaleString('es-MX')} MXN</strong></div>
                            <div style="display:flex; align-items:center; gap:8px; margin-top:6px;">
                                <button onclick="changeCartQty(${idx}, -1)" style="background:#26262e; color:#fff; border:1px solid rgba(255,255,255,0.14); width:26px; height:26px; cursor:pointer; font-weight:800; border-radius:50%;">-</button>
                                <span style="color:#fff; font-size:12px; font-weight:800; min-width:18px; text-align:center;">${qty}</span>
                                <button onclick="changeCartQty(${idx}, 1)" style="background:#26262e; color:#fff; border:1px solid rgba(255,255,255,0.14); width:26px; height:26px; cursor:pointer; font-weight:800; border-radius:50%;" title="Agregar otra pieza igual">+</button>
                            </div>
                        </div>
                        <button onclick="removeFromCart(${idx})" style="background:none; border:none; color:#ff2a00; cursor:pointer; font-size:20px; padding:0 6px;" title="Quitar prenda">&times;</button>
                    </div>
                `;
            }).join('');
        }
    } else {
        if (pendingOrders.length === 0) {
            bodyContentHtml = '<p style="color:#9ca3af; text-align:center; padding:40px 15px;">Aún no tienes pedidos registrados aquí. Al procesar tu pago aparecerán con su estatus.</p>';
        } else {
            bodyContentHtml = pendingOrders.map((ord) => {
                const isDelivered = Boolean(ord.delivered);
                const currentStatus = ord.status || 'Pago pendiente';
                const badgeStyle = isDelivered
                    ? 'background: rgba(148, 163, 184, 0.16); color: #cbd5e1; border: 1px solid rgba(148, 163, 184, 0.4);'
                    : getStatusBadgeStyle(currentStatus);

                const strikeStyle = isDelivered ? 'text-decoration: line-through; opacity: 0.65;' : '';
                const cardBorderStyle = isDelivered
                    ? 'background:#141418; border:1px solid rgba(255,255,255,0.08); opacity:0.88;'
                    : 'background:#18181e; border:1px solid rgba(255,255,255,0.1);';

                const deliveredBannerHtml = isDelivered
                    ? `<div style="margin-top:8px; padding:6px 12px; border-radius:999px; background:rgba(34, 197, 94, 0.12); color:#86efac; font-size:11px; font-weight:800; letter-spacing:0.3px;">ESTE PEDIDO YA TE FUE ENTREGADO</div>`
                    : '';

                return `
                    <div style="${cardBorderStyle} padding:14px; border-radius:20px; margin-bottom:10px;">
                        <div style="display:flex; justify-content:space-between; align-items:center; gap:8px; margin-bottom:6px;">
                            <span style="color:#fff; font-weight:800; font-size:12px; ${strikeStyle}">#${ord.folio}</span>
                            <span style="font-size:10px; font-weight:800; padding:3px 10px; border-radius:999px; ${badgeStyle}">${isDelivered ? 'Entregado' : currentStatus}</span>
                        </div>
                        <div style="color:#bbb; font-size:11px; margin-bottom:6px; ${strikeStyle}">${ord.summary || ord.typeLabel || 'Pedido DARECORE'}</div>
                        <div style="display:flex; justify-content:space-between; align-items:center; font-size:11px; color:#888; ${strikeStyle}">
                            <span>${ord.typeLabel || 'Tienda'}</span>
                            <strong style="color:#ff2a00; font-size:12px;">$${Number(ord.total || 0).toLocaleString('es-MX')} MXN</strong>
                        </div>
                        ${deliveredBannerHtml}
                    </div>
                `;
            }).join('');
        }
    }

    const footerHtml = activeCartTab === 'cart'
        ? `
            <div style="border-top:1px solid rgba(255,255,255,0.08); padding-top:15px; margin-bottom:15px; display:flex; justify-content:space-between; color:#fff; font-weight:800; font-size:16px;">
                <span>Subtotal a Pagar:</span>
                <span style="color:#ff2a00;">$${subtotal.toLocaleString('es-MX')} MXN</span>
            </div>
            <button onclick="checkoutCart()" style="background:linear-gradient(135deg, #ff2a00 0%, #ff5500 100%); color:#fff; border:none; border-radius:999px; width:100%; padding:13px; font-weight:800; cursor:pointer; text-transform:uppercase; margin-bottom:10px;">Proceder al Pago</button>
            <button onclick="openGoogleAuthModal()" style="background:#fff; color:#111; border:none; border-radius:999px; width:100%; padding:11px; font-weight:800; cursor:pointer; font-size:12px;">Iniciar Sesión con Google</button>
        `
        : `
            <div style="border-top:1px solid rgba(255,255,255,0.08); padding-top:12px; display:flex; flex-direction:column; gap:8px;">
                <button onclick="openCartModal('pending')" style="background:#222228; color:#fff; border:1px solid rgba(255,255,255,0.12); border-radius:999px; width:100%; padding:11px; font-weight:800; cursor:pointer; font-size:12px;">Actualizar Estatus</button>
                <button onclick="switchCartTab('cart')" style="background:linear-gradient(135deg, #ff2a00 0%, #ff5500 100%); color:#fff; border:none; border-radius:999px; width:100%; padding:12px; font-weight:800; cursor:pointer; font-size:12px; text-transform:uppercase;">Seguir Comprando</button>
            </div>
        `;

    modalOverlay.innerHTML = `
        <div style="background:#111115; width:420px; max-width:100%; padding:26px; border-top-left-radius:28px; border-bottom-left-radius:28px; display:flex; flex-direction:column; justify-content:space-between; box-shadow: -8px 0 30px rgba(0,0,0,0.65);">
            <div>
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; border-bottom:1px solid rgba(255,255,255,0.08); padding-bottom:12px;">
                    <h3 style="color:#fff; font-size:16px; margin:0; font-weight:900;">CARRITO DE COMPRAS</h3>
                    <button onclick="closeCartModal()" style="background:rgba(255,255,255,0.08); border:none; color:#fff; width:32px; height:32px; border-radius:50%; font-size:20px; cursor:pointer;">&times;</button>
                </div>

                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:8px; margin-bottom:16px;">
                    <button onclick="switchCartTab('cart')" style="padding:9px; font-size:11px; font-weight:800; cursor:pointer; border-radius:999px; text-transform:uppercase; ${cartTabStyle}">Carrito (${cart.reduce((s, i) => s + Number(i.qty || 1), 0)})</button>
                    <button onclick="switchCartTab('pending')" style="padding:9px; font-size:11px; font-weight:800; cursor:pointer; border-radius:999px; text-transform:uppercase; ${pendingTabStyle}">Pedido pendiente (${pendingOrders.length})</button>
                </div>

                <div style="max-height:52vh; overflow-y:auto;">
                    ${bodyContentHtml}
                </div>
            </div>
            <div>
                ${footerHtml}
            </div>
        </div>
    `;
    modalOverlay.style.display = 'flex';
}

function closeCartModal() {
    const modalOverlay = document.getElementById('cartModalOverlay');
    if (modalOverlay) modalOverlay.style.display = 'none';
}

function removeFromCart(index) {
    cart.splice(index, 1);
    saveCart();
    updateCartUI();
    openCartModal('cart');
}

async function checkoutCart() {
    if (cart.length === 0) {
        showFloatingToast('Tu carrito está vacío');
        return;
    }

    const purchaseNumber = generateFolio('COMPRA');
    const subtotal = cart.reduce((sum, item) => sum + (Number(item.price) * Number(item.qty || 1)), 0);
    const currentUser = window.auth && window.auth.currentUser ? window.auth.currentUser : null;
    const initialStatus = 'Pago pendiente';
    const createdAt = new Date().toISOString();

    const mensaje = `Hola Dare core, me gustaría procesar el pago de mi pedido #${purchaseNumber}`;
    const waUrl = `https://wa.me/5214777035509?text=${encodeURIComponent(mensaje)}`;
    const waWindow = window.open('about:blank', '_blank');

    const cleanItems = cart.map(item => ({
        id: item.id || item.firestoreId || '',
        name: item.name,
        price: Number(item.price),
        qty: Number(item.qty || 1)
    }));

    let docId = null;
    if (window.db) {
        try {
            const docRef = await window.db.collection('orders').add({
                purchaseNumber: purchaseNumber,
                orderType: 'compra_carrito',
                status: initialStatus,
                userEmail: currentUser ? currentUser.email : 'Invitado (sin sesión)',
                userName: currentUser ? currentUser.displayName : 'Invitado',
                items: cleanItems,
                total: subtotal,
                createdAt: createdAt
            });
            docId = docRef.id;
        } catch (err) {
            console.error("Error guardando compra:", err);
        }
    }

    const summaryText = cleanItems.map(i => `${i.qty}x ${i.name}`).join(', ');
    saveClientPendingOrder({
        id: docId || purchaseNumber,
        collection: 'orders',
        folio: purchaseNumber,
        typeLabel: 'Carrito',
        summary: summaryText,
        total: subtotal,
        status: initialStatus,
        delivered: false,
        createdAt: createdAt
    });

    cart = [];
    saveCart();
    updateCartUI();
    openCartModal('pending');

    if (waWindow) {
        waWindow.location.href = waUrl;
    } else {
        window.location.href = waUrl;
    }
}

function openGoogleAuthModal() {
    if (!window.auth) {
        showFloatingToast('Firebase Auth no está inicializado');
        return;
    }

    const provider = new firebase.auth.GoogleAuthProvider();
    provider.setCustomParameters({
        'prompt': 'select_account'
    });

    window.auth.signInWithPopup(provider)
        .then(async (result) => {
            const user = result.user;

            if (window.db && user) {
                await window.db.collection('users').doc(user.uid).set({
                    uid: user.uid,
                    name: user.displayName || 'Sin nombre',
                    email: user.email || '',
                    photoURL: user.photoURL || '',
                    lastLogin: new Date().toISOString()
                }, { merge: true }).catch(err => console.error("Error guardando usuario:", err));
            }

            syncAbandonedCartState();
            await fetchClientPendingOrders();

            showFloatingToast(`Bienvenido, ${user.displayName || user.email}`);
            openCartModal('pending');
        }).catch((error) => {
            console.error("Error en autenticación con Google:", error.message);
            showFloatingToast('Error al iniciar sesión con Google');
        });
}

/* ==========================================
6. PANEL DE ADMINISTRACIÓN
   ========================================== */
function initAdminPanel() {
    const loginForm = document.getElementById('loginForm');
    if (!loginForm) return;

    const loginSection = document.getElementById('loginSection');
    const dashboardSection = document.getElementById('dashboardSection');
    const logoutBtn = document.getElementById('logoutBtn');

    const bootDashboard = () => {
        ensureDeliveredOrdersSection();
        loadAdminProducts();
        loadAdminCustomBases();
        loadAdminUsers();
        loadAdminDareLabOrders();
        loadAdminOrders();
        loadAdminDeliveredOrders();
    };

    if (localStorage.getItem('darecore_admin_logged') === 'true') {
        if (loginSection) loginSection.classList.add('hidden');
        if (dashboardSection) dashboardSection.classList.remove('hidden');
        if (logoutBtn) logoutBtn.classList.remove('hidden');
        bootDashboard();
    }

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const user = document.getElementById('adminUser').value.trim();
        const pass = document.getElementById('adminPass').value.trim();
        const errorMsg = document.getElementById('loginError');

        if ((user === 'admin' || user === 'admin@darecore.mx') && pass === 'darecore2026') {
            localStorage.setItem('darecore_admin_logged', 'true');
            if (loginSection) loginSection.classList.add('hidden');
            if (dashboardSection) dashboardSection.classList.remove('hidden');
            if (logoutBtn) logoutBtn.classList.remove('hidden');
            bootDashboard();
        } else {
            if (errorMsg) errorMsg.style.display = 'block';
        }
    });

    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('darecore_admin_logged');
            window.location.reload();
        });
    }

    const addProductForm = document.getElementById('addProductForm');
    if (addProductForm) {
        addProductForm.addEventListener('submit', handleProductSubmit);
    }
}

function ensureDeliveredOrdersSection() {
    if (document.getElementById('adminDeliveredList')) return;

    const dareLabContainer = document.getElementById('adminDareLabList');
    const ordersContainer = document.getElementById('adminOrdersList');
    const anchorCard = (dareLabContainer && dareLabContainer.closest('.admin-card')) ||
                       (ordersContainer && ordersContainer.closest('.admin-card')) ||
                       document.getElementById('dashboardSection');

    if (!anchorCard) return;

    const section = document.createElement('div');
    section.className = 'admin-card';
    section.style.cssText = 'margin-top: 24px; background: #ffffff; border: 1.5px solid rgba(0,0,0,0.1); border-radius: 24px; padding: 24px;';
    section.innerHTML = `
        <h3 style="margin: 0 0 6px 0; font-size: 16px; font-weight: 900; color: #16a34a; text-transform: uppercase;">
            PEDIDOS ENTREGADOS (<span id="deliveredCount">0</span>)
        </h3>
        <p style="margin: 0 0 16px 0; font-size: 12px; color: #52525b;">
            Historial de compras y pedidos Dare Lab entregados. Haz clic en cualquier tarjeta para ver especificaciones completas.
        </p>
        <div id="adminDeliveredList" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px;"></div>
    `;

    if (anchorCard.id === 'dashboardSection') {
        anchorCard.appendChild(section);
    } else {
        anchorCard.insertAdjacentElement('afterend', section);
    }
}

function openAdminOrderDetailModal(orderData) {
    let modal = document.getElementById('adminOrderDetailModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'adminOrderDetailModal';
        modal.style.cssText = 'display:none; position:fixed; inset:0; background:rgba(0,0,0,0.88); backdrop-filter:blur(8px); z-index:99999; justify-content:center; align-items:center; padding:20px;';
        document.body.appendChild(modal);
    }

    const itemsHtml = Array.isArray(orderData.items) && orderData.items.length > 0
        ? `<ul style="list-style:none; padding:0; margin:0; display:flex; flex-direction:column; gap:8px;">
            ${orderData.items.map(i => `
                <li style="background:#18181e; border:1px solid rgba(255,255,255,0.08); padding:10px 14px; border-radius:16px; display:flex; justify-content:space-between; align-items:center;">
                    <span style="color:#fff; font-size:13px;"><strong>${i.qty}x</strong> ${i.name}</span>
                    <span style="color:#ff2a00; font-weight:800; font-size:13px;">$${(Number(i.price) * Number(i.qty || 1)).toLocaleString('es-MX')} MXN</span>
                </li>
            `).join('')}
           </ul>`
        : `<div style="background:#18181e; border:1px solid rgba(255,255,255,0.08); padding:14px; border-radius:18px; color:#ddd; font-size:13px; line-height:1.5;">
            <div><strong>Prenda base:</strong> ${orderData.baseName || orderData.summary || 'N/A'}</div>
            ${orderData.technique ? `<div><strong>Técnica:</strong> ${orderData.technique}</div>` : ''}
            ${orderData.notes ? `<div><strong>Notas del cliente:</strong> ${orderData.notes}</div>` : ''}
           </div>`;

    const imageBlock = orderData.imageData
        ? `<div style="margin-bottom:14px; text-align:center; background:#16161b; padding:12px; border-radius:20px; border:1px solid rgba(255,255,255,0.08);">
            <img src="${orderData.imageData}" style="max-width:100%; max-height:260px; object-fit:contain; border-radius:14px;">
            <div style="margin-top:8px;">
                <a href="${orderData.imageData}" download="${orderData.fileName || 'diseno-darecore.jpg'}" style="color:#60a5fa; font-size:12px; font-weight:700; text-decoration:underline;">Descargar archivo adjunto</a>
            </div>
           </div>`
        : '';

    modal.innerHTML = `
        <div style="background:#111115; border:1.5px solid #ff2a00; border-radius:28px; max-width:600px; width:100%; max-height:90vh; overflow-y:auto; padding:28px; position:relative; color:#fff;">
            <button onclick="document.getElementById('adminOrderDetailModal').style.display='none'" style="position:absolute; top:16px; right:18px; background:rgba(255,255,255,0.08); border:none; color:#fff; width:34px; height:34px; border-radius:50%; font-size:20px; cursor:pointer;">&times;</button>
            <div style="font-size:11px; font-weight:800; color:#ff2a00; text-transform:uppercase; margin-bottom:4px;">${orderData.typeLabel || 'PEDIDO DARECORE'}</div>
            <h2 style="margin:0 0 14px 0; font-size:22px; font-weight:900;">#${orderData.folio}</h2>

            ${imageBlock}

            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; background:#16161b; padding:14px; border-radius:20px; border:1px solid rgba(255,255,255,0.08); margin-bottom:16px; font-size:12px;">
                <div><span style="color:#888;">Cliente:</span><br><strong>${orderData.userName || 'Invitado'}</strong></div>
                <div><span style="color:#888;">Correo:</span><br><strong>${orderData.userEmail || 'Sin correo'}</strong></div>
                <div><span style="color:#888;">WhatsApp:</span><br><strong>${orderData.whatsapp || 'No registrado'}</strong></div>
                <div><span style="color:#888;">Estatus:</span><br><strong style="color:#4ade80;">${orderData.status || 'Pago pendiente'}</strong></div>
            </div>

            <div style="font-size:11px; font-weight:800; color:#aaa; text-transform:uppercase; margin-bottom:8px;">Especificaciones del pedido</div>
            ${itemsHtml}

            <div style="margin-top:18px; padding-top:14px; border-top:1px solid rgba(255,255,255,0.08); display:flex; justify-content:space-between; align-items:center;">
                <span style="font-size:14px; color:#bbb; font-weight:700;">Total Cobrado:</span>
                <span style="font-size:22px; color:#ff2a00; font-weight:900;">$${Number(orderData.total || 0).toLocaleString('es-MX')} MXN</span>
            </div>
        </div>
    `;
    modal.style.display = 'flex';
}

function renderStatusSelectHtml(collectionName, docId, currentStatus) {
    const active = currentStatus || 'Pago pendiente';
    const optionsHtml = ORDER_STATUSES.map(st =>
        `<option value="${st}" ${st === active ? 'selected' : ''}>${st}</option>`
    ).join('');

    return `
        <div style="margin-top: 4px;" onclick="event.stopPropagation();">
            <label style="font-size: 10px; color: #52525b; display: block; margin-bottom: 4px; text-transform: uppercase; font-weight: 700;">Estatus del pedido:</label>
            <select onchange="updateOrderStatus('${collectionName}', '${docId}', this.value)" style="width: 100%; background: #ffffff; color: #0b0b0e; border: 1.5px solid #d4d4d8; padding: 8px 12px; border-radius: 14px; font-size: 12px; cursor: pointer;">
                ${optionsHtml}
            </select>
        </div>
    `;
}

function updateOrderStatus(collectionName, docId, newStatus) {
    if (!window.db || !docId) return;

    window.db.collection(collectionName).doc(docId).update({
        status: newStatus,
        updatedAt: new Date().toISOString()
    }).then(() => {
        const localOrders = getClientPendingOrdersLocal();
        const nextLocal = localOrders.map(item =>
            item.id === docId ? { ...item, status: newStatus } : item
        );
        localStorage.setItem('darecore_client_orders', JSON.stringify(nextLocal));

        if (collectionName === 'orders') loadAdminOrders();
        if (collectionName === 'darelab_orders') loadAdminDareLabOrders();
    }).catch(err => console.error("Error actualizando estatus:", err));
}

async function archiveOrderAsDelivered(collectionName, docId) {
    if (!window.db || !docId) return;
    try {
        const snap = await window.db.collection(collectionName).doc(docId).get();
        if (!snap.exists) return;

        const d = snap.data();
        const folio = d.purchaseNumber || d.orderNumber || docId;
        const typeLabel = collectionName === 'darelab_orders' ? 'Dare Lab' : 'Carrito';
        const summary = collectionName === 'darelab_orders'
            ? `${d.baseName || 'Prenda'} (${d.technique || 'Estándar'})`
            : (Array.isArray(d.items) ? d.items.map(i => `${i.qty}x ${i.name}`).join(', ') : 'Compra en tienda');

        await Promise.all([
            window.db.collection('delivered_orders').doc(docId).set({
                ...d,
                originalId: docId,
                originalCollection: collectionName,
                folio: folio,
                typeLabel: typeLabel,
                summary: summary,
                status: 'Entregado',
                deliveredAt: new Date().toISOString()
            }),
            window.db.collection('delivered_folios').doc(docId).set({
                orderId: docId,
                folio: folio,
                collection: collectionName,
                deliveredAt: new Date().toISOString()
            }, { merge: true })
        ]);

        await window.db.collection(collectionName).doc(docId).delete();
    } catch (err) {
        console.error("Error moviendo pedido a entregados:", err);
    }
}

function loadAdminProducts() {
    const container = document.getElementById('adminProductList');
    const countSpan = document.getElementById('totalCount');
    if (!container) return;

    const products = getStoredProducts();
    if (countSpan) countSpan.innerText = products.length;

    container.innerHTML = '';
    products.forEach((p) => {
        const item = document.createElement('div');
        item.className = 'product-item-admin';
        item.style.cssText = 'display:flex; align-items:center; gap:12px; margin-bottom:10px;';

        item.innerHTML = `
            <img src="${p.image || ''}" alt="${p.name}" style="width:52px; height:52px; object-fit:cover;">
            <div style="flex-grow: 1; color: #0b0b0e;">
                <div style="font-weight: 700; font-size: 13px;">${p.name}</div>
                <div style="font-size: 11px; color: #52525b;">${p.category || 'general'} | $${p.price} MXN</div>
            </div>
            <div style="display: flex; gap: 8px;">
                <button type="button" class="btn-primary" style="padding: 7px 14px; font-size: 11px;" onclick="editProduct('${p.id || p.firestoreId}')">Editar</button>
                <button type="button" class="btn-delete" style="padding: 7px 14px; font-size: 11px;" onclick="deleteProduct('${p.id || p.firestoreId}')">Eliminar</button>
            </div>
        `;
        container.appendChild(item);
    });
}

async function notifyUsersAboutNewProduct(product) {
    if (!window.db) return;
    try {
        const snapshot = await window.db.collection('users').get();
        const emails = [];
        snapshot.forEach(doc => {
            const u = doc.data();
            if (u.email && !emails.includes(u.email)) {
                emails.push(u.email);
            }
        });

        await triggerAutomatedEmail({
            type: 'new_product_published',
            recipients: emails,
            productName: product.name,
            productPrice: product.price,
            subject: `Nuevo drop en DareCore: ${product.name}`,
            message: `Acabamos de publicar "${product.name}" ($${Number(product.price).toLocaleString('es-MX')} MXN) en DareCore Store. Entra ahora antes de que se agote.\n\nVer tienda: ${STORE_URL}`
        });
    } catch (err) {
        console.error("Error enviando correos de nuevo producto:", err);
    }
}

function handleProductSubmit(e) {
    e.preventDefault();
    const editingId = document.getElementById('editingProductId')?.value;
    const name = document.getElementById('prodName').value;
    const category = document.getElementById('prodCategory').value;
    const tag = document.getElementById('prodTag').value;
    const desc = document.getElementById('prodDesc').value;
    const price = Number(document.getElementById('prodPrice').value);
    const imageFile = document.getElementById('prodImageFile').files[0];

    let products = getStoredProducts();

    const saveProductData = (imgUrl) => {
        if (editingId) {
            products = products.map(p => {
                if (p.id == editingId || p.firestoreId == editingId) {
                    const updated = { ...p, name, category, tag, desc, price, image: imgUrl || p.image };
                    if (window.db && p.firestoreId) {
                        window.db.collection('products').doc(p.firestoreId).update({ name, category, tag, desc, price, image: imgUrl || p.image }).catch(err => console.log(err));
                    }
                    return updated;
                }
                return p;
            });
            showFloatingToast(`"${name}" se actualizó exitosamente`);
        } else {
            const newId = 'prod_' + Date.now();
            const newProduct = {
                id: newId,
                category,
                tag,
                name,
                desc,
                price,
                image: imgUrl || ''
            };
            products.unshift(newProduct);

            if (window.db) {
                window.db.collection('products').add(newProduct).then(docRef => {
                    newProduct.firestoreId = docRef.id;
                    saveProductsLocal(products);
                    loadAdminProducts();
                    initStore();
                    renderHeroSlide(0);
                }).catch(err => console.log(err));
            }

            notifyUsersAboutNewProduct(newProduct);
            showFloatingToast(`"${name}" se publicó exitosamente`);
        }

        saveProductsLocal(products);
        document.getElementById('addProductForm').reset();

        const editingInput = document.getElementById('editingProductId');
        if (editingInput) editingInput.value = '';
        const formTitle = document.getElementById('formTitle');
        if (formTitle) formTitle.innerText = '+ NUEVA PRENDA';
        const submitBtn = document.getElementById('submitBtn');
        if (submitBtn) submitBtn.innerText = 'PUBLICAR EN TIENDA';
        const cancelEditBtn = document.getElementById('cancelEditBtn');
        if (cancelEditBtn) cancelEditBtn.classList.add('hidden');

        loadAdminProducts();
        initStore();
        renderHeroSlide(0);
    };

    if (imageFile) {
        const reader = new FileReader();
        reader.onload = function(event) {
            saveProductData(event.target.result);
        };
        reader.readAsDataURL(imageFile);
    } else {
        if (editingId) {
            const existing = products.find(p => p.id == editingId || p.firestoreId == editingId);
            saveProductData(existing ? existing.image : null);
        } else {
            saveProductData('');
        }
    }
}

function editProduct(productId) {
    const products = getStoredProducts();
    const product = products.find(p => p.id == productId || p.firestoreId == productId);
    if (!product) return;

    document.getElementById('editingProductId').value = product.id || product.firestoreId;
    document.getElementById('prodCategory').value = product.category || 'inicio';
    document.getElementById('prodTag').value = product.tag || '';
    document.getElementById('prodName').value = product.name || '';
    document.getElementById('prodDesc').value = product.desc || '';
    document.getElementById('prodPrice').value = product.price || '';

    const formTitle = document.getElementById('formTitle');
    if (formTitle) formTitle.innerText = 'EDITAR PRENDA';
    const submitBtn = document.getElementById('submitBtn');
    if (submitBtn) submitBtn.innerText = 'GUARDAR CAMBIOS';
    const cancelEditBtn = document.getElementById('cancelEditBtn');
    if (cancelEditBtn) cancelEditBtn.classList.remove('hidden');

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function deleteProduct(productId) {
    const confirmed = await showConfirmModal('¿Estás seguro de eliminar esta prenda?');
    if (!confirmed) return;

    let products = getStoredProducts();
    const target = products.find(p => p.id == productId || p.firestoreId == productId);
    products = products.filter(p => p.id != productId && p.firestoreId != productId);
    saveProductsLocal(products);

    if (window.db && target && target.firestoreId) {
        window.db.collection('products').doc(target.firestoreId).delete().catch(err => console.log(err));
    }

    loadAdminProducts();
    initStore();
    renderHeroSlide(0);
    showFloatingToast('Prenda eliminada correctamente');
}

function loadAdminCustomBases() {
    const container = document.getElementById('adminCustomBasesList');
    if (!container) return;

    const bases = getCustomBases();
    container.innerHTML = '';

    bases.forEach((base, index) => {
        const box = document.createElement('div');
        box.style.cssText = "background: #ffffff; border: 1.5px solid rgba(0,0,0,0.1); padding: 16px; border-radius: 22px;";
        box.innerHTML = `
            <div style="margin-bottom: 8px;">
                <label style="font-size: 10px; color: #52525b; display: block; margin-bottom:4px; font-weight:700;">NOMBRE BASE</label>
                <input type="text" id="baseName_${index}" value="${base.name}" class="form-control" style="font-size: 12px;">
            </div>
            <div style="margin-bottom: 10px;">
                <label style="font-size: 10px; color: #52525b; display: block; margin-bottom:4px; font-weight:700;">PRECIO (MXN)</label>
                <input type="number" id="basePrice_${index}" value="${base.price}" class="form-control" style="font-size: 12px;">
            </div>
            <button type="button" class="btn-primary" style="padding: 8px 14px; font-size: 11px; width: 100%;" onclick="updateCustomBaseItem(${index})">Guardar Cambios</button>
        `;
        container.appendChild(box);
    });
}

function updateCustomBaseItem(index) {
    const bases = getCustomBases();
    const nameInput = document.getElementById(`baseName_${index}`);
    const priceInput = document.getElementById(`basePrice_${index}`);

    if (nameInput && priceInput) {
        bases[index].name = nameInput.value;
        bases[index].price = Number(priceInput.value);
        localStorage.setItem('darecore_custom_bases', JSON.stringify(bases));

        if (window.db) {
            window.db.collection('settings').doc('customBases').set({ items: bases }).catch(err => console.log(err));
        }

        showFloatingToast('Base personalizada actualizada');
        loadAdminCustomBases();
    }
}

function loadAdminUsers() {
    const container = document.getElementById('adminUsersList');
    const countSpan = document.getElementById('usersCount');
    if (!container || !window.db) return;

    window.db.collection('users').orderBy('lastLogin', 'desc').get().then((snapshot) => {
        if (countSpan) countSpan.innerText = snapshot.size;
        container.innerHTML = '';

        if (snapshot.empty) {
            container.innerHTML = '<p style="color: #52525b; font-size: 12px;">Aún no hay usuarios registrados.</p>';
            return;
        }

        snapshot.forEach((doc) => {
            const u = doc.data();
            const row = document.createElement('div');
            row.style.cssText = "display: flex; align-items: center; gap: 12px; background: #ffffff; border: 1.5px solid rgba(0,0,0,0.1); padding: 12px 16px; border-radius: 20px;";
            row.innerHTML = `
                <img src="${u.photoURL || 'https://via.placeholder.com/40'}" style="width: 38px; height: 38px; border-radius: 50%; object-fit: cover;">
                <div style="flex-grow: 1;">
                    <div style="color: #0b0b0e; font-weight: 700; font-size: 13px;">${u.name || 'Usuario'}</div>
                    <div style="color: #52525b; font-size: 11px;">${u.email}</div>
                </div>
                <div style="color: #71717a; font-size: 10px;">${u.lastLogin ? new Date(u.lastLogin).toLocaleDateString('es-MX') : ''}</div>
            `;
            container.appendChild(row);
        });
    }).catch(err => console.error("Error cargando usuarios:", err));
}

function loadAdminDareLabOrders() {
    const container = document.getElementById('adminDareLabList');
    const countSpan = document.getElementById('dareLabCount');
    if (!container || !window.db) return;

    window.db.collection('darelab_orders').orderBy('createdAt', 'desc').get().then((snapshot) => {
        if (countSpan) countSpan.innerText = snapshot.size;
        container.innerHTML = '';

        if (snapshot.empty) {
            container.innerHTML = '<p style="color: #52525b; font-size: 12px;">No hay solicitudes personalizadas todavía.</p>';
            return;
        }

        snapshot.forEach((doc) => {
            const order = doc.data();
            const status = order.status || 'Pago pendiente';
            const badgeStyle = getStatusBadgeStyle(status);
            const folio = order.orderNumber || doc.id;

            const card = document.createElement('div');
            card.style.cssText = "background: #ffffff; border: 1.5px solid rgba(0,0,0,0.1); padding: 16px; border-radius: 24px; display: flex; flex-direction: column; gap: 8px; cursor: pointer; color: #0b0b0e;";

            const imgHtml = order.imageData
                ? `<a href="${order.imageData}" download="${order.fileName || 'diseno-darelab.jpg'}" onclick="event.stopPropagation();" title="Clic para descargar imagen">
                     <img src="${order.imageData}" style="width: 100%; height: 180px; object-fit: contain; background: #f4f4f5; border-radius: 16px; cursor: pointer;">
                   </a>`
                : `<div style="height: 80px; background: #f4f4f5; border-radius: 16px; display: flex; align-items: center; justify-content: center; color: #52525b; font-size: 11px;">Sin imagen adjunta</div>`;

            const cleanPhone = (order.whatsapp || '').replace(/\D/g, '');
            const waClientLink = cleanPhone
                ? `<a href="https://wa.me/${cleanPhone.length === 10 ? '521' + cleanPhone : cleanPhone}" target="_blank" onclick="event.stopPropagation();" style="color: #16a34a; font-weight: 700; text-decoration: underline;">${order.whatsapp}</a>`
                : `<span style="color: #52525b;">${order.whatsapp || 'No proporcionado'}</span>`;

            card.innerHTML = `
                ${imgHtml}
                <div style="display:flex; justify-content:space-between; align-items:center; gap:6px;">
                    <span style="color: #ff2a00; font-size: 11px; font-weight: 800;">#${folio}</span>
                    <span style="font-size: 10px; font-weight: 800; padding: 3px 10px; border-radius: 999px; ${badgeStyle}">${status}</span>
                </div>
                <div style="color: #0b0b0e; font-size: 13px; font-weight: 700;">${order.baseName}</div>
                <div style="color: #0b0b0e; font-size: 12px;"><strong>Cliente:</strong> ${order.userName} (${order.userEmail})</div>
                <div style="color: #0b0b0e; font-size: 12px;"><strong>WhatsApp:</strong> ${waClientLink}</div>
                <div style="color: #52525b; font-size: 11px;"><strong>Técnica:</strong> ${order.technique} | <strong>Total:</strong> $${Number(order.total).toLocaleString('es-MX')} MXN</div>
                <div style="color: #52525b; font-size: 11px;"><strong>Notas:</strong> ${order.notes}</div>
                ${renderStatusSelectHtml('darelab_orders', doc.id, status)}
                <button type="button" class="btn-delete" style="margin-top: auto; width: 100%;" onclick="event.stopPropagation(); deleteDareLabOrder('${doc.id}')">Marcar Entregado / Archivar</button>
            `;

            card.addEventListener('click', () => {
                openAdminOrderDetailModal({
                    folio,
                    typeLabel: 'Solicitud Dare Lab',
                    userName: order.userName,
                    userEmail: order.userEmail,
                    whatsapp: order.whatsapp,
                    status,
                    baseName: order.baseName,
                    technique: order.technique,
                    notes: order.notes,
                    imageData: order.imageData,
                    fileName: order.fileName,
                    total: order.total
                });
            });

            container.appendChild(card);
        });
    }).catch(err => console.error("Error cargando solicitudes Dare Lab:", err));
}

async function deleteDareLabOrder(docId) {
    const confirmed = await showConfirmModal('¿Mover esta solicitud a Pedidos Entregados?');
    if (!confirmed) return;
    await archiveOrderAsDelivered('darelab_orders', docId);
    showFloatingToast('Pedido movido a Pedidos Entregados');
    loadAdminDareLabOrders();
    loadAdminDeliveredOrders();
}

function loadAdminOrders() {
    const container = document.getElementById('adminOrdersList');
    const countSpan = document.getElementById('ordersCount');
    if (!container || !window.db) return;

    window.db.collection('orders').orderBy('createdAt', 'desc').get().then((snapshot) => {
        if (countSpan) countSpan.innerText = snapshot.size;
        container.innerHTML = '';

        if (snapshot.empty) {
            container.innerHTML = '<p style="color: #52525b; font-size: 12px;">Aún no hay compras registradas desde el carrito.</p>';
            return;
        }

        snapshot.forEach((doc) => {
            const order = doc.data();
            const status = order.status || 'Pago pendiente';
            const badgeStyle = getStatusBadgeStyle(status);
            const folio = order.purchaseNumber || doc.id;

            const itemsList = Array.isArray(order.items) && order.items.length > 0
                ? order.items.map(item => `
                    <li style="margin-bottom: 4px; color: #0b0b0e;">
                        <strong>${item.qty}x</strong> ${item.name} — <span style="color: #52525b;">$${Number(item.price).toLocaleString('es-MX')} MXN c/u</span>
                    </li>
                  `).join('')
                : '<li style="color: #52525b;">Sin detalle de prendas</li>';

            const dateText = order.createdAt ? new Date(order.createdAt).toLocaleString('es-MX') : '';

            const card = document.createElement('div');
            card.style.cssText = "background: #ffffff; border: 1.5px solid rgba(0,0,0,0.1); padding: 16px; border-radius: 24px; display: flex; flex-direction: column; gap: 8px; cursor: pointer; color: #0b0b0e;";
            card.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; gap: 8px;">
                    <span style="color: #ff2a00; font-size: 12px; font-weight: 800;">#${folio}</span>
                    <span style="font-size: 10px; font-weight: 800; padding: 3px 10px; border-radius: 999px; ${badgeStyle}">${status}</span>
                </div>
                <div style="color: #71717a; font-size: 10px;">${dateText}</div>
                <div style="color: #0b0b0e; font-size: 12px;"><strong>Cliente:</strong> ${order.userName || 'Invitado'} (${order.userEmail || 'Sin correo'})</div>
                <div style="background: #f4f4f5; border: 1px solid rgba(0,0,0,0.08); padding: 12px; border-radius: 16px;">
                    <div style="color: #52525b; font-size: 11px; font-weight: 700; margin-bottom: 6px; text-transform: uppercase;">Prendas solicitadas:</div>
                    <ul style="list-style: none; padding: 0; margin: 0; font-size: 12px;">
                        ${itemsList}
                    </ul>
                </div>
                <div style="color: #0b0b0e; font-size: 13px; font-weight: 800; margin-top: 2px;">
                    Total: <span style="color: #ff2a00;">$${Number(order.total || 0).toLocaleString('es-MX')} MXN</span>
                </div>
                ${renderStatusSelectHtml('orders', doc.id, status)}
                <button type="button" class="btn-delete" style="margin-top: auto; width: 100%;" onclick="event.stopPropagation(); deleteAdminOrder('${doc.id}')">Marcar Entregado / Archivar</button>
            `;

            card.addEventListener('click', () => {
                openAdminOrderDetailModal({
                    folio,
                    typeLabel: 'Compra en Tienda',
                    userName: order.userName,
                    userEmail: order.userEmail,
                    status,
                    items: order.items,
                    total: order.total
                });
            });

            container.appendChild(card);
        });
    }).catch(err => console.error("Error cargando compras del carrito:", err));
}

async function deleteAdminOrder(docId) {
    const confirmed = await showConfirmModal('¿Mover esta compra a Pedidos Entregados?');
    if (!confirmed) return;
    await archiveOrderAsDelivered('orders', docId);
    showFloatingToast('Pedido movido a Pedidos Entregados');
    loadAdminOrders();
    loadAdminDeliveredOrders();
}

function loadAdminDeliveredOrders() {
    ensureDeliveredOrdersSection();
    const container = document.getElementById('adminDeliveredList');
    const countSpan = document.getElementById('deliveredCount');
    if (!container || !window.db) return;

    window.db.collection('delivered_orders').orderBy('deliveredAt', 'desc').get().then((snapshot) => {
        if (countSpan) countSpan.innerText = snapshot.size;
        container.innerHTML = '';

        if (snapshot.empty) {
            container.innerHTML = '<p style="color: #52525b; font-size: 12px;">Aún no hay pedidos archivados en entregados.</p>';
            return;
        }

        snapshot.forEach((doc) => {
            const order = doc.data();
            const folio = order.folio || order.purchaseNumber || order.orderNumber || doc.id;
            const dateText = order.deliveredAt ? new Date(order.deliveredAt).toLocaleString('es-MX') : '';

            const card = document.createElement('div');
            card.style.cssText = "background: #ffffff; border: 1.5px solid rgba(22, 163, 74, 0.35); padding: 16px; border-radius: 24px; display: flex; flex-direction: column; gap: 6px; cursor: pointer; color: #0b0b0e;";
            card.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; gap: 8px;">
                    <span style="color: #16a34a; font-size: 12px; font-weight: 800;">#${folio}</span>
                    <span style="font-size: 10px; font-weight: 800; padding: 3px 10px; border-radius: 999px; background: rgba(22, 163, 74, 0.14); color: #15803d; border: 1px solid rgba(22, 163, 74, 0.35);">Entregado</span>
                </div>
                <div style="color: #71717a; font-size: 10px;">Entregado el: ${dateText}</div>
                <div style="color: #0b0b0e; font-size: 12px;"><strong>Cliente:</strong> ${order.userName || 'Invitado'} (${order.userEmail || 'Sin correo'})</div>
                <div style="color: #52525b; font-size: 11px;">${order.summary || ''}</div>
                <div style="color: #0b0b0e; font-size: 13px; font-weight: 800; margin-top: 4px;">
                    Cobrado: <span style="color: #16a34a;">$${Number(order.total || 0).toLocaleString('es-MX')} MXN</span>
                </div>
                <div style="color: #2563eb; font-size: 10px; font-weight: 700; margin-top: 4px;">Clic para ver especificaciones completas</div>
            `;

            card.addEventListener('click', () => {
                openAdminOrderDetailModal({
                    folio,
                    typeLabel: `${order.typeLabel || 'Pedido'} (Entregado)`,
                    userName: order.userName,
                    userEmail: order.userEmail,
                    whatsapp: order.whatsapp,
                    status: 'Entregado',
                    items: order.items,
                    baseName: order.baseName,
                    technique: order.technique,
                    notes: order.notes,
                    imageData: order.imageData,
                    fileName: order.fileName,
                    summary: order.summary,
                    total: order.total
                });
            });

            container.appendChild(card);
        });
    }).catch(err => console.error("Error cargando pedidos entregados:", err));
}
