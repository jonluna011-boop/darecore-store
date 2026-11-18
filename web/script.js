/* ==========================================
   DARECORE - SCRIPT PRINCIPAL & DARE LAB
   ========================================== */

// Configuración global o estado de la aplicación
let selectedCustomBaseIndex = 0;

document.addEventListener('DOMContentLoaded', () => {
    // Inicializar funciones principales al cargar la página
    initStore();
    setupSearch();
    setupDareLab();
});

/* --- 1. GESTIÓN DE PRODUCTOS Y TIENDA --- */
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
    
    renderProducts(getStoredProducts());
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
            <div class="product-img" style="background-image: url('${p.image}'); background-size: cover; background-position: center;"></div>
            <div class="product-name">${p.name}</div>
            <div class="product-desc">${p.desc}</div>
            <div class="product-footer">
                <span class="price">$${Number(p.price).toLocaleString('es-MX')} MXN</span>
                <button class="btn-add" onclick="openProductModal(${p.id})">Ver / Comprar</button>
            </div>
        `;
        grid.appendChild(card);
    });
}

/* --- 2. BUSCADOR EN VIVO --- */
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

/* --- 3. MODAL DE VISTA RÁPIDA --- */
function openProductModal(productId) {
    const products = getStoredProducts();
    const product = products.find(p => p.id === productId);
    if (!product) return;

    // Crear modal si no existe
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
    if (modalOverlay) {
        modalOverlay.style.display = 'none';
    }
}

/* --- 4. DARE LAB (ESTUDIO DE PERSONALIZACIÓN DINÁMICO) --- */
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
        // Soporte completo para touch y click en celulares y computadoras
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

            // Cambia '5214770000000' por tu número real con código de país y LADA
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
