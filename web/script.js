/* ==========================================
   DARECORE - SCRIPT DEFINITIVO Y SINCRONIZADO
   ========================================== */

let selectedCustomBaseIndex = 0;
a// --- 1. PRODUCTOS INICIALES Y SINCRONIZACIÓN CON FIREBASE ---
const defaultProducts = [
    {
        id: 1,
        category: 'inicio',
        tag: 'BEST SELLER',
        name: 'MONTE CARLO RACING #04',
        desc: 'Corte boxy, algodón peinado pesado 240g...',
        price: 599,
        image: ''
    },
    {
        id: 2,
        category: 'hombre',
        tag: '400G HEAVY',
        name: 'DARE CORE CLUB 400G',
        desc: 'Sudadera de doble capa sin cordón, ajuste boxy...',
        price: 1199,
        image: ''
    },
    {
        id: 3,
        category: 'mujer',
        tag: 'ALTO IMPACTO',
        name: "TOP DEPORTIVO 'APEX CORE'",
        desc: 'Soporte de alta firmeza con tirantes anchos cruzados...',
        price: 480,
        image: ''
    },
    {
        id: 4,
        category: 'oversize',
        tag: '240G BOXY',
        name: 'PIT LANE F1 BOXY TEE',
        desc: 'Estampado en espalda de alta densidad...',
        price: 549,
        image: ''
    }
];

let isSyncing = false;

function getProducts() {
    if (window.db && !isSyncing) {
        isSyncing = true;
        window.db.collection('products').orderBy('id', 'desc').get().then((snapshot) => {
            if (!snapshot.empty) {
                const cloudProducts = snapshot.docs.map(doc => ({ ...doc.data(), firestoreId: doc.id }));
                localStorage.setItem('darecore_products', JSON.stringify(cloudProducts));
                if (typeof renderPublicStore === 'function') renderPublicStore();
                if (typeof renderAdminList === 'function') renderAdminList();
            }
        }).catch(err => console.log("Modo offline o error al sincronizar:", err))
          .finally(() => { setTimeout(() => { isSyncing = false; }, 2000); });
    }

    const stored = localStorage.getItem('darecore_products');
    if (!stored) {
        localStorage.setItem('darecore_products', JSON.stringify(defaultProducts));
        return defaultProducts;
    }
    return JSON.parse(stored);
}

function saveProductsLocal(products) {
    localStorage.setItem('darecore_products', JSON.stringify(products));
}

// --- 2. LÓGICA DE CARRITO PÚBLICO ---
let cartCount = 0;
function setupCartButtons() {
    const badge = document.querySelector('.cart-badge');
    const addButtons = document.querySelectorAll('.btn-add');

    addButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            cartCount++;
            if (badge) badge.textContent = cartCount;
            const originalText = button.textContent;
            button.textContent = '✓ AGREGADO';
            button.style.background = '#ff3b1b';
            button.style.color = '#ffffff';
            setTimeout(() => {
                button.textContent = originalText;
                button.style.background = '';
                button.style.color = '';
            }, 1000);
        });
    });
}

// --- 3. RENDERIZAR PRODUCTOS EN LA TIENDA PÚBLICA ---
function renderPublicStore() {
    const grid = document.querySelector('.product-grid');
    if (!grid) return;

    const path = window.location.pathname.toLowerCase();
    let currentCategory = 'inicio';
    if (path.includes('hombre')) currentCategory = 'hombre';
    else if (path.includes('mujer')) currentCategory = 'mujer';
    else if (path.includes('oversize')) currentCategory = 'oversize';

    const allProducts = getProducts();
    const filtered = currentCategory === 'inicio' 
        ? allProducts 
        : allProducts.filter(p => p.category === currentCategory);

    if (filtered.length === 0) {
        grid.innerHTML = `<p style="color: var(--text-secondary); grid-column: 1/-1;">Próximamente nuevas prendas en esta sección.</p>`;
        return;
    }

    grid.innerHTML = filtered.map(prod => `
        <div class="product-card" onclick="openProductModal('${prod.id || prod.firestoreId}')" style="cursor: pointer;">
            <span class="product-tag">${prod.tag}</span>
            ${prod.image 
                ? `<img src="${prod.image}" alt="${prod.name}" class="product-img" style="object-fit: cover;">` 
                : `<div class="product-img">[ Sin foto asignada ]</div>`
            }
            <div class="product-name">${prod.name}</div>
            <div class="product-desc">${prod.desc}</div>
            <div class="product-footer">
                <span class="price">$${prod.price} <small>MXN</small></span>
                <button class="btn-add">Agregar al carrito</button>
            </div>
        </div>
    `).join('');

    setupCartButtons();
}

