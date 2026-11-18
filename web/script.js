/* ==========================================
   DARECORE - SCRIPT COMPLETO UNIFICADO
   ========================================== */

let selectedCustomBaseIndex = 0;

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
        try { return JSON.parse(local); } catch (e) { return getDefaultProducts(); }
    }
    return getDefaultProducts();
}

function getDefaultProducts() {
    return [
        { id: 1, category: 'hoodies', tag: 'NEW', name: 'Hoodie Oversized DareCore', desc: 'Algodón pesado 380g, corte boxy fit.', price: 1150, image: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=600&q=80' },
        { id: 2, category: 'tees', tag: 'BESTSELLER', name: 'Playera Minimalista Heavyweight', desc: '100% algodón peinado 280g.', price: 550, image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=600&q=80' },
        { id: 3, category: 'hoodies', tag: 'LIMITED', name: 'Hoodie Cyberpunk Edition', desc: 'Diseño exclusivo serigrafía HD.', price: 1250, image: 'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?auto=format&fit=crop&w=600&q=80' },
        { id: 4, category: 'accessories', tag: 'HOT', name: 'Gorra Dad Hat DareCore', desc: 'Bordado frontal 3D alta definición.', price: 420, image: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=600&q=80' }
    ];
}

function initStore() {
    const grid = document.getElementById('productGrid');
    if (!grid) return;
    
    // Intentar sincronizar con Firebase si está disponible
    if (window.db) {
        window.db.collection('dare-core-store').get().then(snapshot => {
            if (!snapshot.empty) {
                const cloudProducts = [];
                snapshot.forEach(doc => {
                    cloudProducts.push({ firestoreId: doc.id, ...doc.data() });
                });
                localStorage.setItem('darecore_products', JSON.stringify(cloudProducts));
                renderProducts(cloudProducts);
            } else {
                renderProducts(getStoredProducts());
            }
        }).catch(err => {
            console.warn("Usando respaldo local:", err);
            renderProducts(getStoredProducts());
        });
    } else {
        renderProducts(getStoredProducts());
    }
}

function renderProducts(products) {
    const grid = document.getElementById('productGrid');
    if (!grid) return;
    
    grid.innerHTML = '';
    products.forEach(p => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
            ${p.tag ? `<span class="product-tag">${p.tag}</span>` : ''}
            <div class="product-img" style="background-image: url('${p.image || ''}'); background-size: cover; background-position: center;"></div>
            <div class="product-name">${p.name}</div>
            <div class="product-desc">${p.desc}</div>
            <div class="product-footer">
                <span class="price">$${Number(p.price).toLocaleString('es-MX')} MXN</span>
                <button class="btn-add" onclick="openProductModal(${p.id || '\'' + p.firestoreId + '\''})">Ver / Comprar</button>
            </div>
        `;
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
            p.name.toLowerCase().includes(term) || 
            p.desc.toLowerCase().includes(term) ||
            (p.category && p.category.toLowerCase().includes(term)) ||
            (p.tag && p.tag.toLowerCase().includes(term))
        );
        renderProducts(filtered);
    });
}

/* ==========================================
   3. MODAL DE VISTA RÁPIDA
   ========================================== */
function openProductModal(productId) {
    const products = getStoredProducts();
    const product = products.find(p => p.id === productId || p.firestoreId === productId);
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
   4. DARE LAB (PERSONALIZACIÓN DINÁMICA)
   ========================================== */
function getCustomBases() {
    const local = localStorage.getItem('darecore_custom_bases');
    if (local) {
        try { return JSON.parse(local); } catch (e) { return getDefaultCustomBases(); }
    }
    return getDefaultCustomBases();
}

function getDefaultCustomBases() {
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
            const selectedOption = techSelectElement.options[techSelectElement.selectedIndex];
            const techName = selectedOption.value;
            const extraCost = Number(selectedOption.getAttribute('data-extra') || 0);
            const total = Number(selectedBase.price) + extraCost;

            const fileInput = document.getElementById('customDesignFile');
            const fileName = fileInput && fileInput.files[0] ? fileInput.files[0].name : 'Lo enviaré por chat';
            const notes = document.getElementById('customNotes')?.value.trim() || 'Sin notas adicionales';

            const resumen = `¡Hola DARECORE! Me gustaría solicitar un Mockup Digital en Dare Lab:\n\n• Prenda Base: ${selectedBase.name}\n• Técnica: ${techName}\n• Archivo: ${fileName}\n• Notas: ${notes}\n• Total Estimado: $${total.toLocaleString('es-MX')} MXN`;

            alert(`¡Cotización lista!\n\nPrenda: ${selectedBase.name}\nTécnica: ${techName}\nTotal Estimado: $${total.toLocaleString('es-MX')} MXN\n\nSe abrirá WhatsApp para enviar tu solicitud directamente al taller.`);

            // Reemplaza 5214770000000 con tu número real de WhatsApp con código de país
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
    const extraCost = Number(selectedOption.getAttribute('data-extra') || 0);
    const totalPrice = Number(selectedBase.price) + extraCost;

    const summaryBase = document.getElementById('summaryBase');
    const summaryTech = document.getElementById('summaryTech');
    const summaryTotal = document.getElementById('summaryTotal');

    if (summaryBase) summaryBase.innerText = selectedBase.name;
    if (summaryTech) summaryTech.innerText = selectedOption.value;
    if (summaryTotal) summaryTotal.innerText = `$${totalPrice.toLocaleString('es-MX')} MXN`;
}

/* ==========================================
   5. PANEL DE ADMINISTRACIÓN (`admin.html`)
   ========================================== */
function initAdminPanel() {
    const loginForm = document.getElementById('loginForm');
    if (!loginForm) return; // Si no estamos en admin.html, salir

    const loginSection = document.getElementById('loginSection');
    const dashboardSection = document.getElementById('dashboardSection');
    const logoutBtn = document.getElementById('logoutBtn');

    // Comprobar sesión activa previa
    if (localStorage.getItem('darecore_admin_logged') === 'true') {
        loginSection.classList.add('hidden');
        dashboardSection.classList.remove('hidden');
        logoutBtn.classList.remove('hidden');
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
            logoutBtn.classList.remove('hidden');
            loadAdminProducts();
            loadAdminCustomBases();
        } else {
            errorMsg.style.display = 'block';
        }
    });

    logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.removeItem('darecore_admin_logged');
        window.location.reload();
    });

    // Manejador del formulario para agregar/editar productos
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
            <img src="${p.image}" alt="${p.name}">
            <div style="flex-grow: 1; color: white;">
                <div style="font-weight: 700; font-size: 13px;">${p.name}</div>
                <div style="font-size: 11px; color: #888;">${p.category} | $${p.price} MXN</div>
            </div>
            <button class="btn-delete" onclick="deleteProduct(${p.id || '\'' + p.firestoreId + '\''})">Eliminar</button>
        `;
        container.appendChild(item);
    });
}

function handleProductSubmit(e) {
    e.preventDefault();
    const name = document.getElementById('prodName').value;
    const category = document.getElementById('prodCategory').value;
    const tag = document.getElementById('prodTag').value;
    const desc = document.getElementById('prodDesc').value;
    const price = Number(document.getElementById('prodPrice').value);
    const imageFile = document.getElementById('prodImageFile').files[0];

    const saveProductData = (imgUrl) => {
        const products = getStoredProducts();
        const newProduct = {
            id: Date.now(),
            category,
            tag,
            name,
            desc,
            price,
            image: imgUrl || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=600&q=80'
        };

        products.unshift(newProduct);
        localStorage.setItem('darecore_products', JSON.stringify(products));

        if (window.db) {
            window.db.collection('dare-core-store').add(newProduct).then(() => {
                alert('¡Prenda publicada y guardada en Firebase con éxito!');
                document.getElementById('addProductForm').reset();
                loadAdminProducts();
            }).catch(err => {
                console.error(err);
                alert('Guardado localmente. Error al sincronizar con Firebase.');
                document.getElementById('addProductForm').reset();
                loadAdminProducts();
            });
        } else {
            alert('¡Prenda publicada con éxito!');
            document.getElementById('addProductForm').reset();
            loadAdminProducts();
        }
    };

    if (imageFile) {
        const reader = new FileReader();
        reader.onload = function(event) {
            saveProductData(event.target.result);
        };
        reader.readAsDataURL(imageFile);
    } else {
        saveProductData('https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=600&q=80');
    }
}

function deleteProduct(productId) {
    if (!confirm('¿Estás seguro de eliminar esta prenda?')) return;
    
    let products = getStoredProducts();
    products = products.filter(p => p.id !== productId && p.firestoreId !== productId);
    localStorage.setItem('darecore_products', JSON.stringify(products));

    if (window.db) {
        window.db.collection('dare-core-store').where('id', '==', productId).get().then(snapshot => {
            snapshot.forEach(doc => doc.ref.delete());
        }).catch(err => console.log(err));
    }

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
        box.style.cssText = "background: #0b0b0b; border: 1px solid #222; padding: 15px;";
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
