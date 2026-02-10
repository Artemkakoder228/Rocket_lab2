const canvas = document.getElementById('canvas');
const viewport = document.getElementById('viewport');

// Змінні для позиції
let currentX = 0; 
let currentY = 0; 
let isDragging = false;
let startX, startY;
let scale = 1;              // Поточний масштаб
const MIN_SCALE = 0.3;      // Мінімальне зменшення
const MAX_SCALE = 3.0;      // Максимальне збільшення
const ZOOM_SPEED = 0.001;
const NODE_WIDTH = 150;
const NODE_HEIGHT = 145;

const treeNodes = [
    // === ГРУПА 1: КОРПУС ТА ЕНЕРГІЯ (Вантажний відсік -> Герметизація -> Панелі) ===
    { 
        id: 'g1_1', name: 'Вантажний Відсік', tier: 'I', 
        desc: 'Базовий модуль для перевезення корисного вантажу.', 
        x: 1000, y: 1000, 
        req: null, owned: true, img: 'images/Korpus.png',
        rocketKey: 'cargo', level: 1,
        cost: { iron: 0, fuel: 0, coins: 0 }
    },
    { 
        id: 'g1_2', name: 'Герметизація', tier: 'II', 
        desc: 'Покращена ізоляція відсіку для захисту вантажу.', 
        x: 1250, y: 1000, 
        req: 'g1_1', owned: false, img: 'images/Korpus.png',
        rocketKey: 'cargo', level: 2,
        cost: { iron: 600, fuel: 200, coins: 400 }
    },
    // Розвилка: Вгору (Панель керування) / Вниз (Сонячні панелі)
    { 
        id: 'g1_up', name: 'Панель Оновлення', tier: 'III', 
        desc: 'Система розподілу енергії для нових модулів.', 
        x: 1500, y: 900, 
        req: 'g1_2', owned: false, img: 'images/Korpus.png',
        rocketKey: 'cabin', level: 2,
        cost: { iron: 500, fuel: 150, coins: 500 }
    },
    { 
        id: 'g1_down', name: 'Сонячні Панелі', tier: 'III', 
        desc: 'Розкладні фотоелементи для генерації енергії.', 
        x: 1500, y: 1100, 
        req: 'g1_2', owned: false, img: 'images/Bataries.png',
        rocketKey: 'solar', level: 1,
        cost: { iron: 400, fuel: 100, coins: 450 }
    },
    // Фінал гілки
    { 
        id: 'g1_end', name: 'Нові Панелі MK-II', tier: 'IV', 
        desc: 'Високоефективні панелі подвійної площі.', 
        x: 1750, y: 1100, // Йде від g1_down
        req: 'g1_down', owned: false, img: 'images/Bataries.png',
        rocketKey: 'solar', level: 2,
        cost: { iron: 300, fuel: 200, coins: 600 }
    },


    // === ГРУПА 2: ДВИГУНИ (Турбо-форсаж -> Покращення / Бокові турбіни) ===
    { 
        id: 'g2_1', name: 'Турбо-Форсаж', tier: 'I', 
        desc: 'Система впорскування палива для різкого ривка.', 
        x: 1000, y: 1400, 
        req: null, owned: true, img: 'images/Turbina.png',
        rocketKey: 'engine', level: 1,
        cost: { iron: 0, fuel: 0, coins: 0 }
    },
    { 
        id: 'g2_up', name: 'Покращений Форсаж', tier: 'II', 
        desc: 'Оптимізована камера згоряння для економії палива.', 
        x: 1250, y: 1300, 
        req: 'g2_1', owned: false, img: 'images/Turbina.png',
        rocketKey: 'engine', level: 2,
        cost: { iron: 550, fuel: 350, coins: 700 }
    },
    { 
        id: 'g2_down', name: 'Бокові Турбіни', tier: 'II', 
        desc: 'Додаткові маневрові двигуни на корпусі.', 
        x: 1250, y: 1500, 
        req: 'g2_1', owned: false, img: 'images/Turbina.png',
        rocketKey: 'booster', level: 1,
        cost: { iron: 400, fuel: 250, coins: 500 }
    },


    // === ГРУПА 3: ЗАХИСТ ТА ЗБРОЯ ===
    // Лінія 1: Ніс/Щит
    { 
        id: 'g3_a1', name: 'Керамічний Щит', tier: 'I', 
        desc: 'Термостійке покриття проти атмосферного тертя.', 
        x: 1000, y: 1700, 
        req: null, owned: true, img: 'images/Nose.png',
        rocketKey: 'nose', level: 1,
        cost: { iron: 0, fuel: 0, coins: 0 }
    },
    { 
        id: 'g3_a2', name: 'Нова Верхівка', tier: 'II', 
        desc: 'Посилений титановий конус для пробиття хмар.', 
        x: 1250, y: 1700, 
        req: 'g3_a1', owned: false, img: 'images/Nose.png',
        rocketKey: 'nose', level: 2,
        cost: { iron: 350, fuel: 150, coins: 480 }
    },

    // Лінія 2: Зброя (Бластери)
    { 
        id: 'g3_b1', name: 'Бластер', tier: 'I', 
        desc: 'Лазерна установка для знищення астероїдів.', 
        x: 1000, y: 1900, 
        req: null, owned: true, img: 'images/Blasters.png', // Якщо є іконка
        rocketKey: 'weapons', level: 1,
        cost: { iron: 0, fuel: 0, coins: 0 }
    },
    { 
        id: 'g3_b2', name: 'Покращений Бластер', tier: 'II', 
        desc: 'Скорострільна плазмова гармата подвійної дії.', 
        x: 1250, y: 1900, 
        req: 'g3_b1', owned: false, img: 'images/Blasters.png',
        rocketKey: 'weapons', level: 2,
        cost: { iron: 450, fuel: 300, coins: 700 }
    }
];