// --- 4. LÓGICA DEL PANEL DE ADMINISTRADOR (admin.html) ---
function setupAdminPanel() {
    const loginSection = document.getElementById('loginSection');
    const dashboardSection = document.getElementById('dashboardSection');
    const loginForm = document.getElementById('loginForm');
    const logoutBtn = document.getElementById('logoutBtn');
    const addProductForm = document.getElementById('addProductForm');
    const cancelEditBtn = document.getElementById('cancelEditBtn');

    if (!loginSection) return;

    if (sessionStorage.getItem('darecore_admin_logged') === 'true') {
        loginSection.classList.add('hidden');
        dashboardSection.classList.remove('hidden');
        logoutBtn.classList.remove('hidden');
        renderAdminList();
        renderAdminCustomBases();
    }

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const user = document.getElementById('adminUser').value.trim();
        const pass = document.getElementById('adminPass').value.trim();

        if ((user === 'admin' || user === 'admin@darecore.mx') && pass === 'darecore2026') {
            sessionStorage.setItem('darecore_admin_logged', 'true');
            loginSection.classList.add('hidden');
            dashboardSection.classList.remove('hidden');
            logoutBtn.classList.remove('hidden');
            renderAdminList();
            renderAdminCustomBases();
        } else {
            document.getElementById('loginError').style.display = 'block';
        }
    });

    logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        sessionStorage.removeItem('darecore_admin_logged');
        window.location.reload();
    });

    if (cancelEditBtn) {
        cancelEditBtn.addEventListener('click', () => {
            addProductForm.reset();
            document.getElementById('editingProductId').value = '';
            document.getElementById('formTitle').innerText = '+ NUEVA PRENDA';
            document.getElementById('formTitle').style.color = 'var(--accent-color)';
            document.getElementById('submitBtn').innerText = 'PUBLICAR EN TIENDA';
            cancelEditBtn.classList.add('hidden');
        });
    }

    addProductForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const editingId = document.getElementById('editingProductId').value;
        const fileInput = document.getElementById('prodImageFile');
        const file = fileInput.files[0];

        const category = document.getElementById('prodCategory').value;
        const tag = document.getElementById('prodTag').value.toUpperCase();
        const name = document.getElementById('prodName').value.toUpperCase();
        const desc = document.getElementById('prodDesc').value;
        const price = Number(document.getElementById('prodPrice').value);

        const products = getProducts();

        if (editingId) {
            const index = products.findIndex(p => p.id == editingId || p.firestoreId == editingId);
            if (index !== -1) {
                const updateData = { category, tag, name, desc, price };

                const saveChanges = (imgData) => {
                    if (imgData !== undefined) updateData.image = imgData;
                    
                    products[index] = { ...products[index], ...updateData };
                    saveProductsLocal(products);

                    if (window.db && products[index].firestoreId) {
                        window.db.collection('products').doc(products[index].firestoreId).update(updateData)
                            .catch(err => console.error("Error al actualizar en la nube:", err));
                    }

                    addProductForm.reset();
                    document.getElementById('editingProductId').value = '';
                    document.getElementById('formTitle').innerText = '+ NUEVA PRENDA';
                    document.getElementById('formTitle').style.color = 'var(--accent-color)';
                    document.getElementById('submitBtn').innerText = 'PUBLICAR EN TIENDA';
                    if (cancelEditBtn) cancelEditBtn.classList.add('hidden');

                    renderAdminList();
                    renderPublicStore();
                    alert('¡Prenda actualizada exitosamente!');
                };

                if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => saveChanges(event.target.result);
                    reader.readAsDataURL(file);
                } else {
                    saveChanges();
                }
            }
        } else {
            if (!file) {
                alert('Por favor selecciona una foto para la nueva prenda.');
                return;
            }

            const reader = new FileReader();
            reader.onload = function(event) {
                const newProduct = {
                    id: Date.now(),
                    category,
                    tag,
                    name,
                    desc,
                    price,
                    image: event.target.result
                };

                products.unshift(newProduct);
                saveProductsLocal(products);

                if (window.db) {
                    window.db.collection('products').add(newProduct)
                        .then((docRef) => {
                            newProduct.firestoreId = docRef.id;
                            saveProductsLocal(products);
                            renderAdminList();
                            renderPublicStore();
                        })
                        .catch((error) => console.error("Error al subir a la nube:", error));
                }

                addProductForm.reset();
                renderAdminList();
                renderPublicStore();
                alert('¡Prenda publicada exitosamente en la tienda y sincronizada en la nube!');
            };
            reader.readAsDataURL(file);
        }
    });
}

