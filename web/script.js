/* ==========================================
   DARECORE - SCRIPT MAESTRO COMPLETO
   ========================================== */

let selectedCustomBaseIndex = 0;
let selectedGender = 'hombre';
let selectedSizeLabel = 'M';
let selectedChestSize = 'M';
let selectedWaistSize = 'M';
let selectedLengthSize = 'M';

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

function bootDarecoreApp() {
    if (window.__darecoreBooted) {
        setupDareLab();
        initAdminPanel();
        return;
    }
    window.__darecoreBooted = true;

    initHeroShowcase();
    initStore();
    setupSearch();
    setupDareLab();
    initAdminPanel();
    initCartSystem();
    checkAbandonedCartReminder();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootDarecoreApp);
} else {
    bootDarecoreApp();
}

function isHomePageSection() {
    const path = window.location.pathname.toLowerCase();
    const isSubpage =
        path.includes('hombre') ||
        path.includes('mujer') ||
        path.includes('oversize') ||
        path.includes('personalizar') ||
        path.includes('admin');

    if (isSubpage) return false;
    return path === '/' || path === '' || path.endsWith('/index.html') || path === 'index.html';
}

function generateFolio(prefix) {
    const randomPart = Math.floor(100000 + Math.random() * 900000);
    return `${prefix}-${randomPart}`;
}

/* ==========================================
   TOAST Y MODAL DE CONFIRMACIÓN
   ========================================== */
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
   HERO SHOWCASE (SOLO INDEX)
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
        }
    ];
}

function initHeroShowcase() {
    if (!isHomePageSection()) return;
    const grid = document.getElementById('productGrid') || document.querySelector('.product-grid');
    if (!grid) return;

    let heroWrapper = document.getElementById('darecoreHeroWrapper');
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
    if (!isHomePageSection()) return;
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
   TIENDA Y PRODUCTOS
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

function renderProducts(products) {
    const grid = document.getElementById('productGrid') || document.querySelector('.product-grid');
    if (!grid) return;

    grid.innerHTML = '';
    if (!products || products.length === 0) {
        grid.innerHTML = '<p style="color: #71717a; grid-column: 1/-1; text-align: center; padding: 48px;">No hay prendas registradas todavía. Agrega tus productos desde el Panel de Administración.</p>';
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
}

function setupSearch() {
    const searchInput = document.getElementById('searchInput') || document.querySelector('.search-box');
    if (!searchInput) return;

    searchInput.addEventListener('input', (e) => {
        currentSearchTerm = (e.target.value || '').toLowerCase().trim();
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
    });
}

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
        <div class="product-modal-content" style="background:#121217; border:1.5px solid #ff2a00; padding:30px; border-radius:28px; max-width:680px; width:100%; position:relative; display:grid; grid-template-columns: repeat(auto-fit, minmax(230px, 1fr)); gap:24px; box-shadow:0 28px 70px rgba(0,0,0,0.85);">
            <button onclick="closeProductModal()" class="product-modal-close" style="position:absolute; top:14px; right:18px; background:rgba(255,255,255,0.08); border:none; color:#fff; width:34px; height:34px; border-radius:50%; font-size:20px; cursor:pointer;">&times;</button>
            <div style="background-image: url('${product.image}'); background-size: cover; background-position: center; height:280px; border-radius:20px; background-color:#1e1e24;"></div>
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
   DARE LAB - PERSONALIZAR PRENDA
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
        { id: 'b1', name: 'BOXY TEE 240G', price: 580, desc: 'Camisa / playera algodón peinado pesado', garmentType: 'camisa' },
        { id: 'b2', name: 'HEAVY HOODIE 400G', price: 1099, desc: 'Sudadera / hoodie felpa francesa alto gramaje', garmentType: 'sudadera' },
        { id: 'b3', name: 'VARSITY JACKET BORDADA', price: 1750, desc: 'Chamarra de equipo', garmentType: 'sudadera' },
        { id: 'b4', name: 'TOP DEPORTIVO SEAMLESS', price: 460, desc: 'Top / licra compresión gym', garmentType: 'top' }
    ];
}

function getSelectedMixSummaryText() {
    if (selectedChestSize === selectedWaistSize && selectedWaistSize === selectedLengthSize) {
        return selectedChestSize;
    }
    return `Pecho ${selectedChestSize} / Cintura ${selectedWaistSize} / Largo ${selectedLengthSize}`;
}