// --- DRAG LOGIC ---
viewport.addEventListener('mousedown', (e) => {
    if (e.target.closest('.node')) return;
    isDragging = true;
    startX = e.clientX - currentX;
    startY = e.clientY - currentY;
    viewport.style.cursor = 'grabbing';
});

window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    e.preventDefault();
    currentX = e.clientX - startX;
    currentY = e.clientY - startY;
    updateCanvasPosition();
});

window.addEventListener('mouseup', () => {
    isDragging = false;
    viewport.style.cursor = 'grab';
});

function updateCanvasPosition() {
    canvas.style.transform = `translate(${currentX}px, ${currentY}px) scale(${scale})`;
}

// --- INIT ---
function init() {
    canvas.style.transformOrigin = '0 0';
    // 1. Малюємо ноди
    treeNodes.forEach(node => {
        const div = document.createElement('div');
        div.className = 'node';
        if (node.owned) div.classList.add('owned');
        div.id = `node-${node.id}`;
        
        // Позиціонування
        div.style.left = node.x + 'px';
        div.style.top = node.y + 'px';

        const checkmarkHTML = node.owned ? '<span class="checkmark">✔</span>' : '';
        const imageSrc = node.img ? node.img : 'images/placeholder_icon.png';

        div.innerHTML = `
            <div class="node-img-box">
                <img src="${imageSrc}" class="node-icon" onerror="this.style.opacity=0">
            </div>
            <div class="node-tier">TIER ${node.tier}</div>
            <div class="node-title">${node.name}</div>
            <div class="node-status">${checkmarkHTML}</div>
        `;
        
        div.onclick = (e) => {
            e.stopPropagation();
            highlightPath(node.id);
            openPanel(node);
        };
        canvas.appendChild(div);

        if (node.req) drawLine(node);
    });

    // 2. Центруємо екран на дереві
    centerViewport();
}

// --- ФУНКЦІЯ ЦЕНТРУВАННЯ ---
function centerViewport() {
    // Центр схеми
    // X: середина між 1000 і 1750 ~ 1375
    // Y: середина між 1000 і 1900 ~ 1450
    const treeCenterX = 1375; 
    const treeCenterY = 1450;

    const screenCenterX = window.innerWidth / 2;
    const screenCenterY = window.innerHeight / 2;

    currentX = screenCenterX - treeCenterX;
    currentY = screenCenterY - treeCenterY;

    updateCanvasPosition();
}

function drawLine(node) {
    const parent = treeNodes.find(n => n.id === node.req);
    if (!parent) return;

    const line = document.createElement('div');
    line.className = 'line';
    line.id = `line-${node.id}`;

    // 🔹 START — права сторона батька
    const startX = parent.x + NODE_WIDTH;
    const startY = parent.y + NODE_HEIGHT / 2;

    // 🔹 END — ліва сторона дитини
    const endX = node.x;
    const endY = node.y + NODE_HEIGHT / 2;

    const dx = endX - startX;
    const dy = endY - startY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    line.style.width = dist + 'px';
    line.style.left = startX + 'px';
    line.style.top = startY + 'px';
    line.style.transform = `rotate(${Math.atan2(dy, dx)}rad)`;

    canvas.appendChild(line);
}