window.prepareEditProduct = function(id) {
    const products = getProducts();
    const product = products.find(p => p.id == id || p.firestoreId == id);
    if (!product) return;

    document.getElementById('editingProductId').value = product.id || product.firestoreId;
    document.getElementById('prodCategory').value = product.category || 'inicio';
    document.getElementById('prodTag').value = product.tag || '';
    document.getElementById('prodName').value = product.name || '';
    document.getElementById('prodDesc').value = product.desc || '';
    document.getElementById('prodPrice').value = product.price || '';
    document.getElementById('prodImageFile').value = '';

    document.getElementById('formTitle').innerText = '✏️ EDITAR PRENDA';
    document.getElementById('formTitle').style.color = '#3b82f6';
    document.getElementById('submitBtn').innerText = 'GUARDAR CAMBIOS';
    
    const cancelEditBtn = document.getElementById('cancelEditBtn');
    if (cancelEditBtn) cancelEditBtn.classList.remove('hidden');

    window.scrollTo({ top: 0, behavior: 'smooth' });
};

function renderAdminList() {
    const listContainer = document.getElementById('adminProductList');
    const totalCount = document.getElementById('totalCount');
    if (!listContainer) return;

    const products = getProducts();
    totalCount.textContent = products.length;

    listContainer.innerHTML = products.map(prod => `
        <div class="product-item-admin">
            <div style="display: flex; align-items: center; gap: 12px; flex-grow: 1;">
                ${prod.image 
                    ? `<img src="${prod.image}" alt="${prod.name}">` 
                    : `<div style="width:60px; height:60px; background:#202020; display:flex; align-items:center; justify-content:center; font-size:10px; color:#aaa;">Sin foto</div>`
                }
                <div>
                    <span style="font-size: 10px; color: var(--accent-color); font-weight: 700; text-transform: uppercase;">[${prod.category}] • ${prod.tag}</span>
                    <div style="font-size: 13px; font-weight: 700; color: white;">${prod.name}</div>
                    <div style="font-size: 12px; color: var(--text-secondary);">$${prod.price} MXN</div>
                </div>
            </div>
            <div style="display: flex; flex-direction: column; gap: 6px;">
                <button class="btn-edit" onclick="prepareEditProduct('${prod.id || prod.firestoreId}')" style="background: #112233; color: #3b82f6; border: 1px solid #1e3a8a; padding: 5px 10px; font-size: 10px; font-weight: 700; cursor: pointer; text-transform: uppercase;">Editar</button>
                <button class="btn-delete" onclick="deleteProduct('${prod.id || prod.firestoreId}')">Eliminar</button>
            </div>
        </div>
    `).join('');
}

window.deleteProduct = function(id) {
    if (confirm('¿Seguro que deseas eliminar esta prenda de la tienda?')) {
        const currentProducts = getProducts();
        const target = currentProducts.find(p => p.id == id || p.firestoreId == id);
        const products = currentProducts.filter(p => p.id != id && p.firestoreId != id);
        
        saveProductsLocal(products);

        if (window.db && target && target.firestoreId) {
            window.db.collection('products').doc(target.firestoreId).delete()
                .catch(err => console.error("Error al borrar de la nube:", err));
        }

        renderAdminList();
        renderPublicStore();
    }
};