function getSelectOptionInfo(selectEl) {
    if (!selectEl || !selectEl.options || selectEl.selectedIndex < 0) {
        return { label: '', extra: 0 };
    }
    const opt = selectEl.options[selectEl.selectedIndex];
    const rawText = (opt.textContent || opt.value || '').trim();
    const attrExtra = opt.getAttribute('data-extra') ?? opt.getAttribute('data-price') ?? opt.dataset?.extra ?? opt.dataset?.price;

    let extra = 0;
    if (attrExtra !== null && attrExtra !== undefined && String(attrExtra).trim() !== '') {
        extra = Number(String(attrExtra).replace(/[^0-9.-]/g, ''));
        if (!Number.isFinite(extra)) extra = 0;
    } else {
        const match = rawText.match(/\+\s*\$?\s*([0-9]+(?:\.[0-9]+)?)/);
        if (match) {
            extra = Number(match[1]) || 0;
        }
    }

    const cleanLabel = (opt.value || rawText.replace(/\(\s*\+[^)]*\)/g, '') || rawText).trim();
    return { label: cleanLabel, extra };
}

function getTechniqueSelectionData() {
    const techSelect = document.getElementById('customTechniqueSelect');
    const placementSelect = document.getElementById('customPlacementSelect');

    const techInfo = getSelectOptionInfo(techSelect);
    const placementInfo = getSelectOptionInfo(placementSelect);

    const parts = [techInfo.label, placementInfo.label].filter(Boolean);
    return {
        label: parts.length > 0 ? parts.join(' • ') : 'Estándar',
        extra: (Number(techInfo.extra) || 0) + (Number(placementInfo.extra) || 0)
    };
}

function updateCustomSummary() {
    const bases = getCustomBases();
    const selectedBase = bases[selectedCustomBaseIndex] || bases[0];
    const basePrice = Number(selectedBase ? selectedBase.price : 0) || 0;

    const { label: techLabel, extra: extraCost } = getTechniqueSelectionData();
    const totalPrice = basePrice + extraCost;

    const summaryBaseName = document.getElementById('summaryBaseName');
    const summaryTechName = document.getElementById('summaryTechName');
    const summaryTotalPrice = document.getElementById('summaryTotalPrice');

    if (summaryBaseName && selectedBase) {
        summaryBaseName.textContent = selectedBase.name;
    }
    if (summaryTechName) {
        summaryTechName.textContent = techLabel;
    }
    if (summaryTotalPrice) {
        summaryTotalPrice.textContent = `$${totalPrice.toLocaleString('es-MX')} MXN`;
    }
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
    const baseSelect = document.getElementById('customBaseSelect');
    if (baseSelect) baseSelect.value = '0';

    const techSelect = document.getElementById('customTechniqueSelect');
    if (techSelect) techSelect.selectedIndex = 0;

    const placementSelect = document.getElementById('customPlacementSelect');
    if (placementSelect) placementSelect.selectedIndex = 0;

    const fileInput = document.getElementById('customDesignFile');
    if (fileInput) fileInput.value = '';

    const notesInput = document.getElementById('customNotes');
    if (notesInput) notesInput.value = '';

    renderCustomBasesPublic();
    updateCustomSummary();
}

async function handleMockupRequestSubmit(e) {
    if (e) e.preventDefault();

    const whatsappInput = document.getElementById('customWhatsapp');
    const whatsapp = whatsappInput ? whatsappInput.value.trim() : '';

    if (!whatsapp) {
        showFloatingToast('Ingresa tu número de WhatsApp para solicitar tu mockup');
        if (whatsappInput) whatsappInput.focus();
        return;
    }

    const bases = getCustomBases();
    const selectedBase = bases[selectedCustomBaseIndex] || bases[0];
    const { label: techName, extra: extraCost } = getTechniqueSelectionData();
    const total = (Number(selectedBase ? selectedBase.price : 0) || 0) + extraCost;

    const fileInput = document.getElementById('customDesignFile');
    const fileObj = fileInput && fileInput.files && fileInput.files[0] ? fileInput.files[0] : null;
    const fileName = fileObj ? fileObj.name : 'Lo enviaré por chat';
    const rawNotes = document.getElementById('customNotes')?.value.trim() || '';
    const mixText = getSelectedMixSummaryText();
    const notes = rawNotes ? `Talla: ${mixText} — ${rawNotes}` : `Talla: ${mixText}`;

    const currentUser = window.auth && window.auth.currentUser ? window.auth.currentUser : null;
    const orderNumber = generateFolio('PEDIDO');
    const initialStatus = 'Pago pendiente';
    const createdAt = new Date().toISOString();

    const mensaje = `Hola Dare core, me gustaría solicitar mi mockup digital y procesar el pago de mi pedido #${orderNumber} (${selectedBase.name}, ${techName}, WhatsApp: ${whatsapp})`;
    const waUrl = `https://wa.me/5214777035509?text=${encodeURIComponent(mensaje)}`;

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
                size: mixText,
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
    showFloatingToast(`Solicitud #${orderNumber} registrada. Abriendo WhatsApp...`);

    const opened = window.open(waUrl, '_blank', 'noopener,noreferrer');
    if (!opened) {
        window.location.href = waUrl;
    }
}

