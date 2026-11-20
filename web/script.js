/* ==========================================
   DARECORE - SCRIPT LIMPIO (SIN TOCAR ESTILOS)
   ========================================== */

let selectedCustomBaseIndex = 0;
let cart = JSON.parse(localStorage.getItem('darecore_cart')) || [];
let isSyncing = false;
let currentSearchTerm = '';

const ORDER_STATUSES = [
    'Pago pendiente',
    'Pedido pendiente',
    'En proceso',
    'Listo para enviar',
    'Enviado'
];

function generateFolio(prefix) {
    const randomPart = Math.floor(100000 + Math.random() * 900000);
    return `${prefix}-${randomPart}`;
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
            'box-shadow: 0 16px 36px rgba(0, 0, 0, 0.55)',
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
            <div style="background: #121216; color: #ffffff; border: 1px solid rgba(255,255,255,0.12); border-radius: 20px; padding: 24px; max-width: 380px; width: 100%; text-align: center;">
                <div style="font-size: 15px; font-weight: 700; margin-bottom: 20px;">${message}</div>
                <div style="display: flex; gap: 10px;">
                    <button id="darecoreConfirmAccept" type="button" style="flex: 1; background: #16a34a; color: #fff; border: none; padding: 10px; border-radius: 999px; font-weight: 800; cursor: pointer;">Aceptar</button>
                    <button id="darecoreConfirmCancel" type="button" style="flex: 1; background: #dc2626; color: #fff; border: none; padding: 10px; border-radius: 999px; font-weight: 800; cursor: pointer;">Cancelar</button>
                </div>
            </div>
        `;

        overlay.style.display = 'flex';
        const cleanup = (res) => {
            overlay.style.display = 'none';
            resolve(res);
        };
        document.getElementById('darecoreConfirmAccept').onclick = () => cleanup(true);
        document.getElementById('darecoreConfirmCancel').onclick = () => cleanup(false);
        overlay.onclick = (e) => {
            if (e.target === overlay) cleanup(false);
        };
    });
}

/* ==========================================
   DARE LAB - SUMA Y ENVÍO DE MOCKUP
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
        { id: 'b1', name: 'Boxy Tee 240G', price: 580, desc: 'Camisa / playera algodón peinado pesado' },
        { id: 'b2', name: 'Heavy Hoodie 400G', price: 1099, desc: 'Sudadera / hoodie felpa francesa alto gramaje' },
        { id: 'b3', name: 'Varsity Jacket Bordada', price: 1750, desc: 'Chamarra de equipo' },
        { id: 'b4', name: 'Top Deportivo Seamless', price: 460, desc: 'Top / licra compresión gym' }
    ];
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
        if (match) extra = Number(match[1]) || 0;
    }

    const cleanLabel = (opt.value || rawText.replace(/\(\s*\+[^)]*\)/g, '') || rawText).trim();
    return { label: cleanLabel, extra };
}

function updateCustomSummary() {
    const bases = getCustomBases();
    const selectedBase = bases[selectedCustomBaseIndex] || bases[0];
    const basePrice = Number(selectedBase ? selectedBase.price : 0) || 0;

    const techInfo = getSelectOptionInfo(document.getElementById('customTechniqueSelect'));
    const placementInfo = getSelectOptionInfo(document.getElementById('customPlacementSelect'));
    const extraCost = (Number(techInfo.extra) || 0) + (Number(placementInfo.extra) || 0);
    const totalPrice = basePrice + extraCost;

    const summaryBaseName = document.getElementById('summaryBaseName');
    const summaryTechName = document.getElementById('summaryTechName');
    const summaryTotalPrice = document.getElementById('summaryTotalPrice');

    if (summaryBaseName && selectedBase) summaryBaseName.textContent = selectedBase.name;
    if (summaryTechName) {
        const parts = [techInfo.label, placementInfo.label].filter(Boolean);
        summaryTechName.textContent = parts.length ? parts.join(' • ') : 'Estándar';
    }
    if (summaryTotalPrice) {
        summaryTotalPrice.textContent = `$${totalPrice.toLocaleString('es-MX')} MXN`;
    }
}

function renderCustomBasesPublic() {
    const container = document.getElementById('customBasesContainer');
    if (!container) return;

    const bases = getCustomBases();
    if (selectedCustomBaseIndex >= bases.length) selectedCustomBaseIndex = 0;

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
                canvas.getContext('2d').drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', quality));
            };
            img.onerror = () => resolve(null);
            img.src = event.target.result;
        };
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(file);
    });
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
    const techInfo = getSelectOptionInfo(document.getElementById('customTechniqueSelect'));
    const placementInfo = getSelectOptionInfo(document.getElementById('customPlacementSelect'));
    const techLabel = [techInfo.label, placementInfo.label].filter(Boolean).join(' • ') || 'Estándar';
    const total = (Number(selectedBase ? selectedBase.price : 0) || 0) + (Number(techInfo.extra) || 0) + (Number(placementInfo.extra) || 0);

    const fileInput = document.getElementById('customDesignFile');
    const fileObj = fileInput && fileInput.files && fileInput.files[0] ? fileInput.files[0] : null;
    const fileName = fileObj ? fileObj.name : 'Lo enviaré por chat';
    const notes = document.getElementById('customNotes')?.value.trim() || '';
    const orderNumber = generateFolio('PEDIDO');
    const createdAt = new Date().toISOString();

    let imageData = '';
    if (fileObj) {
        imageData = (await compressImageFile(fileObj)) || '';
    }

    if (window.db) {
        try {
            await window.db.collection('darelab_orders').add({
                orderNumber,
                orderType: 'pedido_darelab',
                status: 'Pago pendiente',
                whatsapp,
                baseName: selectedBase.name,
                technique: techLabel,
                fileName,
                imageData,
                notes,
                total,
                createdAt
            });
        } catch (err) {
            console.error('Error guardando solicitud de Dare Lab:', err);
        }
    }

    const mensaje = `Hola Dare core, me gustaría solicitar mi mockup digital y procesar el pago de mi pedido #${orderNumber} (${selectedBase.name}, ${techLabel}, Total: $${total} MXN, WhatsApp: ${whatsapp})`;
    const waUrl = `https://wa.me/5214777035509?text=${encodeURIComponent(mensaje)}`;

    showFloatingToast(`Solicitud #${orderNumber} registrada. Abriendo WhatsApp...`);
    const opened = window.open(waUrl, '_blank', 'noopener,noreferrer');
    if (!opened) window.location.href = waUrl;
}