// --- 5. BUSCADOR EN TIEMPO REAL ---
function setupLiveSearch() {
    const searchInput = document.querySelector('.search-box');
    if (!searchInput) return;

    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        const grid = document.querySelector('.product-grid');
        if (!grid) return;

        if (query === '') {
            renderPublicStore();
            return;
        }

        const allProducts = getProducts();
        const filtered = allProducts.filter(p => 
            (p.name && p.name.toLowerCase().includes(query)) || 
            (p.desc && p.desc.toLowerCase().includes(query)) ||
            (p.tag && p.tag.toLowerCase().includes(query))
        );

        if (filtered.length === 0) {
            grid.innerHTML = `<p style="color: var(--text-secondary); grid-column: 1/-1; text-align: center; padding: 40px;">No se encontraron productos para "${query}"</p>`;
            return;
        }

        grid.innerHTML = filtered.map(prod => `
            <div class="product-card" onclick="openProductModal('${prod.id || prod.firestoreId}')" style="cursor: pointer;">
                <span class="product-tag">${prod.tag || ''}</span>
                ${prod.image 
                    ? `<img src="${prod.image}" alt="${prod.name}" class="product-img" style="object-fit: cover;">` 
                    : `<div class="product-img">[ Sin foto asignada ]</div>`
                }
                <div class="product-name">${prod.name}</div>
                <div class="product-desc">${prod.desc}</div>
                <div class="product-footer">
                    <span class="price">$${prod.price} <small>MXN</small></span>
                    <button class="btn-add">Agregar al carrito</button>
                </div>
            </div>
        `).join('');

        setupCartButtons();
    });
}

