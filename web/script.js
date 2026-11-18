// --- 1. PRODUCTOS INICIALES POR DEFECTO ---
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

// Cargar productos guardados o iniciar con los de defecto
function getProducts() {
    const stored = localStorage.getItem('darecore_products');
    if (!stored) {
        localStorage.setItem('darecore_products', JSON.stringify(defaultProducts));
        return defaultProducts;
    }
    return JSON.parse(stored);
}

function saveProducts(products) {
    localStorage.setItem('darecore_products', JSON.stringify(products));
}

// --- 2. LÓGICA DE CARRITO PÚBLICO ---
let cartCount = 0;
function setupCartButtons() {
    const badge = document.querySelector('.cart-badge');
    const addButtons = document.querySelectorAll('.btn-add');

    addButtons.forEach(button => {
        button.addEventListener('click', () => {
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
        <div class="product-card">
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

    addProductForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const fileInput = document.getElementById('prodImageFile');
        const file = fileInput.files[0];

        if (!file) return;

        const reader = new FileReader();
        reader.onload = function(event) {
            const newProduct = {
                id: Date.now(),
                category: document.getElementById('prodCategory').value,
                tag: document.getElementById('prodTag').value.toUpperCase(),
                name: document.getElementById('prodName').value.toUpperCase(),
                desc: document.getElementById('prodDesc').value,
                price: Number(document.getElementById('prodPrice').value),
                image: event.target.result
            };

            const products = getProducts();
            products.unshift(newProduct);
            saveProducts(products);

            addProductForm.reset();
            renderAdminList();
            alert('¡Prenda publicada exitosamente en la tienda!');
        };
        reader.readAsDataURL(file);
    });
}

function renderAdminList() {
    const listContainer = document.getElementById('adminProductList');
    const totalCount = document.getElementById('totalCount');
    if (!listContainer) return;

    const products = getProducts();
    totalCount.textContent = products.length;

    listContainer.innerHTML = products.map(prod => `
        <div class="product-item-admin">
            <div style="display: flex; align-items: center; gap: 12px;">
                ${prod.image 
                    ? `<img src="${prod.image}" alt="${prod.name}">` 
                    : `<div style="width:60px; height:60px; background:#222; display:flex; align-items:center; justify-content:center; font-size:10px; color:#777;">Sin foto</div>`
                }
                <div>
                    <span style="font-size: 10px; color: var(--accent-color); font-weight: 700; text-transform: uppercase;">[${prod.category}] • ${prod.tag}</span>
                    <div style="font-size: 13px; font-weight: 700;">${prod.name}</div>
                    <div style="font-size: 12px; color: var(--text-secondary);">$${prod.price} MXN</div>
                </div>
            </div>
            <button class="btn-delete" onclick="deleteProduct(${prod.id})">Eliminar</button>
        </div>
    `).join('');
}

window.deleteProduct = function(id) {
    if (confirm('¿Seguro que deseas eliminar esta prenda de la tienda?')) {
        const products = getProducts().filter(p => p.id !== id);
        saveProducts(products);
        renderAdminList();
    }
};

document.addEventListener('DOMContentLoaded', () => {
    renderPublicStore();
    setupAdminPanel();
});

/* Forzar tarjetas de productos generales a fondo claro */