function renderCustomBasesPublic() {
    const container = document.getElementById('customBasesContainer');
    if (!container) return;

    const bases = getCustomBases();
    if (selectedCustomBaseIndex >= bases.length) {
        selectedCustomBaseIndex = 0;
    }

    container.innerHTML = bases.map((base, index) => `
        <div class="option-card ${index === selectedCustomBaseIndex ? 'selected' : ''}" data-base-index="${index}">
            <div style="font-weight: 800; font-size: 13px; margin-bottom: 4px;">${base.name}</div>
            <div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 8px;">${base.desc || ''}</div>
            <div style="font-weight: 800; font-size: 14px; color: var(--accent-color);">$${Number(base.price).toLocaleString('es-MX')} MXN</div>
        </div>
    `).join('');

    container.querySelectorAll('.option-card').forEach(card => {
        card.addEventListener('click', () => {
            selectedCustomBaseIndex = Number(card.getAttribute('data-base-index')) || 0;
            renderCustomBasesPublic();
            updateCustomSummary();
        });
    });
}

function setupDareLab() {
    const techSelect = document.getElementById('customTechniqueSelect');
    const placementSelect = document.getElementById('customPlacementSelect');
    const mockupBtn = document.getElementById('requestMockupBtn');
    const basesContainer = document.getElementById('customBasesContainer');

    if (!techSelect && !placementSelect && !mockupBtn && !basesContainer) return;

    if (basesContainer) {
        renderCustomBasesPublic();
    }

    [techSelect, placementSelect].forEach(sel => {
        if (sel && !sel.dataset.darelabBound) {
            sel.dataset.darelabBound = 'true';
            sel.addEventListener('change', updateCustomSummary);
            sel.addEventListener('input', updateCustomSummary);
        }
    });

    if (mockupBtn && !mockupBtn.dataset.darelabClickBound) {
        mockupBtn.dataset.darelabClickBound = 'true';
        mockupBtn.addEventListener('click', handleMockupRequestSubmit);
    }

    updateCustomSummary();
}