// --- 6. MODAL DE VISTA RÁPIDA DE PRENDAS ---
window.openProductModal = function(id) {
    const products = getProducts();
    const prod = products.find(p => p.id == id || p.firestoreId == id);
    if (!prod) return;

    const existingModal = document.getElementById('productModal');
    if (existingModal) existingModal.remove();

    const modalHTML = `
        <div id="productModal" class="product-modal-overlay" onclick="closeProductModal(event)">
            <div class="product-modal-content" onclick="event.stopPropagation()">
                <button class="product-modal-close" onclick="closeProductModal()">×</button>
                <div>
                    ${prod.image 
                        ? `<img src="${prod.image}" alt="${prod.name}" class="product-modal-img">` 
                        : `<div class="product-modal-img" style="display:flex; align-items:center; justify-content:center; color:#777;">[ Sin foto asignada ]</div>`
                    }
                </div>
                <div style="display: flex; flex-direction: column; justify-content: center;">
                    <span style="font-size: 11px; color: var(--accent-color); font-weight: 700; text-transform: uppercase; margin-bottom: 8px;">${prod.tag || ''}</span>
                    <h2 style="font-size: 22px; color: white; margin-bottom: 12px; font-weight: 800;">${prod.name}</h2>
                    <p style="font-size: 14px; color: var(--text-secondary); line-height: 1.6; margin-bottom: 20px;">${prod.desc}</p>
                    <div style="font-size: 24px; font-weight: 800; color: white; margin-bottom: 25px;">
                        $${prod.price} <small style="font-size: 14px; color: var(--text-secondary);">MXN</small>
                    </div>
                    <button class="btn-primary" id="modalAddBtn" style="width: 100%; padding: 12px; font-weight: 700; cursor: pointer;">AGREGAR AL CARRITO</button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    document.getElementById('modalAddBtn').addEventListener('click', () => {
        cartCount++;
        const badge = document.querySelector('.cart-badge');
        if (badge) badge.textContent = cartCount;
        
        const btn = document.getElementById('modalAddBtn');
        btn.textContent = '✓ AGREGADO AL CARRITO';
        btn.style.background = '#ff3b1b';
        
        setTimeout(() => {
            closeProductModal();
        }, 800);
    });
};

window.closeProductModal = function(event) {
    if (event && event.target.id !== 'productModal' && !event.target.classList.contains('product-modal-close')) {
        return;
    }
    const modal = document.getElementById('productModal');
    if (modal) modal.remove();
};

// --- 7. DARE LAB: PERSONALIZACIÓN DINÁMICA Y EDICIÓN EN ADMIN ---
const defaultCustomBases = [
    { id: 0, name: 'BOXY TEE 240G', desc: 'Algodón peinado pesado', price: 550 },
    { id: 1, name: 'HEAVY HOODIE 400G', desc: 'Felpa francesa alto gramaje', price: 1099 },
    { id: 2, name: 'VARSITY JACKET BORDADA', desc: 'Chamarra de equipo', price: 1750 },
    { id: 3, name: 'TOP DEPORTIVO SEAMLESS', desc: 'Compresión gym', price: 460 }
];

function getCustomBases() {
    if (window.db) {
        window.db.collection('settings').doc('customBases').get().then((doc) => {
            if (doc.exists && doc.data().items) {
                localStorage.setItem('darecore_custom_bases', JSON.stringify(doc.data().items));
                if (document.getElementById('customBasesContainer')) renderCustomBasesPublic();
                if (document.getElementById('adminCustomBasesList')) renderAdminCustomBases();
            }
        }).catch(() => {});
    }

    const stored = localStorage.getItem('darecore_custom_bases');
    if (!stored) {
        localStorage.setItem('darecore_custom_bases', JSON.stringify(defaultCustomBases));
        return defaultCustomBases;
    }
    return JSON.parse(stored);
}

let selectedCustomBaseIndex = 0;

function renderCustomBasesPublic() {
    const container = document.getElementById('customBasesContainer');
    if (!container) return;

    const bases = getCustomBases();

    container.innerHTML = bases.map((base, idx) => `
        <div class="option-card ${idx === selectedCustomBaseIndex ? 'selected' : ''}" onclick="selectCustomBase(${idx})">
            <strong>${base.name}</strong>
            <p style="font-size: 12px; color: var(--text-secondary); margin-top: 5px;">${base.desc} - $${base.price.toLocaleString('es-MX')} MXN</p>
        </div>
    `).join('');

    updateCustomSummary();
}

window.selectCustomBase = function(index) {
    selectedCustomBaseIndex = index;
    renderCustomBasesPublic();
};

function updateCustomSummary() {
    const bases = getCustomBases();
    const selectedBase = bases[selectedCustomBaseIndex] || bases[0];
    const techSelect = document.getElementById('customTechniqueSelect');
    
    const baseNameEl = document.getElementById('summaryBaseName');
    const techNameEl = document.getElementById('summaryTechName');
    const totalPriceEl = document.getElementById('summaryTotalPrice');

    if (!baseNameEl || !techSelect || !totalPriceEl) return;

    const selectedOption = techSelect.options[techSelect.selectedIndex];
    const techName = selectedOption.value;
    const extraCost = Number(selectedOption.getAttribute('data-extra') || 0);
    const total = Number(selectedBase.price) + extraCost;

    baseNameEl.textContent = selectedBase.name;
    techNameEl.textContent = techName;
    totalPriceEl.textContent = `$${total.toLocaleString('es-MX')} MXN`;
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
            const techSelect = document.getElementById('customTechniqueSelect');
            const selectedOption = techSelect.options[techSelect.selectedIndex];
            const techName = selectedOption.value;
            const extraCost = Number(selectedOption.getAttribute('data-extra') || 0);
            const total = Number(selectedBase.price) + extraCost;

            const fileInput = document.getElementById('customDesignFile');
            const fileName = fileInput && fileInput.files[0] ? fileInput.files[0].name : 'Lo enviaré por chat';
            const notes = document.getElementById('customNotes')?.value.trim() || 'Sin notas adicionales';

            const resumen = `¡Hola DARECORE! Me gustaría solicitar un Mockup Digital en Dare Lab:\n\n• Prenda Base: ${selectedBase.name}\n• Técnica: ${techName}\n• Archivo: ${fileName}\n• Notas: ${notes}\n• Total Estimado: $${total.toLocaleString('es-MX')} MXN`;

            alert(`¡Cotización lista!\n\nPrenda: ${selectedBase.name}\nTécnica: ${techName}\nTotal Estimado: $${total.toLocaleString('es-MX')} MXN\n\nSe abrirá WhatsApp para enviar tu solicitud directamente al taller.`);

            // Cambia el número 5214770000000 por el WhatsApp real de tu negocio
            const waUrl = `https://wa.me/5214770000000?text=${encodeURIComponent(resumen)}`;
            window.open(waUrl, '_blank');
        });
    }
}