function setupDareLab() {
    const techSelect = document.getElementById('customTechniqueSelect');
    const placementSelect = document.getElementById('customPlacementSelect');
    const mockupBtn = document.getElementById('requestMockupBtn');
    const basesContainer = document.getElementById('customBasesContainer');

    if (!techSelect && !placementSelect && !mockupBtn && !basesContainer) return;

    if (basesContainer) renderCustomBasesPublic();

    [techSelect, placementSelect].forEach(sel => {
        if (sel && !sel.dataset.darelabBound) {
            sel.dataset.darelabBound = 'true';
            sel.addEventListener('change', updateCustomSummary);
        }
    });

    if (mockupBtn && !mockupBtn.dataset.darelabClickBound) {
        mockupBtn.dataset.darelabClickBound = 'true';
        mockupBtn.addEventListener('click', handleMockupRequestSubmit);
    }

    updateCustomSummary();
}

/* ==========================================
   TIENDA Y CARRITO
   ========================================== */
function getStoredProducts() {
    if (window.db && !isSyncing) {
        isSyncing = true;
        window.db.collection('products').orderBy('id', 'desc').get().then((snapshot) => {
            if (!snapshot.empty) {
                const cloudProducts = snapshot.docs.map(doc => ({ ...doc.data(), firestoreId: doc.id }));
                localStorage.setItem('darecore_products', JSON.stringify(cloudProducts));
                if (!currentSearchTerm.trim()) initStore();
            }
        }).catch(() => {}).finally(() => {
            setTimeout(() => { isSyncing = false; }, 2000);
        });
    }

    try {
        const local = JSON.parse(localStorage.getItem('darecore_products') || '[]');
        return Array.isArray(local) ? local : [];
    } catch (e) {
        return [];
    }
}

function saveProductsLocal(products) {
    localStorage.setItem('darecore_products', JSON.stringify(products));
}