/* ==========================================
   CARRITO DE COMPRAS
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

    localStorage.setItem('darecore_cart', JSON.stringify(cart));
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
    localStorage.setItem('darecore_cart', JSON.stringify(cart));
    updateCartUI();
    openCartModal('cart');
}

function removeFromCart(index) {
    cart.splice(index, 1);
    localStorage.setItem('darecore_cart', JSON.stringify(cart));
    updateCartUI();
    openCartModal('cart');
}

function updateCartUI() {
    const badges = document.querySelectorAll('.cart-badge');
    const totalCount = cart.reduce((sum, item) => sum + Number(item.qty || 1), 0);
    badges.forEach(b => b.innerText = totalCount);
}

function initCartSystem() {
    updateCartUI();
    document.querySelectorAll('.cart-btn').forEach(btn => {
        if (!btn.dataset.cartBound) {
            btn.dataset.cartBound = 'true';
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                openCartModal(activeCartTab);
            });
        }
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

    const pendingOrders = getClientPendingOrdersLocal();
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
                                <button onclick="changeCartQty(${idx}, 1)" style="background:#26262e; color:#fff; border:1px solid rgba(255,255,255,0.14); width:26px; height:26px; cursor:pointer; font-weight:800; border-radius:50%;">+</button>
                            </div>
                        </div>
                        <button onclick="removeFromCart(${idx})" style="background:none; border:none; color:#ff2a00; cursor:pointer; font-size:20px; padding:0 6px;">&times;</button>
                    </div>
                `;
            }).join('');
        }
    } else {
        if (pendingOrders.length === 0) {
            bodyContentHtml = '<p style="color:#9ca3af; text-align:center; padding:40px 15px;">Aún no tienes pedidos registrados aquí.</p>';
        } else {
            bodyContentHtml = pendingOrders.map((ord) => {
                const badgeStyle = getStatusBadgeStyle(ord.status || 'Pago pendiente');
                return `
                    <div style="background:#18181e; border:1px solid rgba(255,255,255,0.1); padding:14px; border-radius:20px; margin-bottom:10px;">
                        <div style="display:flex; justify-content:space-between; align-items:center; gap:8px; margin-bottom:6px;">
                            <span style="color:#fff; font-weight:800; font-size:12px;">#${ord.folio}</span>
                            <span style="font-size:10px; font-weight:800; padding:3px 10px; border-radius:999px; ${badgeStyle}">${ord.status || 'Pago pendiente'}</span>
                        </div>
                        <div style="color:#bbb; font-size:11px; margin-bottom:6px;">${ord.summary || 'Pedido DARECORE'}</div>
                        <div style="display:flex; justify-content:space-between; align-items:center; font-size:11px; color:#888;">
                            <span>${ord.typeLabel || 'Tienda'}</span>
                            <strong style="color:#ff2a00; font-size:12px;">$${Number(ord.total || 0).toLocaleString('es-MX')} MXN</strong>
                        </div>
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
        `
        : `
            <button onclick="switchCartTab('cart')" style="background:linear-gradient(135deg, #ff2a00 0%, #ff5500 100%); color:#fff; border:none; border-radius:999px; width:100%; padding:12px; font-weight:800; cursor:pointer; font-size:12px; text-transform:uppercase;">Seguir Comprando</button>
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
            <div>${footerHtml}</div>
        </div>
    `;
    modalOverlay.style.display = 'flex';
}

function closeCartModal() {
    const modalOverlay = document.getElementById('cartModalOverlay');
    if (modalOverlay) modalOverlay.style.display = 'none';
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
    localStorage.setItem('darecore_cart', JSON.stringify(cart));
    updateCartUI();
    openCartModal('pending');

    const opened = window.open(waUrl, '_blank', 'noopener,noreferrer');
    if (!opened) {
        window.location.href = waUrl;
    }
}

function checkAbandonedCartReminder() {}

/* ==========================================
   PANEL DE ADMINISTRACIÓN (admin.html)
   ========================================== */
function showAdminDashboardView() {
    const loginSection = document.getElementById('loginSection');
    const dashboardSection = document.getElementById('dashboardSection');
    const logoutBtn = document.getElementById('logoutBtn');

    if (loginSection) {
        loginSection.classList.add('hidden');
        loginSection.style.display = 'none';
    }
    if (dashboardSection) {
        dashboardSection.classList.remove('hidden');
        dashboardSection.style.display = 'block';
    }
    if (logoutBtn) {
        logoutBtn.classList.remove('hidden');
        logoutBtn.style.display = 'inline-block';
    }

    loadAdminProducts();
    loadAdminCustomBases();
    loadAdminOrders();
    loadAdminDareLabOrders();
    loadAdminUsers();
}

function initAdminPanel() {
    const loginForm = document.getElementById('loginForm');
    if (!loginForm) return;

    const logoutBtn = document.getElementById('logoutBtn');

    if (localStorage.getItem('darecore_admin_logged') === 'true') {
        showAdminDashboardView();
    }

    if (!loginForm.dataset.adminLoginBound) {
        loginForm.dataset.adminLoginBound = 'true';
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const user = (document.getElementById('adminUser')?.value || '').trim();
            const pass = (document.getElementById('adminPass')?.value || '').trim();
            const errorMsg = document.getElementById('loginError');

            if ((user === 'admin' || user === 'admin@darecore.mx') && pass === 'darecore2026') {
                localStorage.setItem('darecore_admin_logged', 'true');
                if (errorMsg) errorMsg.style.display = 'none';
                showAdminDashboardView();
            } else {
                if (errorMsg) errorMsg.style.display = 'block';
            }
        });
    }

    if (logoutBtn && !logoutBtn.dataset.logoutBound) {
        logoutBtn.dataset.logoutBound = 'true';
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('darecore_admin_logged');
            window.location.reload();
        });
    }

    const addProductForm = document.getElementById('addProductForm');
    if (addProductForm && !addProductForm.dataset.prodFormBound) {
        addProductForm.dataset.prodFormBound = 'true';
        addProductForm.addEventListener('submit', handleProductSubmit);
    }

    const cancelEditBtn = document.getElementById('cancelEditBtn');
    if (cancelEditBtn && !cancelEditBtn.dataset.cancelEditBound) {
        cancelEditBtn.dataset.cancelEditBound = 'true';
        cancelEditBtn.addEventListener('click', () => {
            document.getElementById('addProductForm')?.reset();
            const editingInput = document.getElementById('editingProductId');
            if (editingInput) editingInput.value = '';
            const formTitle = document.getElementById('formTitle');
            if (formTitle) formTitle.innerText = '+ NUEVA PRENDA';
            const submitBtn = document.getElementById('submitBtn');
            if (submitBtn) submitBtn.innerText = 'PUBLICAR EN TIENDA';
            cancelEditBtn.classList.add('hidden');
        });
    }
}