function renderAdminCustomBases() {
    const list = document.getElementById('adminCustomBasesList');
    if (!list) return;

    const bases = getCustomBases();
    list.innerHTML = bases.map((base, idx) => `
        <div style="background: #1b1b1b; border: 1px solid #333; padding: 15px;">
            <label style="font-size: 10px; color: #aaa; display: block;">PRENDA & GRAMAJE</label>
            <input type="text" id="editBaseName_${idx}" value="${base.name}" style="width: 100%; padding: 6px; margin: 4px 0 10px; font-size: 12px;">
            
            <label style="font-size: 10px; color: #aaa; display: block;">DESCRIPCIÓN</label>
            <input type="text" id="editBaseDesc_${idx}" value="${base.desc}" style="width: 100%; padding: 6px; margin: 4px 0 10px; font-size: 12px;">
            
            <label style="font-size: 10px; color: #aaa; display: block;">PRECIO BASE (MXN)</label>
            <input type="number" id="editBasePrice_${idx}" value="${base.price}" style="width: 100%; padding: 6px; margin: 4px 0 12px; font-size: 12px;">
            
            <button onclick="saveCustomBaseAdmin(${idx})" style="background: var(--accent-color); color: white; border: none; width: 100%; padding: 8px; font-weight: 700; font-size: 11px; cursor: pointer;">GUARDAR CAMBIOS</button>
        </div>
    `).join('');
}

window.saveCustomBaseAdmin = function(idx) {
    const bases = getCustomBases();
    bases[idx].name = document.getElementById(`editBaseName_${idx}`).value.trim().toUpperCase();
    bases[idx].desc = document.getElementById(`editBaseDesc_${idx}`).value.trim();
    bases[idx].price = Number(document.getElementById(`editBasePrice_${idx}`).value);

    localStorage.setItem('darecore_custom_bases', JSON.stringify(bases));

    if (window.db) {
        window.db.collection('settings').doc('customBases').set({ items: bases })
            .catch(err => console.error("Error al sincronizar bases en la nube:", err));
    }

    alert('¡Base y precio actualizados correctamente!');
    renderAdminCustomBases();
};

// --- INICIALIZAR TODO AL CARGAR LA PÁGINA ---
document.addEventListener('DOMContentLoaded', () => {
    renderPublicStore();
    setupAdminPanel();
    setupLiveSearch();
    setupDareLab();
});
document.addEventListener('DOMContentLoaded', () => {
    initStore();
    setupSearch();
    setupDareLab();
    initAdminPanel();
});

/* ==========================================
   1. GESTIÓN DE PRODUCTOS Y TIENDA PÚBLICA
   ========================================== */
function getStoredProducts() {
    const local = localStorage.getItem('darecore_products');
    if (local) {
        try { 
            const parsed = JSON.parse(local);
            if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        } catch (e) { /* fallback */ }
    }
    return getDefaultProducts();
}

