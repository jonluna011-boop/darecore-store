// --- 1. PRODUCTOS INICIALES Y SINCRONIZACIÓN CON FIREBASE ---
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

// Cargar productos desde Firebase Firestore (con respaldo en LocalStorage)
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

// Guardar lista en memoria local
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
            e.stopPropagation(); // Evita que se abra el modal al dar clic en el botón rápido
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
                    if (imgData !== undefined) {
                        updateData.image = imgData;
                    }
                    
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
                    reader.onload = function(event) {
                        saveChanges(event.target.result);
                    };
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

// --- 5. BUSCADOR EN TIEMPO REAL (Con soporte para clic y modal) ---
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

// --- INICIALIZAR TODO AL CARGAR LA PÁGINA ---
document.addEventListener('DOMContentLoaded', () => {
    renderPublicStore();
    setupAdminPanel();
    setupLiveSearch();
});
