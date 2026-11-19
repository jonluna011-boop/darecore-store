/* ==========================================
   DARECORE - SCRIPT MAESTRO DEFINITIVO Y UNIFICADO
   ========================================== */

let selectedCustomBaseIndex = 0;
let cart = JSON.parse(localStorage.getItem('darecore_cart')) || [];
let activeCartTab = 'cart'; // 'cart' | 'pending'
let isSyncing = false;

const ORDER_STATUSES = [
    'Pedido pendiente',
    'En proceso',
    'Listo para enviar',
    'Enviado'
];

document.addEventListener('DOMContentLoaded', () => {
    initStore();
    setupSearch();
    setupDareLab();
    initAdminPanel();
    initCartSystem();
});

function generateFolio(prefix) {
    const randomPart = Math.floor(100000 + Math.random() * 900000);
    return `${prefix}-${randomPart}`;
}

function getStatusBadgeStyle(status) {
    switch (status) {
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
1. GESTIÓN DE PRODUCTOS Y SINCRONIZACIÓN
   ========================================== */
function getStoredProducts() {
    if (window.db && !isSyncing) {
        isSyncing = true;
        window.db.collection('products').orderBy('id', 'desc').get().then((snapshot) => {
            if (!snapshot.empty) {
                const cloudProducts = snapshot.docs.map(doc => ({ ...doc.data(), firestoreId: doc.id }));
                localStorage.setItem('darecore_products', JSON.stringify(cloudProducts));
                initStore();
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
        grid.innerHTML = '<p style="color: var(--text-secondary, #888); grid-column: 1/-1; text-align: center; padding: 40px;">No hay prendas registradas todavía. Agrega tus productos desde el Panel de Administración.</p>';
        return;
    }

    products.forEach(p => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.style.cursor = 'pointer';

        card.innerHTML = `
            ${p.tag ? `<span class="product-tag">${p.tag}</span>` : ''}
            <div class="product-img" style="background-image: url('${p.image || ''}'); background-size: cover; background-position: center; height: 220px; background-color: #1a1a1a;"></div>
            <div class="product-name" style="font-weight: 700; margin-top: 10px; color: #111;">${p.name}</div>
            <div class="product-desc" style="font-size: 11px; color: #666; margin-bottom: 10px;">${p.desc}</div>
            <div class="product-footer" style="display: flex; justify-content: space-between; align-items: center; margin-top: auto;">
                <span class="price" style="font-weight: 800; color: #111;">$${Number(p.price).toLocaleString('es-MX')} <small>MXN</small></span>
                <button class="btn-add" onclick="event.stopPropagation(); addToCart('${p.id || p.firestoreId}')">Agregar</button>
            </div>
        `;
        
        card.addEventListener('click', () => {
            openProductModal(p.id || p.firestoreId);
        });

        grid.appendChild(card);
    });
}

/* ==========================================
2. BUSCADOR GLOBAL INTELIGENTE
   ========================================== */
function setupSearch() {
    const searchInput = document.getElementById('searchInput') || document.querySelector('.search-box');
    if (!searchInput) return;

    searchInput.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase().trim();
        const products = getStoredProducts();
        
        if (!term) {
            initStore();
            return;
        }

        const filtered = products.filter(p => 
            (p.name && p.name.toLowerCase().includes(term)) || 
            (p.desc && p.desc.toLowerCase().includes(term)) ||
            (p.category && p.category.toLowerCase().includes(term)) ||
            (p.tag && p.tag.toLowerCase().includes(term))
        );
        renderProducts(filtered);
    });
}

/* ==========================================
3. MODAL DE VISTA RÁPIDA (EN GRANDE)
   ========================================== */
function openProductModal(productId) {
    const products = getStoredProducts();
    const product = products.find(p => p.id == productId || p.firestoreId == productId);
    if (!product) return;

    let modalOverlay = document.getElementById('quickViewModal');
    if (!modalOverlay) {
        modalOverlay = document.createElement('div');
        modalOverlay.id = 'quickViewModal';
        modalOverlay.style.cssText = "display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.85); z-index:9999; justify-content:center; align-items:center;";
        document.body.appendChild(modalOverlay);
    }

    modalOverlay.innerHTML = `
        <div class="product-modal-content" style="background:#111; padding:30px; border-radius:8px; max-width:650px; width:90%; position:relative; display:grid; grid-template-columns: 1fr 1fr; gap:20px;">
            <button onclick="closeProductModal()" class="product-modal-close" style="position:absolute; top:10px; right:15px; background:none; border:none; color:#fff; font-size:24px; cursor:pointer;">&times;</button>
            <div style="background-image: url('${product.image}'); background-size: cover; background-position: center; height:280px; border-radius:4px; background-color:#222;"></div>
            <div style="display: flex; flex-direction: column; justify-content: center; color: #ffffff;">
                <span style="color: #ff3b1b; font-size: 11px; font-weight: 700; text-transform: uppercase; margin-bottom: 5px;">${product.tag || 'DARECORE'}</span>
                <h2 style="font-size: 20px; font-weight: 900; margin-bottom: 10px; color: #ffffff;">${product.name}</h2>
                <p style="color: #aaaaaa; font-size: 12px; margin-bottom: 15px; line-height: 1.4;">${product.desc}</p>
                <div style="font-size: 18px; font-weight: 800; color: #ffffff; margin-bottom: 20px;">$${Number(product.price).toLocaleString('es-MX')} MXN</div>
                <button onclick="addToCart('${product.id || p.firestoreId}'); closeProductModal();" style="background:#ff3b1b; color:#fff; border:none; padding:12px; font-weight:700; cursor:pointer; text-transform: uppercase;">Agregar al Carrito</button>
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
                alert('Por favor ingresa tu número de WhatsApp para enviarte tu mockup.');
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
            const initialStatus = 'Pedido pendiente';
            const createdAt = new Date().toISOString();

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
                createdAt: createdAt
            });

            const mensaje = `Hola Dare core, me gustaría procesar el pago de mi pedido #${orderNumber}`;
            const waUrl = `https://wa.me/5214777035509?text=${encodeURIComponent(mensaje)}`;
            window.open(waUrl, '_blank');
        });
    }
}