function getDefaultProducts() {
    return [
        { id: 1, category: 'inicio', tag: 'BEST SELLER', name: 'MONTE CARLO RACING #04', desc: 'Corte boxy, al igual & pesada oblatura...', price: 599, image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=600&q=80' },
        { id: 2, category: 'inicio', tag: '400G HEAVYWEIGHT', name: 'DARE CORE CLUB 400G', desc: 'Sudadera de doble capa sin cordón...', price: 1199, image: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=600&q=80' },
        { id: 3, category: 'inicio', tag: 'GYM PERFORMANCE', name: "GYM TEE 'DISCIPLINE & POWER'", desc: 'Max tela / algodón con alta densidad...', price: 499, image: 'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?auto=format&fit=crop&w=600&q=80' },
        { id: 4, category: 'inicio', tag: 'EDICIÓN LIMITADA', name: "VARSITY JACKET 'LEÓN'", desc: 'Cuerina de alta gramaje y alta protección...', price: 1899, image: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=600&q=80' }
    ];
}

function initStore() {
    const grid = document.getElementById('productGrid');
    if (!grid) return;
    
    const products = getStoredProducts();
    renderProducts(products);
}

function renderProducts(products) {
    const grid = document.getElementById('productGrid');
    if (!grid) return;
    
    grid.innerHTML = '';
    if (!products || products.length === 0) {
        grid.innerHTML = '<p style="color: #666; grid-column: span 4; text-align: center; padding: 30px;">No hay prendas disponibles en este momento.</p>';
        return;
    }

    products.forEach(p => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.style.cursor = 'pointer';

        card.innerHTML = `
            ${p.tag ? `<span class="product-tag">${p.tag}</span>` : ''}
            <div class="product-img" style="background-image: url('${p.image || ''}'); background-size: cover; background-position: center; height: 220px; display: flex; align-items: center; justify-content: center; color: #666;"></div>
            <div class="product-name" style="font-weight: 700; margin-top: 10px;">${p.name}</div>
            <div class="product-desc" style="font-size: 11px; color: #666; margin-bottom: 10px;">${p.desc}</div>
            <div class="product-footer" style="display: flex; justify-content: space-between; align-items: center; margin-top: auto;">
                <span class="price" style="font-weight: 800;">$${Number(p.price).toLocaleString('es-MX')} <small>MXN</small></span>
                <button class="btn-add" onclick="event.stopPropagation(); openProductModal('${p.id}')">Agregar</button>
            </div>
        `;
        
        card.addEventListener('click', () => {
            openProductModal(p.id);
        });

        grid.appendChild(card);
    });
}

/* ==========================================
   2. BUSCADOR EN VIVO
   ========================================== */
function setupSearch() {
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) return;

    searchInput.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase().trim();
        const products = getStoredProducts();
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
    const product = products.find(p => p.id == productId);
    if (!product) return;

    let modalOverlay = document.getElementById('quickViewModal');
    if (!modalOverlay) {
        modalOverlay = document.createElement('div');
        modalOverlay.id = 'quickViewModal';
        modalOverlay.className = 'product-modal-overlay';
        document.body.appendChild(modalOverlay);
    }

    modalOverlay.innerHTML = `
        <div class="product-modal-content">
            <button class="product-modal-close" onclick="closeProductModal()">&times;</button>
            <div class="product-modal-img" style="background-image: url('${product.image}'); background-size: cover; background-position: center;"></div>
            <div style="display: flex; flex-direction: column; justify-content: center; color: #ffffff;">
                <span style="color: #ff3b1b; font-size: 11px; font-weight: 700; text-transform: uppercase; margin-bottom: 5px;">${product.tag || 'DARECORE'}</span>
                <h2 style="font-size: 22px; font-weight: 900; margin-bottom: 10px; color: #ffffff;">${product.name}</h2>
                <p style="color: #aaaaaa; font-size: 13px; margin-bottom: 15px;">${product.desc}</p>
                <div style="font-size: 20px; font-weight: 800; color: #ffffff; margin-bottom: 20px;">$${Number(product.price).toLocaleString('es-MX')} MXN</div>
                <button class="btn-primary" onclick="alert('¡Producto agregado al carrito exitosamente!'); closeProductModal();">Agregar al Carrito</button>
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
        { id: 'b2', name: 'Playera Boxy Fit Heavy (280g)', price: 550, desc: 'Corte urbano relajado, cuello robusto.' },
        { id: 'b3', name: 'Sweater Crewneck Minimal (350g)', price: 980, desc: 'Silueta clásica estructurada.' }
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

            alert(`¡Cotización lista!\n\nPrenda: ${selectedBase.name}\nTécnica: ${techName}\nTotal Estimado: $${total.toLocaleString('es-MX')} MXN\n\nSe abrirá WhatsApp para enviar tu solicitud directamente al taller.`);

            const waUrl = `https://wa.me/5214770000000?text=${encodeURIComponent(resumen)}`;
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
        card.style.cssText = "background: #f5f5f5; border: 2px solid #dcdcdc; padding: 15px; cursor: pointer; transition: all 0.2s;";
        
        card.innerHTML = `
            <div style="font-weight: 800; font-size: 14px; color: #111111; margin-bottom: 5px;">${base.name}</div>
            <div style="font-size: 12px; color: #666666; margin-bottom: 10px;">${base.desc}</div>
            <div style="font-weight: 900; font-size: 15px; color: #ff3b1b;">$${Number(base.price).toLocaleString('es-MX')} MXN</div>
        `;

        card.addEventListener('click', () => {
            selectedCustomBaseIndex = index;
            document.querySelectorAll('#customBasesContainer .option-card').forEach(c => {
                c.classList.remove('selected');
                c.style.borderColor = '#dcdcdc';
                c.style.background = '#f5f5f5';
            });
            card.classList.add('selected');
            card.style.borderColor = '#ff3b1b';
            card.style.background = '#ffffff';
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

    const summaryBase = document.getElementById('summaryBase');
    const summaryTech = document.getElementById('summaryTech');
    const summaryTotal = document.getElementById('summaryTotal');

    if (summaryBase) summaryBase.innerText = selectedBase.name;
    if (summaryTech) summaryTech.innerText = selectedOption ? selectedOption.value : '';
    if (summaryTotal) summaryTotal.innerText = `$${totalPrice.toLocaleString('es-MX')} MXN`;
}

/* ==========================================
   5. PANEL DE ADMINISTRACIÓN (`admin.html`)
   ========================================== */
function initAdminPanel() {
    const loginForm = document.getElementById('loginForm');
    if (!loginForm) return;

    const loginSection = document.getElementById('loginSection');
    const dashboardSection = document.getElementById('dashboardSection');
    const logoutBtn = document.getElementById('logoutBtn');

    if (localStorage.getItem('darecore_admin_logged') === 'true') {
        loginSection.classList.add('hidden');
        dashboardSection.classList.remove('hidden');
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
            loginSection.classList.add('hidden');
            dashboardSection.classList.remove('hidden');
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
                <button type="button" class="btn-primary" style="padding: 6px 10px; font-size: 10px;" onclick="editProduct('${p.id}')">Editar</button>
                <button type="button" class="btn-delete" onclick="deleteProduct('${p.id}')">Eliminar</button>
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
                if (p.id == editingId) {
                    return {
                        ...p,
                        name,
                        category,
                        tag,
                        desc,
                        price,
                        image: imgUrl || p.image
                    };
                }
                return p;
            });
            alert('¡Prenda actualizada con éxito!');
        } else {
            const newProduct = {
                id: 'prod_' + Date.now(),
                category,
                tag,
                name,
                desc,
                price,
                image: imgUrl || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=600&q=80'
            };
            products.unshift(newProduct);
            alert('¡Prenda publicada con éxito!');
        }

        localStorage.setItem('darecore_products', JSON.stringify(products));
        
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
        reader.onload = function(event) {
            saveProductData(event.target.result);
        };
        reader.readAsDataURL(imageFile);
    } else {
        if (editingId) {
            const existing = products.find(p => p.id == editingId);
            saveProductData(existing ? existing.image : null);
        } else {
            saveProductData('https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=600&q=80');
        }
    }
}

function editProduct(productId) {
    const products = getStoredProducts();
    const product = products.find(p => p.id == productId);
    if (!product) return;

    document.getElementById('editingProductId').value = product.id;
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
    products = products.filter(p => p.id != productId);
    localStorage.setItem('darecore_products', JSON.stringify(products));

    loadAdminProducts();
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
        alert('¡Base personalizada actualizada con éxito!');
        loadAdminCustomBases();
    }
}
