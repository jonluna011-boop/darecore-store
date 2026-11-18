/* ==========================================
   DARECORE - SCRIPT MAESTRO DEFINITIVO Y UNIFICADO
   ========================================== */

let selectedCustomBaseIndex = 0;
let cart = JSON.parse(localStorage.getItem('darecore_cart')) || [];
let isSyncing = false;

document.addEventListener('DOMContentLoaded', () => {
    initStore();
    setupSearch();
    setupDareLab();
    initAdminPanel();
    initCartSystem();
});

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
                <button onclick="addToCart('${product.id || product.firestoreId}'); closeProductModal();" style="background:#ff3b1b; color:#fff; border:none; padding:12px; font-weight:700; cursor:pointer; text-transform: uppercase;">Agregar al Carrito</button>
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
        mockupBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const bases = getCustomBases();
            const selectedBase = bases[selectedCustomBaseIndex] || bases[0];
            const techSelectElement = document.getElementById('customTechniqueSelect');
            const selectedOption = techSelectElement ? techSelectElement.options[techSelectElement.selectedIndex] : null;
            const techName = selectedOption ? selectedOption.value : 'Estándar';
            const extraCost = selectedOption ? Number(selectedOption.getAttribute('data-extra') || 0) : 0;
            const total = Number(selectedBase.price) + extraCost;

            const fileInput = document.getElementById('customDesignFile');
            const fileName = fileInput && fileInput.files[0] ? fileInput.files[0].name : 'Lo enviaré por chat';
            const notes = document.getElementById('customNotes')?.value.trim() || 'Sin notas adicionales';

            const resumen = `¡Hola DARECORE! Me gustaría solicitar un Mockup Digital en Dare Lab:\n\n• Prenda Base: ${selectedBase.name}\n• Técnica: ${techName}\n• Archivo: ${fileName}\n• Notas: ${notes}\n• Total Estimado: $${total.toLocaleString('es-MX')} MXN`;

            const waUrl = `https://wa.me/5214777035509?text=${encodeURIComponent(resumen)}`;
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
   5. SISTEMA DE CARRITO Y PAGOS
   ========================================== */
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

function saveCart() {
    localStorage.setItem('darecore_cart', JSON.stringify(cart));
}

function updateCartUI() {
    const badges = document.querySelectorAll('.cart-badge');
    const totalCount = cart.reduce((sum, item) => sum + item.qty, 0);
    badges.forEach(b => b.innerText = totalCount);
}

function initCartSystem() {
    updateCartUI();

    const cartBtns = document.querySelectorAll('.cart-btn');
    cartBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            openCartModal();
        });
    });
}

function openCartModal() {
    let modalOverlay = document.getElementById('cartModalOverlay');
    if (!modalOverlay) {
        modalOverlay = document.createElement('div');
        modalOverlay.id = 'cartModalOverlay';
        modalOverlay.style.cssText = "display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.85); z-index:9999; justify-content:flex-end; align-items:stretch;";
        document.body.appendChild(modalOverlay);
    }

    let subtotal = cart.reduce((sum, item) => sum + (Number(item.price) * item.qty), 0);

    let itemsHtml = '';
    if (cart.length === 0) {
        itemsHtml = '<p style="color:#888; text-align:center; padding:40px;">Tu carrito está vacío.</p>';
    } else {
        itemsHtml = cart.map((item, idx) => `
            <div style="display:flex; gap:12px; align-items:center; background:#1a1a1a; padding:10px; border-radius:4px; margin-bottom:10px;">
                <img src="${item.image}" style="width:50px; height:50px; object-fit:cover; border-radius:4px;">
                <div style="flex-grow:1;">
                    <div style="font-weight:700; font-size:12px; color:#fff;">${item.name}</div>
                    <div style="font-size:11px; color:#888;">$${item.price} MXN x ${item.qty}</div>
                </div>
                <button onclick="removeFromCart(${idx})" style="background:none; border:none; color:#ff3b1b; cursor:pointer; font-size:16px;">&times;</button>
            </div>
        `).join('');
    }

    modalOverlay.innerHTML = `
        <div style="background:#111; width:400px; max-width:100%; padding:25px; display:flex; flex-direction:column; justify-content:space-between; box-shadow: -5px 0 15px rgba(0,0,0,0.5);">
            <div>
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; border-bottom:1px solid #222; padding-bottom:10px;">
                    <h3 style="color:#fff; font-size:16px; margin:0;">CARRITO DE COMPRAS</h3>
                    <button onclick="closeCartModal()" style="background:none; border:none; color:#fff; font-size:24px; cursor:pointer;">&times;</button>
                </div>
                <div style="max-height:50vh; overflow-y:auto;">
                    ${itemsHtml}
                </div>
            </div>
            <div>
                <div style="border-top:1px solid #222; padding-top:15px; margin-bottom:15px; display:flex; justify-content:space-between; color:#fff; font-weight:800; font-size:16px;">
                    <span>Subtotal a Pagar:</span>
                    <span style="color:#ff3b1b;">$${subtotal.toLocaleString('es-MX')} MXN</span>
                </div>
                <button onclick="checkoutCart()" style="background:#ff3b1b; color:#fff; border:none; width:100%; padding:12px; font-weight:700; cursor:pointer; text-transform:uppercase; margin-bottom:10px;">Proceder al Pago</button>
                <button onclick="openGoogleAuthModal()" style="background:#fff; color:#111; border:none; width:100%; padding:10px; font-weight:700; cursor:pointer; font-size:12px;">Iniciar Sesión con Google</button>
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
    openCartModal();
}

function checkoutCart() {
    if (cart.length === 0) {
        alert('Tu carrito está vacío.');
        return;
    }
    const subtotal = cart.reduce((sum, item) => sum + (Number(item.price) * item.qty), 0);
    const detalle = cart.map(item => `• ${item.qty}x ${item.name} ($${item.price} MXN)`).join('\n');
    const mensaje = `¡Hola DARECORE! Me gustaría finalizar mi pedido:\n\n${detalle}\n\nTotal a Pagar: $${subtotal.toLocaleString('es-MX')} MXN`;
    
    window.open(`https://wa.me/5214777035509?text=${encodeURIComponent(mensaje)}`, '_blank');
}

function openGoogleAuthModal() {
    // 1. Verificamos que Firebase Auth esté disponible globalmente
    if (!window.auth) {
        alert("Firebase Auth no está inicializado.");
        return;
    }
    
    // 2. Creamos el proveedor de Google
    const provider = new firebase.auth.GoogleAuthProvider();
    
    // 3. Forzamos que siempre muestre el selector de cuentas
    provider.setCustomParameters({
        'prompt': 'select_account'
    });

    // 4. Abrimos la ventana emergente oficial
    window.auth.signInWithPopup(provider)
        .then((result) => {
            const user = result.user;
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
