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

window.treeNodes = [
    // --- КАТЕГОРІЯ 1: НІС (NOSE) ---
    {
        id: 'gu1',
        name: 'Конус-верхівка',
        tier: 'I',
        desc: 'Аеродинамічний обтікач для зниження опору повітря під час зльоту.',
        x: 1000, y: 1000,
        req: null, owned: true, img: 'images/Nose.png',
        rocketKey: 'nose', level: 1,
        cost: { iron: 0, fuel: 0, coins: 0 } // Вже куплено
    },
    {
        id: 'gu2',
        name: 'Сенсорний шпиль',
        tier: 'II',
        desc: 'Модернізована верхівка з датчиками атмосфери та телеметрією.',
        x: 1400, y: 1000,
        req: 'gu1', owned: false, img: 'images/Nose.png',
        rocketKey: 'nose', level: 2,
        cost: { iron: 500, fuel: 100, coins: 250 } // Коштує ресурсів
    },

    // --- КАТЕГОРІЯ 2: КОРПУС (BODY) ---
    {
        id: 'nc1',
        name: 'Корпус',
        tier: 'I',
        desc: 'Стандартна алюмінієва оболонка для паливних баків.',
        x: 1000, y: 1250,
        req: null, owned: true, img: 'images/Korpus.png',
        rocketKey: 'body', level: 1,
        cost: { iron: 0, fuel: 0, coins: 0 }
    },
    {
        id: 'h1',
        name: 'Сталевий Корпус',
        tier: 'II',
        desc: 'Базова основа ракети. Витримує більші навантаження.',
        x: 1400, y: 1250,
        req: 'nc1', owned: false, img: 'images/Korpus.png',
        rocketKey: 'body', level: 2,
        cost: { iron: 800, fuel: 50, coins: 400 } // Корпус вимагає багато заліза
    },

    // --- КАТЕГОРІЯ 3: ДВИГУН (ENGINE) ---
    {
        id: 'e1',
        name: 'Турбіна',
        tier: 'I',
        desc: 'Базовий насос для подачі паливної суміші в камеру згоряння.',
        x: 1000, y: 1500,
        req: null, owned: true, img: 'images/Turbina.png',
        rocketKey: 'engine', level: 1,
        cost: { iron: 0, fuel: 0, coins: 0 }
    },
    {
        id: 'e2',
        name: 'Турбо-нагнітач',
        tier: 'II',
        desc: 'Подвійна система нагнітання для максимальної тяги двигуна.',
        x: 1400, y: 1500,
        req: 'e1', owned: false, img: 'images/Turbina.png',
        rocketKey: 'engine', level: 2,
        cost: { iron: 400, fuel: 300, coins: 600 } // Двигун дорогий у грошах і паливі
    },

    // --- КАТЕГОРІЯ 4: КРИЛА (FINS) ---
    {
        id: 'a1',
        name: 'Надкрилки',
        tier: 'I',
        desc: 'Пасивні стабілізатори для стійкості ракети в польоті.',
        x: 1000, y: 1750,
        req: null, owned: true, img: 'images/Stabilizator.png',
        rocketKey: 'fins', level: 1,
        cost: { iron: 0, fuel: 0, coins: 0 }
    },
    {
        id: 'a2',
        name: 'Активні закрилки',
        tier: 'II',
        desc: 'Рухомі елементи крил для точного маневрування при посадці.',
        x: 1400, y: 1750,
        req: 'a1', owned: false, img: 'images/Stabilizator.png',
        rocketKey: 'fins', level: 2,
        cost: { iron: 300, fuel: 150, coins: 350 }
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