function loadAdminProducts() {
    const container = document.getElementById('adminProductList');
    const countSpan = document.getElementById('totalCount');
    if (!container) return;

    const products = getStoredProducts();
    if (countSpan) countSpan.innerText = products.length;

    container.innerHTML = '';
    if (products.length === 0) {
        container.innerHTML = '<p style="color: var(--text-secondary); font-size: 12px;">Aún no hay prendas publicadas.</p>';
        return;
    }

    products.forEach((p) => {
        const item = document.createElement('div');
        item.className = 'product-item-admin';
        item.innerHTML = `
            <img src="${p.image || ''}" alt="${p.name}">
            <div style="flex-grow: 1;">
                <div style="font-weight: 700; font-size: 13px;">${p.name}</div>
                <div style="font-size: 11px; color: var(--text-secondary);">${p.category || 'inicio'} | $${Number(p.price).toLocaleString('es-MX')} MXN</div>
            </div>
            <div style="display: flex; gap: 8px;">
                <button type="button" class="btn-primary" style="padding: 6px 12px; font-size: 11px;" onclick="editProduct('${p.id || p.firestoreId}')">Editar</button>
                <button type="button" class="btn-delete" onclick="deleteProduct('${p.id || p.firestoreId}')">Eliminar</button>
            </div>
        `;
        container.appendChild(item);
    });
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
            showFloatingToast(`"${name}" actualizada`);
        } else {
            const newId = 'prod_' + Date.now();
            const newProduct = { id: newId, category, tag, name, desc, price, image: imgUrl || '' };
            products.unshift(newProduct);

            if (window.db) {
                window.db.collection('products').add(newProduct).then(docRef => {
                    newProduct.firestoreId = docRef.id;
                    saveProductsLocal(products);
                    loadAdminProducts();
                }).catch(err => console.log(err));
            }
            showFloatingToast(`"${name}" publicada en tienda`);
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
    };

    if (imageFile) {
        const reader = new FileReader();
        reader.onload = (event) => saveProductData(event.target.result);
        reader.readAsDataURL(imageFile);
    } else if (editingId) {
        const existing = products.find(p => p.id == editingId || p.firestoreId == editingId);
        saveProductData(existing ? existing.image : '');
    } else {
        saveProductData('');
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
    showFloatingToast('Prenda eliminada');
}

function persistCustomBases(bases) {
    localStorage.setItem('darecore_custom_bases', JSON.stringify(bases));
    if (window.db) {
        window.db.collection('settings').doc('customBases').set({ items: bases }).catch(err => console.log(err));
    }
}

function loadAdminCustomBases() {
    const container = document.getElementById('adminCustomBasesList');
    if (!container) return;

    const bases = getCustomBases();
    container.innerHTML = '';

    bases.forEach((base, index) => {
        const box = document.createElement('div');
        box.style.cssText = "background: #0b0b0b; border: 1px solid var(--border-color); padding: 15px;";
        box.innerHTML = `
            <div class="form-group">
                <label>Nombre Base</label>
                <input type="text" id="baseName_${index}" value="${base.name}" class="form-control">
            </div>
            <div class="form-group">
                <label>Descripción / Gramaje</label>
                <input type="text" id="baseDesc_${index}" value="${base.desc || ''}" class="form-control">
            </div>
            <div class="form-group">
                <label>Precio (MXN)</label>
                <input type="number" id="basePrice_${index}" value="${base.price}" class="form-control">
            </div>
            <button type="button" class="btn-primary" style="width: 100%; font-size: 11px;" onclick="updateCustomBaseItem(${index})">Guardar Base</button>
        `;
        container.appendChild(box);
    });
}