// Функції панелі (залишаємо як було)
function highlightPath(nodeId) {
    document.querySelectorAll('.node, .line').forEach(el => el.classList.remove('highlight'));
    let currentId = nodeId;
    while (currentId) {
        document.getElementById(`node-${currentId}`)?.classList.add('highlight');
        document.getElementById(`line-${currentId}`)?.classList.add('highlight');
        const node = treeNodes.find(n => n.id === currentId);
        currentId = node ? node.req : null;
    }
}

function openPanel(node) {
    document.getElementById('node-name').innerText = node.name;
    document.getElementById('node-tier').innerText = `TIER ${node.tier}`;
    document.getElementById('node-desc').innerText = node.desc;

    // 🖼 Картинка модуля
    const img = document.getElementById('node-image');
    img.src = node.img || 'images/modules/placeholder.png';

    // === ЛОГІКА ВІДОБРАЖЕННЯ ЦІНИ ===
    const costContainer = document.getElementById('node-cost');
    
    if (node.owned) {
        costContainer.innerHTML = '<div class="cost-owned-msg">ВЖЕ ВСТАНОВЛЕНО</div>';
        costContainer.classList.add('visible');
    } else {
        const c = node.cost || { iron: 0, fuel: 0, coins: 0 };
        
        costContainer.innerHTML = `
            <div class="cost-cell">
                <span class="cost-icon">🧱</span>
                <span class="cost-value val-iron">${c.iron}</span>
            </div>
            <div class="cost-cell">
                <span class="cost-icon">🧪</span>
                <span class="cost-value val-fuel">${c.fuel}</span>
            </div>
            <div class="cost-cell">
                <span class="cost-icon">🪙</span>
                <span class="cost-value val-coin">${c.coins}</span>
            </div>
        `;
        costContainer.classList.add('visible');
    }

    // 🔘 Кнопка дослідження
    const btn = document.querySelector('.action-btn');

    if (node.owned) {
        btn.textContent = 'В АНГАРІ';
        btn.classList.add('disabled');
        btn.disabled = true;
    } else {
        btn.textContent = 'ДОСЛІДИТИ';
        btn.classList.remove('disabled');
        btn.disabled = false;
    }

    document.getElementById('info-panel').classList.add('active');
}

function closePanel() {
    document.getElementById('info-panel').classList.remove('active');
    document.querySelectorAll('.node, .line').forEach(el => el.classList.remove('highlight'));
}

document.addEventListener('DOMContentLoaded', () => {
    const backBtn = document.getElementById('dynamic-back-btn');
    const path = window.location.pathname; // Отримуємо поточну адресу
    
    // Об'єкт конфігурації: "де ми є" -> "куди йти"
    const routes = {
        'tree_Earth.html': { url: 'index.html', text: 'ГОЛОВНА' },
        'tree_Moon.html':  { url: 'Moon.html',  text: 'МІСЯЦЬ' },
        'tree_Mars.html':  { url: 'Mars.html',  text: 'МАРС' },
        'tree_Jupiter.html': { url: 'Jupiter.html', text: 'ЮПІТЕР' }
    };

    // Перевіряємо, який файл зараз відкрито
    for (const [key, route] of Object.entries(routes)) {
        if (path.includes(key)) {
            backBtn.href = route.url;
            backBtn.innerHTML = `<span class="arrow">‹</span> ${route.text}`;
            break; 
        }
    }
    
    // Якщо сторінка не знайдена в списку, ведемо на index.html за замовчуванням
    if (backBtn.getAttribute('href') === '#') {
        backBtn.href = 'index.html';
        backBtn.innerHTML = `<span class="arrow">‹</span> MENU`;
    }
});

// --- ЛОГІКА ЗУМУ КОЛЕСОМ ---
viewport.addEventListener('wheel', (e) => {
    e.preventDefault(); // Забороняємо прокрутку сторінки браузером

    const xs = (e.clientX - currentX) / scale;
    const ys = (e.clientY - currentY) / scale;

    const delta = -e.deltaY;
    
    // Обмежуємо швидкість зміни, щоб було плавно
    const factor = (delta > 0) ? 1.1 : 0.9;
    
    let newScale = scale * factor;

    // Обмеження мінімуму і максимуму
    if (newScale < MIN_SCALE) newScale = MIN_SCALE;
    if (newScale > MAX_SCALE) newScale = MAX_SCALE;

    // Математика, щоб зум був у точку курсора (cursor-centered zoom)
    currentX -= xs * (newScale - scale);
    currentY -= ys * (newScale - scale);
    scale = newScale;

    updateCanvasPosition();
}, { passive: false });

window.onload = init;