function renderCustomBasesPublic() {
    const container = document.getElementById('customBasesContainer');
    if (!container) return;

    const bases = getCustomBases();
    container.innerHTML = '';

    bases.forEach((base, index) => {
        const card = document.createElement('div');
        card.className = `option-card ${index === selectedCustomBaseIndex ? 'selected' : ''}`;
        card.style.cssText = "border: 2px solid #ddd; padding: 15px; cursor: pointer; transition: all 0.2s; border-radius: 4px; background: #fff;";
        
        card.innerHTML = `
            <div style="font-weight: 800; font-size: 14px; color: #111; margin-bottom: 5px;">${base.name}</div>
            <div style="font-size: 12px; color: #666; margin-bottom: 10px;">${base.desc}</div>
            <div style="font-weight: 900; font-size: 15px; color: #ff3b1b;">$${Number(base.price).toLocaleString('es-MX')} MXN</div>
        `;

        card.addEventListener('click', () => {
            selectedCustomBaseIndex = index;
            document.querySelectorAll('#customBasesContainer .option-card').forEach(c => {
                c.classList.remove('selected');
                c.style.borderColor = '#ddd';
                c.style.background = '#fff';
            });
            card.classList.add('selected');
            card.style.borderColor = '#ff3b1b';
            card.style.background = '#fafafa';
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
5. SISTEMA DE CARRITO, ESTATUS Y PAGOS
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

async function fetchClientPendingOrders() {
    const localOrders = getClientPendingOrdersLocal();
    if (!window.db || localOrders.length === 0) return localOrders;

    const updated = await Promise.all(localOrders.map(async (entry) => {
        if (!entry.id || !entry.collection) return entry;
        try {
            const docSnap = await window.db.collection(entry.collection).doc(entry.id).get();
            if (docSnap.exists) {
                const data = docSnap.data();
                return {
                    ...entry,
                    status: data.status || entry.status || 'Pedido pendiente',
                    total: data.total !== undefined ? data.total : entry.total
                };
            }
        } catch (err) {
            console.log("No se pudo refrescar estatus de pedido:", err);
        }
        return entry;
    }));

    localStorage.setItem('darecore_client_orders', JSON.stringify(updated));
    return updated;
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
    alert(`¡"${product.name}" agregado al carrito!`);
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
        modalOverlay.style.cssText = "display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.85); z-index:9999; justify-content:flex-end; align-items:stretch;";
        document.body.appendChild(modalOverlay);
    }

    const pendingOrders = await fetchClientPendingOrders();
    const subtotal = cart.reduce((sum, item) => sum + (Number(item.price) * Number(item.qty || 1)), 0);

    const cartTabStyle = activeCartTab === 'cart'
        ? 'background:#ff3b1b; color:#fff; border:1px solid #ff3b1b;'
        : 'background:#1a1a1a; color:#bbb; border:1px solid #2b2b2b;';

    const pendingTabStyle = activeCartTab === 'pending'
        ? 'background:#ff3b1b; color:#fff; border:1px solid #ff3b1b;'
        : 'background:#1a1a1a; color:#bbb; border:1px solid #2b2b2b;';

    let bodyContentHtml = '';

    if (activeCartTab === 'cart') {
        if (cart.length === 0) {
            bodyContentHtml = '<p style="color:#888; text-align:center; padding:40px 15px;">Tu carrito está vacío. Agrega prendas o revisa la pestaña <strong>Pedido pendiente</strong>.</p>';
        } else {
            bodyContentHtml = cart.map((item, idx) => {
                const qty = Number(item.qty || 1);
                const lineTotal = Number(item.price) * qty;
                return `
                    <div style="display:flex; gap:10px; align-items:center; background:#1a1a1a; padding:10px; border-radius:4px; margin-bottom:10px; border:1px solid #252525;">
                        <img src="${item.image || ''}" style="width:52px; height:52px; object-fit:cover; border-radius:4px; background:#242424;">
                        <div style="flex-grow:1; min-width:0;">
                            <div style="font-weight:700; font-size:12px; color:#fff; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${item.name}</div>
                            <div style="font-size:11px; color:#999;">$${Number(item.price).toLocaleString('es-MX')} MXN c/u • <strong style="color:#fff;">$${lineTotal.toLocaleString('es-MX')} MXN</strong></div>
                            <div style="display:flex; align-items:center; gap:8px; margin-top:6px;">
                                <button onclick="changeCartQty(${idx}, -1)" style="background:#262626; color:#fff; border:1px solid #3a3a3a; width:24px; height:24px; cursor:pointer; font-weight:800; border-radius:3px;">-</button>
                                <span style="color:#fff; font-size:12px; font-weight:800; min-width:18px; text-align:center;">${qty}</span>
                                <button onclick="changeCartQty(${idx}, 1)" style="background:#262626; color:#fff; border:1px solid #3a3a3a; width:24px; height:24px; cursor:pointer; font-weight:800; border-radius:3px;" title="Agregar otra pieza igual">+</button>
                            </div>
                        </div>
                        <button onclick="removeFromCart(${idx})" style="background:none; border:none; color:#ff3b1b; cursor:pointer; font-size:18px; padding:0 4px;" title="Quitar prenda">&times;</button>
                    </div>
                `;
            }).join('');
        }
    } else {
        if (pendingOrders.length === 0) {
            bodyContentHtml = '<p style="color:#888; text-align:center; padding:40px 15px;">Aún no tienes pedidos registrados aquí. Al procesar tu pago aparecerán con su estatus.</p>';
        } else {
            bodyContentHtml = pendingOrders.map((ord) => {
                const currentStatus = ord.status || 'Pedido pendiente';
                const badgeStyle = getStatusBadgeStyle(currentStatus);
                return `
                    <div style="background:#181818; border:1px solid #282828; padding:12px; border-radius:5px; margin-bottom:10px;">
                        <div style="display:flex; justify-content:space-between; align-items:center; gap:8px; margin-bottom:6px;">
                            <span style="color:#fff; font-weight:800; font-size:12px;">#${ord.folio}</span>
                            <span style="font-size:10px; font-weight:800; padding:3px 8px; border-radius:999px; ${badgeStyle}">${currentStatus}</span>
                        </div>
                        <div style="color:#bbb; font-size:11px; margin-bottom:6px;">${ord.summary || ord.typeLabel || 'Pedido DARECORE'}</div>
                        <div style="display:flex; justify-content:space-between; align-items:center; font-size:11px; color:#888;">
                            <span>${ord.typeLabel || 'Tienda'}</span>
                            <strong style="color:#ff3b1b; font-size:12px;">$${Number(ord.total || 0).toLocaleString('es-MX')} MXN</strong>
                        </div>
                    </div>
                `;
            }).join('');
        }
    }

    const footerHtml = activeCartTab === 'cart'
        ? `
            <div style="border-top:1px solid #222; padding-top:15px; margin-bottom:15px; display:flex; justify-content:space-between; color:#fff; font-weight:800; font-size:16px;">
                <span>Subtotal a Pagar:</span>
                <span style="color:#ff3b1b;">$${subtotal.toLocaleString('es-MX')} MXN</span>
            </div>
            <button onclick="checkoutCart()" style="background:#ff3b1b; color:#fff; border:none; width:100%; padding:12px; font-weight:700; cursor:pointer; text-transform:uppercase; margin-bottom:10px;">Proceder al Pago</button>
            <button onclick="openGoogleAuthModal()" style="background:#fff; color:#111; border:none; width:100%; padding:10px; font-weight:700; cursor:pointer; font-size:12px;">Iniciar Sesión con Google</button>
        `
        : `
            <div style="border-top:1px solid #222; padding-top:12px; display:flex; flex-direction:column; gap:8px;">
                <button onclick="openCartModal('pending')" style="background:#222; color:#fff; border:1px solid #333; width:100%; padding:10px; font-weight:700; cursor:pointer; font-size:12px;">Actualizar Estatus</button>
                <button onclick="switchCartTab('cart')" style="background:#ff3b1b; color:#fff; border:none; width:100%; padding:11px; font-weight:700; cursor:pointer; font-size:12px; text-transform:uppercase;">Seguir Comprando</button>
            </div>
        `;

    modalOverlay.innerHTML = `
        <div style="background:#111; width:410px; max-width:100%; padding:25px; display:flex; flex-direction:column; justify-content:space-between; box-shadow: -5px 0 15px rgba(0,0,0,0.5);">
            <div>
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; border-bottom:1px solid #222; padding-bottom:10px;">
                    <h3 style="color:#fff; font-size:16px; margin:0;">CARRITO DE COMPRAS</h3>
                    <button onclick="closeCartModal()" style="background:none; border:none; color:#fff; font-size:24px; cursor:pointer;">&times;</button>
                </div>

                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:8px; margin-bottom:16px;">
                    <button onclick="switchCartTab('cart')" style="padding:8px; font-size:11px; font-weight:800; cursor:pointer; border-radius:4px; text-transform:uppercase; ${cartTabStyle}">Carrito (${cart.reduce((s, i) => s + Number(i.qty || 1), 0)})</button>
                    <button onclick="switchCartTab('pending')" style="padding:8px; font-size:11px; font-weight:800; cursor:pointer; border-radius:4px; text-transform:uppercase; ${pendingTabStyle}">Pedido pendiente (${pendingOrders.length})</button>
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
        alert('Tu carrito está vacío.');
        return;
    }

    const purchaseNumber = generateFolio('COMPRA');
    const subtotal = cart.reduce((sum, item) => sum + (Number(item.price) * Number(item.qty || 1)), 0);
    const currentUser = window.auth && window.auth.currentUser ? window.auth.currentUser : null;
    const initialStatus = 'Pedido pendiente';
    const createdAt = new Date().toISOString();

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
        createdAt: createdAt
    });

    // Vaciar el carrito para que quede listo para solicitar nueva ropa
    cart = [];
    saveCart();
    updateCartUI();
    openCartModal('pending');

    const mensaje = `Hola Dare core, me gustaría procesar el pago de mi pedido #${purchaseNumber}`;
    window.open(`https://wa.me/5214777035509?text=${encodeURIComponent(mensaje)}`, '_blank');
}

function openGoogleAuthModal() {
    if (!window.auth) {
        alert("Firebase Auth no está inicializado.");
        return;
    }
    
    const provider = new firebase.auth.GoogleAuthProvider();
    provider.setCustomParameters({
        'prompt': 'select_account'
    });

    window.auth.signInWithPopup(provider)
        .then((result) => {
            const user = result.user;

            if (window.db && user) {
                window.db.collection('users').doc(user.uid).set({
                    uid: user.uid,
                    name: user.displayName || 'Sin nombre',
                    email: user.email || '',
                    photoURL: user.photoURL || '',
                    lastLogin: new Date().toISOString()
                }, { merge: true }).catch(err => console.error("Error guardando usuario:", err));
            }

            alert(`¡Bienvenido, ${user.displayName || user.email}! Sesión iniciada con éxito.`);
            closeCartModal();
        }).catch((error) => {
            console.error("Error en autenticación con Google:", error.message);
            alert("Hubo un error al iniciar sesión con Google: " + error.message);
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

    if (localStorage.getItem('darecore_admin_logged') === 'true') {
        if (loginSection) loginSection.classList.add('hidden');
        if (dashboardSection) dashboardSection.classList.remove('hidden');
        if (logoutBtn) logoutBtn.classList.remove('hidden');
        loadAdminProducts();
        loadAdminCustomBases();
        loadAdminUsers();
        loadAdminDareLabOrders();
        loadAdminOrders();
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
            loadAdminProducts();
            loadAdminCustomBases();
            loadAdminUsers();
            loadAdminDareLabOrders();
            loadAdminOrders();
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

function renderStatusSelectHtml(collectionName, docId, currentStatus) {
    const active = currentStatus || 'Pedido pendiente';
    const optionsHtml = ORDER_STATUSES.map(st =>
        `<option value="${st}" ${st === active ? 'selected' : ''}>${st}</option>`
    ).join('');

    return `
        <div style="margin-top: 4px;">
            <label style="font-size: 10px; color: #aaa; display: block; margin-bottom: 4px; text-transform: uppercase; font-weight: 700;">Estatus del pedido:</label>
            <select onchange="updateOrderStatus('${collectionName}', '${docId}', this.value)" style="width: 100%; background: #141414; color: #fff; border: 1px solid #333; padding: 7px 8px; border-radius: 4px; font-size: 12px; cursor: pointer;">
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
        // También actualizar caché local del cliente si coincide el ID
        const localOrders = getClientPendingOrdersLocal();
        const nextLocal = localOrders.map(item =>
            item.id === docId ? { ...item, status: newStatus } : item
        );
        localStorage.setItem('darecore_client_orders', JSON.stringify(nextLocal));

        if (collectionName === 'orders') loadAdminOrders();
        if (collectionName === 'darelab_orders') loadAdminDareLabOrders();
    }).catch(err => console.error("Error actualizando estatus:", err));
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
        
        item.innerHTML = `
            <img src="${p.image || ''}" alt="${p.name}">
            <div style="flex-grow: 1; color: white;">
                <div style="font-weight: 700; font-size: 13px;">${p.name}</div>
                <div style="font-size: 11px; color: #888;">${p.category || 'general'} | $${p.price} MXN</div>
            </div>
            <div style="display: flex; gap: 8px;">
                <button type="button" class="btn-primary" style="padding: 6px 10px; font-size: 10px;" onclick="editProduct('${p.id || p.firestoreId}')">Editar</button>
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
            alert('¡Prenda actualizada con éxito!');
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
                }).catch(err => console.log(err));
            }

            alert('¡Prenda publicada con éxito!');
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
    if (formTitle) formTitle.innerText = '✏️ EDITAR PRENDA';
    const submitBtn = document.getElementById('submitBtn');
    if (submitBtn) submitBtn.innerText = 'GUARDAR CAMBIOS';
    const cancelEditBtn = document.getElementById('cancelEditBtn');
    if (cancelEditBtn) cancelEditBtn.classList.remove('hidden');

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function deleteProduct(productId) {
    if (!confirm('¿Estás seguro de eliminar esta prenda?')) return;
    
    let products = getStoredProducts();
    const target = products.find(p => p.id == productId || p.firestoreId == productId);
    products = products.filter(p => p.id != productId && p.firestoreId != productId);
    saveProductsLocal(products);

    if (window.db && target && target.firestoreId) {
        window.db.collection('products').doc(target.firestoreId).delete().catch(err => console.log(err));
    }

    loadAdminProducts();
    initStore();
    alert('Prenda eliminada correctamente.');
}

function loadAdminCustomBases() {
    const container = document.getElementById('adminCustomBasesList');
    if (!container) return;

    const bases = getCustomBases();
    container.innerHTML = '';

    bases.forEach((base, index) => {
        const box = document.createElement('div');
        box.style.cssText = "background: #0b0b0b; border: 1px solid #222; padding: 15px; border-radius: 6px;";
        box.innerHTML = `
            <div style="margin-bottom: 8px;">
                <label style="font-size: 10px; color: #888; display: block;">NOMBRE BASE</label>
                <input type="text" id="baseName_${index}" value="${base.name}" class="form-control" style="font-size: 12px; padding: 6px;">
            </div>
            <div style="margin-bottom: 8px;">
                <label style="font-size: 10px; color: #888; display: block;">PRECIO (MXN)</label>
                <input type="number" id="basePrice_${index}" value="${base.price}" class="form-control" style="font-size: 12px; padding: 6px;">
            </div>
            <button type="button" class="btn-primary" style="padding: 6px 10px; font-size: 10px; width: 100%; margin-top: 5px;" onclick="updateCustomBaseItem(${index})">Guardar Cambios</button>
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

        alert('¡Base personalizada actualizada con éxito!');
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
            container.innerHTML = '<p style="color: #888; font-size: 12px;">Aún no hay usuarios registrados.</p>';
            return;
        }

        snapshot.forEach((doc) => {
            const u = doc.data();
            const row = document.createElement('div');
            row.style.cssText = "display: flex; align-items: center; gap: 12px; background: #0b0b0b; border: 1px solid #222; padding: 10px; border-radius: 6px;";
            row.innerHTML = `
                <img src="${u.photoURL || 'https://via.placeholder.com/40'}" style="width: 36px; height: 36px; border-radius: 50%; object-fit: cover;">
                <div style="flex-grow: 1;">
                    <div style="color: #fff; font-weight: 700; font-size: 13px;">${u.name || 'Usuario'}</div>
                    <div style="color: #aaa; font-size: 11px;">${u.email}</div>
                </div>
                <div style="color: #666; font-size: 10px;">${u.lastLogin ? new Date(u.lastLogin).toLocaleDateString('es-MX') : ''}</div>
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
            container.innerHTML = '<p style="color: #888; font-size: 12px;">No hay solicitudes personalizadas todavía.</p>';
            return;
        }

        snapshot.forEach((doc) => {
            const order = doc.data();
            const status = order.status || 'Pedido pendiente';
            const badgeStyle = getStatusBadgeStyle(status);

            const card = document.createElement('div');
            card.style.cssText = "background: #0b0b0b; border: 1px solid #222; padding: 14px; border-radius: 6px; display: flex; flex-direction: column; gap: 8px;";
            
            const imgHtml = order.imageData
                ? `<a href="${order.imageData}" download="${order.fileName || 'diseno-darelab.jpg'}" title="Clic para descargar imagen">
                     <img src="${order.imageData}" style="width: 100%; height: 180px; object-fit: contain; background: #161616; border-radius: 4px; cursor: pointer;">
                   </a>`
                : `<div style="height: 80px; background: #161616; border-radius: 4px; display: flex; align-items: center; justify-content: center; color: #666; font-size: 11px;">Sin imagen adjunta</div>`;

            const cleanPhone = (order.whatsapp || '').replace(/\D/g, '');
            const waClientLink = cleanPhone
                ? `<a href="https://wa.me/${cleanPhone.length === 10 ? '521' + cleanPhone : cleanPhone}" target="_blank" style="color: #25d366; text-decoration: underline;">${order.whatsapp}</a>`
                : `<span style="color: #888;">${order.whatsapp || 'No proporcionado'}</span>`;

            card.innerHTML = `
                ${imgHtml}
                <div style="display:flex; justify-content:space-between; align-items:center; gap:6px;">
                    <span style="color: #ff3b1b; font-size: 11px; font-weight: 800;">${order.orderNumber ? '#' + order.orderNumber : 'DARE LAB'}</span>
                    <span style="font-size: 10px; font-weight: 800; padding: 2px 7px; border-radius: 999px; ${badgeStyle}">${status}</span>
                </div>
                <div style="color: #fff; font-size: 12px; font-weight: 700;">${order.baseName}</div>
                <div style="color: #fff; font-size: 12px;"><strong>Cliente:</strong> ${order.userName} (${order.userEmail})</div>
                <div style="color: #fff; font-size: 12px;"><strong>WhatsApp:</strong> ${waClientLink}</div>
                <div style="color: #aaa; font-size: 11px;"><strong>Técnica:</strong> ${order.technique} | <strong>Total:</strong> $${Number(order.total).toLocaleString('es-MX')} MXN</div>
                <div style="color: #888; font-size: 11px;"><strong>Notas:</strong> ${order.notes}</div>
                ${renderStatusSelectHtml('darelab_orders', doc.id, status)}
                <button type="button" class="btn-delete" style="margin-top: auto; width: 100%;" onclick="deleteDareLabOrder('${doc.id}')">Eliminar Solicitud</button>
            `;
            container.appendChild(card);
        });
    }).catch(err => console.error("Error cargando solicitudes Dare Lab:", err));
}

function deleteDareLabOrder(docId) {
    if (!confirm('¿Eliminar esta solicitud de Dare Lab?')) return;
    window.db.collection('darelab_orders').doc(docId).delete().then(() => {
        loadAdminDareLabOrders();
    }).catch(err => console.error("Error eliminando solicitud:", err));
}

function loadAdminOrders() {
    const container = document.getElementById('adminOrdersList');
    const countSpan = document.getElementById('ordersCount');
    if (!container || !window.db) return;

    window.db.collection('orders').orderBy('createdAt', 'desc').get().then((snapshot) => {
        if (countSpan) countSpan.innerText = snapshot.size;
        container.innerHTML = '';

        if (snapshot.empty) {
            container.innerHTML = '<p style="color: #888; font-size: 12px;">Aún no hay compras registradas desde el carrito.</p>';
            return;
        }

        snapshot.forEach((doc) => {
            const order = doc.data();
            const status = order.status || 'Pedido pendiente';
            const badgeStyle = getStatusBadgeStyle(status);

            const itemsList = Array.isArray(order.items) && order.items.length > 0
                ? order.items.map(item => `
                    <li style="margin-bottom: 4px; color: #ddd;">
                        <strong>${item.qty}x</strong> ${item.name} — <span style="color: #aaa;">$${Number(item.price).toLocaleString('es-MX')} MXN c/u</span>
                    </li>
                  `).join('')
                : '<li style="color: #888;">Sin detalle de prendas</li>';

            const dateText = order.createdAt ? new Date(order.createdAt).toLocaleString('es-MX') : '';

            const card = document.createElement('div');
            card.style.cssText = "background: #0b0b0b; border: 1px solid #222; padding: 14px; border-radius: 6px; display: flex; flex-direction: column; gap: 8px;";
            card.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; gap: 8px;">
                    <span style="color: #ff3b1b; font-size: 12px; font-weight: 800;">#${order.purchaseNumber || doc.id}</span>
                    <span style="font-size: 10px; font-weight: 800; padding: 2px 7px; border-radius: 999px; ${badgeStyle}">${status}</span>
                </div>
                <div style="color: #666; font-size: 10px;">${dateText}</div>
                <div style="color: #fff; font-size: 12px;"><strong>Cliente:</strong> ${order.userName || 'Invitado'} (${order.userEmail || 'Sin correo'})</div>
                <div style="background: #141414; border: 1px solid #222; padding: 10px; border-radius: 4px;">
                    <div style="color: #aaa; font-size: 11px; font-weight: 700; margin-bottom: 6px; text-transform: uppercase;">Prendas solicitadas:</div>
                    <ul style="list-style: none; padding: 0; margin: 0; font-size: 12px;">
                        ${itemsList}
                    </ul>
                </div>
                <div style="color: #fff; font-size: 13px; font-weight: 800; margin-top: 2px;">
                    Total: <span style="color: #ff3b1b;">$${Number(order.total || 0).toLocaleString('es-MX')} MXN</span>
                </div>
                ${renderStatusSelectHtml('orders', doc.id, status)}
                <button type="button" class="btn-delete" style="margin-top: auto; width: 100%;" onclick="deleteAdminOrder('${doc.id}')">Eliminar Compra</button>
            `;
            container.appendChild(card);
        });
    }).catch(err => console.error("Error cargando compras del carrito:", err));
}

function deleteAdminOrder(docId) {
    if (!confirm('¿Eliminar este registro de compra?')) return;
    window.db.collection('orders').doc(docId).delete().then(() => {
        loadAdminOrders();
    }).catch(err => console.error("Error eliminando compra:", err));
}