function updateCustomBaseItem(index) {
    const bases = getCustomBases();
    const nameInput = document.getElementById(`baseName_${index}`);
    const descInput = document.getElementById(`baseDesc_${index}`);
    const priceInput = document.getElementById(`basePrice_${index}`);

    if (nameInput && priceInput) {
        bases[index].name = nameInput.value;
        if (descInput) bases[index].desc = descInput.value;
        bases[index].price = Number(priceInput.value);
        persistCustomBases(bases);
        showFloatingToast('Base actualizada');
        loadAdminCustomBases();
    }
}

function renderStatusSelectHtml(collectionName, docId, currentStatus) {
    const active = currentStatus || 'Pago pendiente';
    const optionsHtml = ORDER_STATUSES.map(st =>
        `<option value="${st}" ${st === active ? 'selected' : ''}>${st}</option>`
    ).join('');

    return `
        <div style="margin-top: 6px;">
            <label style="font-size: 10px; color: var(--text-secondary); display: block; margin-bottom: 4px; text-transform: uppercase;">Estatus:</label>
            <select onchange="updateOrderStatus('${collectionName}', '${docId}', this.value)" class="form-control" style="padding: 7px; font-size: 12px;">
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
        showFloatingToast(`Estatus actualizado: ${newStatus}`);
    }).catch(err => console.error("Error actualizando estatus:", err));
}

function loadAdminOrders() {
    const container = document.getElementById('adminOrdersList');
    const countSpan = document.getElementById('ordersCount');
    if (!container || !window.db) return;

    window.db.collection('orders').orderBy('createdAt', 'desc').get().then((snapshot) => {
        if (countSpan) countSpan.innerText = snapshot.size;
        container.innerHTML = '';

        if (snapshot.empty) {
            container.innerHTML = '<p style="color: var(--text-secondary); font-size: 12px;">Aún no hay compras registradas desde el carrito.</p>';
            return;
        }

        snapshot.forEach((doc) => {
            const order = doc.data();
            const status = order.status || 'Pago pendiente';
            const badgeStyle = getStatusBadgeStyle(status);
            const folio = order.purchaseNumber || doc.id;

            const itemsList = Array.isArray(order.items)
                ? order.items.map(i => `<li><strong>${i.qty}x</strong> ${i.name} ($${Number(i.price).toLocaleString('es-MX')} MXN)</li>`).join('')
                : '<li>Sin detalle</li>';

            const card = document.createElement('div');
            card.style.cssText = "background: #0b0b0b; border: 1px solid var(--border-color); padding: 15px; display: flex; flex-direction: column; gap: 8px;";
            card.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <span style="color: var(--accent-color); font-weight: 800; font-size: 12px;">#${folio}</span>
                    <span style="font-size: 10px; font-weight: 800; padding: 3px 8px; border-radius: 999px; ${badgeStyle}">${status}</span>
                </div>
                <div style="font-size: 12px;"><strong>Cliente:</strong> ${order.userName || 'Invitado'} (${order.userEmail || 'Sin correo'})</div>
                <ul style="font-size: 12px; padding-left: 16px; color: var(--text-secondary); margin: 4px 0;">${itemsList}</ul>
                <div style="font-size: 13px; font-weight: 800;">Total: $${Number(order.total || 0).toLocaleString('es-MX')} MXN</div>
                ${renderStatusSelectHtml('orders', doc.id, status)}
                <button type="button" class="btn-delete" style="margin-top: 6px;" onclick="deleteAdminOrder('${doc.id}')">Eliminar / Archivar</button>
            `;
            container.appendChild(card);
        });
    }).catch(err => console.error("Error cargando compras:", err));
}

async function deleteAdminOrder(docId) {
    const confirmed = await showConfirmModal('¿Eliminar esta compra del listado activo?');
    if (!confirmed || !window.db) return;
    await window.db.collection('orders').doc(docId).delete();
    showFloatingToast('Compra archivada');
    loadAdminOrders();
}