function initStore() {
    const grid = document.getElementById('productGrid') || document.querySelector('.product-grid');
    if (!grid) return;

    const path = window.location.pathname.toLowerCase();
    let cat = 'inicio';
    if (path.includes('hombre')) cat = 'hombre';
    else if (path.includes('mujer')) cat = 'mujer';
    else if (path.includes('oversize')) cat = 'oversize';

    const products = getStoredProducts();
    const filtered = cat === 'inicio' ? products : products.filter(p => p.category === cat || p.category === 'inicio');
    renderProducts(filtered);
}

function renderProducts(products) {
    const grid = document.getElementById('productGrid') || document.querySelector('.product-grid');
    if (!grid) return;

    grid.innerHTML = '';
    if (!products || products.length === 0) {
        grid.innerHTML = '<p style="color: #71717a; grid-column: 1/-1; text-align: center; padding: 36px;">No hay prendas registradas todavía.</p>';
        return;
    }

    products.forEach((p) => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
            <div class="product-img" style="background-image: url('${p.image || ''}');"></div>
            <div class="product-name">${p.name}</div>
            <div class="product-desc">${p.desc}</div>
            <div class="product-footer">
                <span class="price">$${Number(p.price).toLocaleString('es-MX')} MXN</span>
                <button class="btn-add" onclick="event.stopPropagation(); addToCart('${p.id || p.firestoreId}')">Agregar</button>
            </div>
        `;
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
        renderProducts(products.filter(p =>
            (p.name && p.name.toLowerCase().includes(currentSearchTerm)) ||
            (p.desc && p.desc.toLowerCase().includes(currentSearchTerm)) ||
            (p.tag && p.tag.toLowerCase().includes(currentSearchTerm))
        ));
    });
}

function addToCart(productId) {
    const product = getStoredProducts().find(p => p.id == productId || p.firestoreId == productId);
    if (!product) return;

    const existing = cart.find(item => item.id == productId || item.firestoreId == productId);
    if (existing) existing.qty = (existing.qty || 1) + 1;
    else cart.push({ ...product, qty: 1 });

    localStorage.setItem('darecore_cart', JSON.stringify(cart));
    updateCartUI();
    showFloatingToast(`"${product.name}" agregado al carrito`);
}

function updateCartUI() {
    const totalCount = cart.reduce((sum, item) => sum + Number(item.qty || 1), 0);
    document.querySelectorAll('.cart-badge').forEach(b => { b.innerText = totalCount; });
}

/* ==========================================
   PANEL DE ADMINISTRACIÓN (admin.html)
   ========================================== */
function showAdminDashboardView() {
    const loginSection = document.getElementById('loginSection');
    const dashboardSection = document.getElementById('dashboardSection');
    const logoutBtn = document.getElementById('logoutBtn');

    if (loginSection) loginSection.classList.add('hidden');
    if (dashboardSection) dashboardSection.classList.remove('hidden');
    if (logoutBtn) logoutBtn.classList.remove('hidden');

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

    if (!loginForm.dataset.adminBound) {
        loginForm.dataset.adminBound = 'true';
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const user = (document.getElementById('adminUser')?.value || '').trim();
            const pass = (document.getElementById('adminPass')?.value || '').trim();
            const errorMsg = document.getElementById('loginError');

            if ((user === 'admin' || user === 'admin@darecore.mx') && pass === 'darecore2026') {
                localStorage.setItem('darecore_admin_logged', 'true');
                if (errorMsg) errorMsg.style.display = 'none';
                showAdminDashboardView();
            } else if (errorMsg) {
                errorMsg.style.display = 'block';
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
    if (addProductForm && !addProductForm.dataset.prodBound) {
        addProductForm.dataset.prodBound = 'true';
        addProductForm.addEventListener('submit', handleProductSubmit);
    }

    const cancelEditBtn = document.getElementById('cancelEditBtn');
    if (cancelEditBtn && !cancelEditBtn.dataset.cancelBound) {
        cancelEditBtn.dataset.cancelBound = 'true';
        cancelEditBtn.addEventListener('click', () => {
            document.getElementById('addProductForm')?.reset();
            document.getElementById('editingProductId').value = '';
            document.getElementById('formTitle').innerText = '+ NUEVA PRENDA';
            document.getElementById('submitBtn').innerText = 'PUBLICAR EN TIENDA';
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

    const saveData = (imgUrl) => {
        if (editingId) {
            products = products.map(p => {
                if (p.id == editingId || p.firestoreId == editingId) {
                    const updated = { ...p, name, category, tag, desc, price, image: imgUrl || p.image };
                    if (window.db && p.firestoreId) {
                        window.db.collection('products').doc(p.firestoreId).update({ name, category, tag, desc, price, image: imgUrl || p.image }).catch(() => {});
                    }
                    return updated;
                }
                return p;
            });
            showFloatingToast(`"${name}" actualizada`);
        } else {
            const newProduct = { id: 'prod_' + Date.now(), category, tag, name, desc, price, image: imgUrl || '' };
            products.unshift(newProduct);
            if (window.db) {
                window.db.collection('products').add(newProduct).then(docRef => {
                    newProduct.firestoreId = docRef.id;
                    saveProductsLocal(products);
                    loadAdminProducts();
                }).catch(() => {});
            }
            showFloatingToast(`"${name}" publicada en tienda`);
        }

        saveProductsLocal(products);
        document.getElementById('addProductForm').reset();
        document.getElementById('editingProductId').value = '';
        document.getElementById('formTitle').innerText = '+ NUEVA PRENDA';
        document.getElementById('submitBtn').innerText = 'PUBLICAR EN TIENDA';
        document.getElementById('cancelEditBtn')?.classList.add('hidden');
        loadAdminProducts();
    };

    if (imageFile) {
        const reader = new FileReader();
        reader.onload = (ev) => saveData(ev.target.result);
        reader.readAsDataURL(imageFile);
    } else if (editingId) {
        const existing = products.find(p => p.id == editingId || p.firestoreId == editingId);
        saveData(existing ? existing.image : '');
    } else {
        saveData('');
    }
}

function editProduct(productId) {
    const product = getStoredProducts().find(p => p.id == productId || p.firestoreId == productId);
    if (!product) return;

    document.getElementById('editingProductId').value = product.id || product.firestoreId;
    document.getElementById('prodCategory').value = product.category || 'inicio';
    document.getElementById('prodTag').value = product.tag || '';
    document.getElementById('prodName').value = product.name || '';
    document.getElementById('prodDesc').value = product.desc || '';
    document.getElementById('prodPrice').value = product.price || '';
    document.getElementById('formTitle').innerText = 'EDITAR PRENDA';
    document.getElementById('submitBtn').innerText = 'GUARDAR CAMBIOS';
    document.getElementById('cancelEditBtn')?.classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function deleteProduct(productId) {
    if (!(await showConfirmModal('¿Estás seguro de eliminar esta prenda?'))) return;
    let products = getStoredProducts();
    const target = products.find(p => p.id == productId || p.firestoreId == productId);
    products = products.filter(p => p.id != productId && p.firestoreId != productId);
    saveProductsLocal(products);
    if (window.db && target && target.firestoreId) {
        window.db.collection('products').doc(target.firestoreId).delete().catch(() => {});
    }
    loadAdminProducts();
    showFloatingToast('Prenda eliminada');
}

function loadAdminCustomBases() {
    const container = document.getElementById('adminCustomBasesList');
    if (!container) return;

    const bases = getCustomBases();
    container.innerHTML = '';
    bases.forEach((base, index) => {
        const box = document.createElement('div');
        box.style.cssText = 'background: #0b0b0b; border: 1px solid var(--border-color); padding: 15px;';
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
    if (!nameInput || !priceInput) return;

    bases[index].name = nameInput.value;
    if (descInput) bases[index].desc = descInput.value;
    bases[index].price = Number(priceInput.value);

    localStorage.setItem('darecore_custom_bases', JSON.stringify(bases));
    if (window.db) {
        window.db.collection('settings').doc('customBases').set({ items: bases }).catch(() => {});
    }
    showFloatingToast('Base actualizada');
    loadAdminCustomBases();
}

function updateOrderStatus(collectionName, docId, newStatus) {
    if (!window.db || !docId) return;
    window.db.collection(collectionName).doc(docId).update({
        status: newStatus,
        updatedAt: new Date().toISOString()
    }).then(() => showFloatingToast(`Estatus actualizado: ${newStatus}`)).catch(() => {});
}

function loadAdminOrders() {
    const container = document.getElementById('adminOrdersList');
    const countSpan = document.getElementById('ordersCount');
    if (!container || !window.db) return;

    window.db.collection('orders').orderBy('createdAt', 'desc').get().then((snapshot) => {
        if (countSpan) countSpan.innerText = snapshot.size;
        container.innerHTML = '';
        if (snapshot.empty) {
            container.innerHTML = '<p style="color: var(--text-secondary); font-size: 12px;">Aún no hay compras registradas.</p>';
            return;
        }
        snapshot.forEach((doc) => {
            const order = doc.data();
            const status = order.status || 'Pago pendiente';
            const itemsList = Array.isArray(order.items)
                ? order.items.map(i => `<li><strong>${i.qty}x</strong> ${i.name} ($${Number(i.price).toLocaleString('es-MX')} MXN)</li>`).join('')
                : '';
            const card = document.createElement('div');
            card.style.cssText = 'background: #0b0b0b; border: 1px solid var(--border-color); padding: 15px; display: flex; flex-direction: column; gap: 8px;';
            card.innerHTML = `
                <div style="color: var(--accent-color); font-weight: 800; font-size: 12px;">#${order.purchaseNumber || doc.id}</div>
                <ul style="font-size: 12px; padding-left: 16px; color: var(--text-secondary);">${itemsList}</ul>
                <div style="font-size: 13px; font-weight: 800;">Total: $${Number(order.total || 0).toLocaleString('es-MX')} MXN</div>
                <select onchange="updateOrderStatus('orders', '${doc.id}', this.value)" class="form-control" style="padding: 7px; font-size: 12px;">
                    ${ORDER_STATUSES.map(st => `<option value="${st}" ${st === status ? 'selected' : ''}>${st}</option>`).join('')}
                </select>
            `;
            container.appendChild(card);
        });
    }).catch(() => {});
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
            const imgHtml = order.imageData
                ? `<a href="${order.imageData}" download="${order.fileName || 'diseno.jpg'}"><img src="${order.imageData}" style="width: 100%; height: 150px; object-fit: contain; background: #141414;"></a>`
                : '';
            const card = document.createElement('div');
            card.style.cssText = 'background: #0b0b0b; border: 1px solid var(--border-color); padding: 15px; display: flex; flex-direction: column; gap: 8px;';
            card.innerHTML = `
                ${imgHtml}
                <div style="color: var(--accent-color); font-weight: 800; font-size: 12px;">#${order.orderNumber || doc.id}</div>
                <div style="font-size: 13px; font-weight: 700;">${order.baseName}</div>
                <div style="font-size: 12px;"><strong>WhatsApp:</strong> ${order.whatsapp || ''}</div>
                <div style="font-size: 11px; color: var(--text-secondary);"><strong>Estampado:</strong> ${order.technique || ''}</div>
                <div style="font-size: 11px; color: var(--text-secondary);"><strong>Notas:</strong> ${order.notes || ''}</div>
                <div style="font-size: 13px; font-weight: 800;">Total: $${Number(order.total || 0).toLocaleString('es-MX')} MXN</div>
                <select onchange="updateOrderStatus('darelab_orders', '${doc.id}', this.value)" class="form-control" style="padding: 7px; font-size: 12px;">
                    ${ORDER_STATUSES.map(st => `<option value="${st}" ${st === status ? 'selected' : ''}>${st}</option>`).join('')}
                </select>
            `;
            container.appendChild(card);
        });
    }).catch(() => {});
}

function loadAdminUsers() {
    const container = document.getElementById('adminUsersList');
    const countSpan = document.getElementById('usersCount');
    if (!container || !window.db) return;

    window.db.collection('users').orderBy('lastLogin', 'desc').get().then((snapshot) => {
        if (countSpan) countSpan.innerText = snapshot.size;
        container.innerHTML = '';
        snapshot.forEach((doc) => {
            const u = doc.data();
            const row = document.createElement('div');
            row.style.cssText = 'display: flex; align-items: center; gap: 12px; background: #0b0b0b; border: 1px solid var(--border-color); padding: 10px 14px;';
            row.innerHTML = `<div><strong>${u.name || 'Usuario'}</strong><br><small style="color: var(--text-secondary);">${u.email || ''}</small></div>`;
            container.appendChild(row);
        });
    }).catch(() => {});
}

document.addEventListener('DOMContentLoaded', () => {
    updateCartUI();
    initStore();
    setupSearch();
    setupDareLab();
    initAdminPanel();
});
