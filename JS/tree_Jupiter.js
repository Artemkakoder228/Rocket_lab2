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
    // =======================================================
    // === ГРУПА 1: КОРПУС ТА МОДУЛІ (Основна гілка) ===
    // Послідовність: Корпус -> Новий Корпус -> (Розвилка: Сонячні панелі АБО Бойовий відсік)
    // =======================================================
    
    // 1. Старт (Корпус)
    { 
        id: 'hull_start', name: 'Герметизація', tier: 'I', desc: 'Покращена ізоляція відсіку для захисту вантажу.', 
        x: 1000, y: 1000, 
        req: null, owned: true, img: 'images/Korpus.png',
        cost: { iron: 0, fuel: 0, coins: 0 }
    },
    // 2. Новий Корпус (Загальний етап)
    { 
        id: 'hull_mk2', name: 'Композитний Корпус', tier: 'II', desc: 'Полегшений сплав, що дозволяє нести більше обладнання.', 
        x: 1250, y: 1000, 
        req: 'hull_start', owned: false, img: 'images/Korpus.png',
        cost: { iron: 700, fuel: 300, coins: 550 }
    },

    // --- ГІЛКА А: ЕНЕРГЕТИКА (Сонячні панелі) ---
    { 
        id: 'solar_upg', name: 'Фотоелементи MK-2', tier: 'III', desc: 'Покращення ефективності збору енергії на 50%.', 
        x: 1500, y: 850, // Вгору від корпусу
        req: 'hull_mk2', owned: false, img: 'images/Bataries.png',
        cost: { iron: 400, fuel: 200, coins: 600 }
    },
    { 
        id: 'solar_max', name: 'Квантові Панелі', tier: 'IV', desc: 'Найкраща система поглинання світла. Майже нескінченна енергія.', 
        x: 1750, y: 850, // Продовження верхньої гілки
        req: 'solar_upg', owned: false, img: 'images/Bataries.png',
        cost: { iron: 200, fuel: 500, coins: 800 }
    },

    // --- ГІЛКА Б: БОЙОВА (Відсіки та Гармати) ---
    { 
        id: 'aux_bay', name: 'Допоміжні Відсіки', tier: 'III', desc: 'Розширення простору для встановлення спецобладнання.', 
        x: 1500, y: 1150, // Вниз від корпусу
        req: 'hull_mk2', owned: false, img: 'images/Korpus.png',
        cost: { iron: 600, fuel: 200, coins: 500 }
    },
    { 
        id: 'combat_bay', name: 'Бойовий Модуль', tier: 'IV', desc: 'Броньований відсік з системою наведення.', 
        x: 1750, y: 1150, 
        req: 'aux_bay', owned: false, img: 'images/Korpus.png',
        cost: { iron: 800, fuel: 300, coins: 750 }
    },
    { 
        id: 'cannons', name: 'Плазмові Гармати', tier: 'V', desc: 'Важке озброєння для знищення астероїдів та ворогів.', 
        x: 2000, y: 1150, // Фінал нижньої гілки
        req: 'combat_bay', owned: false, img: 'images/Blasters.png',
        cost: { iron: 500, fuel: 400, coins: 1000 }
    },


    // =======================================================
    // === ГРУПА 2: ДВИГУНИ (Турбіна) ===
    // Послідовність: Турбіна -> (Розвилка: Найкраща турбіна АБО Бокові турбіни)
    // =======================================================

    // 1. Старт (Турбіна)
    { 
        id: 'eng_start', name: 'Форсаж', tier: 'I', desc: 'Базова оптимізація камери згоряння.', 
        x: 1000, y: 1500, 
        req: null, owned: true, img: 'images/Turbina.png',
        cost: { iron: 0, fuel: 0, coins: 0 }
    },

    // --- ГІЛКА А: ГОЛОВНИЙ РУШІЙ ---
    { 
        id: 'eng_ultimate', name: 'Гіпер-Турбіна', tier: 'IV', desc: 'Найкраща турбіна. Дозволяє досягти другої космічної швидкості.', 
        x: 1300, y: 1400, // Вгору
        req: 'eng_start', owned: false, img: 'images/Turbina.png',
        cost: { iron: 350, fuel: 500, coins: 900 }
    },

    // --- ГІЛКА Б: МАНЕВРОВІСТЬ ---
    { 
        id: 'eng_side', name: 'Бокові Рушії', tier: 'II', desc: 'Покращення всіх маневрових двигунів для стабілізації.', 
        x: 1300, y: 1600, // Вниз
        req: 'eng_start', owned: false, img: 'images/Turbina.png',
        cost: { iron: 300, fuel: 250, coins: 400 }
    },


    // =======================================================
    // === ГРУПА 3: НІС (Сенсори) ===
    // Послідовність: Ніс -> Новий покращений ніс
    // =======================================================

    // 1. Старт (Ніс)
    { 
        id: 'nose_start', name: 'Титановий Конус', tier: 'I', desc: 'Посилений захист від тертя атмосфери.', 
        x: 1000, y: 1850, 
        req: null, owned: true, img: 'images/Nose.png',
        cost: { iron: 0, fuel: 0, coins: 0 }
    },
    // 2. Фінал носа
    { 
        id: 'nose_adv', name: 'Аеро-Композит', tier: 'III', desc: 'Новий покращений ніс з вбудованими сенсорами дальньої дії.', 
        x: 1300, y: 1850, // Пряма лінія
        req: 'nose_start', owned: false, img: 'images/Nose.png',
        cost: { iron: 250, fuel: 200, coins: 550 }
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
    // Дерево тепер простягається по Y від 1000 до 1900.
    // Середина дерева по Y ~ 1500
    // Середина по X ~ 1300
    const treeCenterX = 1300; 
    const treeCenterY = 1500;

    // Центр екрану користувача
    const screenCenterX = window.innerWidth / 2;
    const screenCenterY = window.innerHeight / 2;

    // Зсув
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
                <span class="cost-icon">☁️</span>
                <span class="cost-value val-iron">${c.iron}</span>
            </div>
            <div class="cost-cell">
                <span class="cost-icon">🎈</span>
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