function loadAdminDareLabOrders() {
    const container = document.getElementById('adminDareLabList');
    const countSpan = document.getElementById('dareLabCount');
    if (!container || !window.db) return;

    window.db.collection('darelab_orders').orderBy('createdAt', 'desc').get().then((snapshot) => {
        if (countSpan) countSpan.innerText = snapshot.size;
        container.innerHTML = '';

        if (snapshot.empty) {
            container.innerHTML = '<p style="color: var(--text-secondary); font-size: 12px;">No hay solicitudes personalizadas todavía.</p>';
            return;
        }

        snapshot.forEach((doc) => {
            const order = doc.data();
            const status = order.status || 'Pago pendiente';
            const badgeStyle = getStatusBadgeStyle(status);
            const folio = order.orderNumber || doc.id;

            const imgHtml = order.imageData
                ? `<a href="${order.imageData}" download="${order.fileName || 'diseno-darelab.jpg'}" title="Clic para descargar">
                     <img src="${order.imageData}" style="width: 100%; height: 160px; object-fit: contain; background: #141414;">
                   </a>`
                : `<div style="height: 70px; background: #141414; display: flex; align-items: center; justify-content: center; color: var(--text-secondary); font-size: 11px;">Sin imagen adjunta</div>`;

            const card = document.createElement('div');
            card.style.cssText = "background: #0b0b0b; border: 1px solid var(--border-color); padding: 15px; display: flex; flex-direction: column; gap: 8px;";
            card.innerHTML = `
                ${imgHtml}
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <span style="color: var(--accent-color); font-weight: 800; font-size: 12px;">#${folio}</span>
                    <span style="font-size: 10px; font-weight: 800; padding: 3px 8px; border-radius: 999px; ${badgeStyle}">${status}</span>
                </div>
                <div style="font-size: 13px; font-weight: 700;">${order.baseName}</div>
                <div style="font-size: 12px;"><strong>WhatsApp:</strong> ${order.whatsapp || 'No proporcionado'}</div>
                <div style="font-size: 11px; color: var(--text-secondary);"><strong>Estampado:</strong> ${order.technique}</div>
                <div style="font-size: 11px; color: var(--text-secondary);"><strong>Notas:</strong> ${order.notes || ''}</div>
                <div style="font-size: 13px; font-weight: 800;">Total: $${Number(order.total || 0).toLocaleString('es-MX')} MXN</div>
                ${renderStatusSelectHtml('darelab_orders', doc.id, status)}
                <button type="button" class="btn-delete" style="margin-top: 6px;" onclick="deleteDareLabOrder('${doc.id}')">Eliminar / Archivar</button>
            `;
            container.appendChild(card);
        });
    }).catch(err => console.error("Error cargando Dare Lab:", err));
}

async function deleteDareLabOrder(docId) {
    const confirmed = await showConfirmModal('¿Eliminar esta solicitud de Dare Lab?');
    if (!confirmed || !window.db) return;
    await window.db.collection('darelab_orders').doc(docId).delete();
    showFloatingToast('Solicitud archivada');
    loadAdminDareLabOrders();
}

function loadAdminUsers() {
    const container = document.getElementById('adminUsersList');
    const countSpan = document.getElementById('usersCount');
    if (!container || !window.db) return;

    window.db.collection('users').orderBy('lastLogin', 'desc').get().then((snapshot) => {
        if (countSpan) countSpan.innerText = snapshot.size;
        container.innerHTML = '';

        if (snapshot.empty) {
            container.innerHTML = '<p style="color: var(--text-secondary); font-size: 12px;">Aún no hay usuarios registrados.</p>';
            return;
        }

        snapshot.forEach((doc) => {
            const u = doc.data();
            const row = document.createElement('div');
            row.style.cssText = "display: flex; align-items: center; gap: 12px; background: #0b0b0b; border: 1px solid var(--border-color); padding: 10px 14px;";
            row.innerHTML = `
                <img src="${u.photoURL || 'https://via.placeholder.com/40'}" style="width: 36px; height: 36px; border-radius: 50%; object-fit: cover;">
                <div style="flex-grow: 1;">
                    <div style="font-weight: 700; font-size: 13px;">${u.name || 'Usuario'}</div>
                    <div style="color: var(--text-secondary); font-size: 11px;">${u.email}</div>
                </div>
            `;
            container.appendChild(row);
        });
    }).catch(err => console.error("Error cargando usuarios:", err));
}
