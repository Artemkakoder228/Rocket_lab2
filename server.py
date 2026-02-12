from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from database import Database
import os

# Вказуємо, що статичні файли (html, css, js) лежать прямо тут ('.')
app = Flask(__name__, static_folder='.', static_url_path='')
CORS(app)

# Підключення до бази (залишається як було)
db = Database() 

CATALOG = {
    # --- ЗЕМЛЯ (Earth) ---
    'gu1': {'name': 'Конус-верхівка', 'type': 'nose', 'tier': 'I', 'cost': {'coins': 0, 'iron': 0, 'fuel': 0}},
    'gu2': {'name': 'Сенсорний шпиль', 'type': 'nose', 'tier': 'II', 'cost': {'coins': 250, 'iron': 500, 'fuel': 100}},
    'nc1': {'name': 'Корпус', 'type': 'body', 'tier': 'I', 'cost': {'coins': 0, 'iron': 0, 'fuel': 0}},
    'h1': {'name': 'Сталевий Корпус', 'type': 'body', 'tier': 'II', 'cost': {'coins': 400, 'iron': 800, 'fuel': 50}},
    'e1': {'name': 'Турбіна', 'type': 'engine', 'tier': 'I', 'cost': {'coins': 0, 'iron': 0, 'fuel': 0}},
    'e2': {'name': 'Турбо-нагнітач', 'type': 'engine', 'tier': 'II', 'cost': {'coins': 600, 'iron': 400, 'fuel': 300}},
    'a1': {'name': 'Надкрилки', 'type': 'fins', 'tier': 'I', 'cost': {'coins': 0, 'iron': 0, 'fuel': 0}},
    'a2': {'name': 'Активні закрилки', 'type': 'fins', 'tier': 'II', 'cost': {'coins': 350, 'iron': 300, 'fuel': 150}},

    # --- МІСЯЦЬ (Moon) ---
    # Група 1: Корпус
    'root1': {'name': 'Сталевий Корпус', 'type': 'body', 'tier': 'I', 'cost': {'coins': 0, 'iron': 0, 'fuel': 0}},
    'branch1_up1': {'name': 'Вантажний Відсік', 'type': 'body', 'tier': 'II', 'cost': {'coins': 350, 'iron': 400, 'fuel': 200}},
    'branch1_up2': {'name': 'Сонячні Панелі', 'type': 'body', 'tier': 'III', 'cost': {'coins': 450, 'iron': 300, 'fuel': 100}},
    'branch1_down1': {'name': 'Аеро-надкрилки', 'type': 'fins', 'tier': 'II', 'cost': {'coins': 300, 'iron': 250, 'fuel': 150}},

    # Група 2: Двигуни
    'root2': {'name': 'Турбо-нагнітач', 'type': 'engine', 'tier': 'I', 'cost': {'coins': 0, 'iron': 0, 'fuel': 0}},
    'branch2_up': {'name': 'Турбо-Форсаж', 'type': 'engine', 'tier': 'II', 'cost': {'coins': 600, 'iron': 500, 'fuel': 400}},
    'branch2_down': {'name': 'Бокові Рушії', 'type': 'engine', 'tier': 'II', 'cost': {'coins': 400, 'iron': 350, 'fuel': 250}},

    # Група 3: Верхівка
    'root3': {'name': 'Сенсорний шпиль', 'type': 'nose', 'tier': 'I', 'cost': {'coins': 0, 'iron': 0, 'fuel': 0}},
    'branch3': {'name': 'Керамічний Щит', 'type': 'nose', 'tier': 'II', 'cost': {'coins': 380, 'iron': 300, 'fuel': 100}},
    # --- ГРУПА 1: КОРПУС ТА ЕНЕРГІЯ ---
    'g1_1': {'name': 'Вантажний Відсік', 'type': 'body', 'tier': 'I', 'cost': {'coins': 0, 'iron': 0, 'fuel': 0}},
    'g1_2': {'name': 'Герметизація', 'type': 'body', 'tier': 'II', 'cost': {'coins': 400, 'iron': 600, 'fuel': 200}},
    'g1_up': {'name': 'Панель Оновлення', 'type': 'body', 'tier': 'III', 'cost': {'coins': 500, 'iron': 500, 'fuel': 150}},
    'g1_down': {'name': 'Сонячні Панелі', 'type': 'body', 'tier': 'III', 'cost': {'coins': 450, 'iron': 400, 'fuel': 100}},
    'g1_end': {'name': 'Нові Панелі MK-II', 'type': 'body', 'tier': 'IV', 'cost': {'coins': 600, 'iron': 300, 'fuel': 200}},

    # --- ГРУПА 2: ДВИГУНИ ---
    'g2_1': {'name': 'Турбо-Форсаж', 'type': 'engine', 'tier': 'I', 'cost': {'coins': 0, 'iron': 0, 'fuel': 0}},
    'g2_up': {'name': 'Покращений Форсаж', 'type': 'engine', 'tier': 'II', 'cost': {'coins': 700, 'iron': 550, 'fuel': 350}},
    'g2_down': {'name': 'Бокові Турбіни', 'type': 'engine', 'tier': 'II', 'cost': {'coins': 500, 'iron': 400, 'fuel': 250}},

    # --- ГРУПА 3: ЗАХИСТ ТА ЗБРОЯ ---
    'g3_a1': {'name': 'Керамічний Щит', 'type': 'nose', 'tier': 'I', 'cost': {'coins': 0, 'iron': 0, 'fuel': 0}},
    'g3_a2': {'name': 'Нова Верхівка', 'type': 'nose', 'tier': 'II', 'cost': {'coins': 480, 'iron': 350, 'fuel': 150}},
    'g3_b1': {'name': 'Бластер', 'type': 'weapons', 'tier': 'I', 'cost': {'coins': 0, 'iron': 0, 'fuel': 0}},
    'g3_b2': {'name': 'Покращений Бластер', 'type': 'weapons', 'tier': 'II', 'cost': {'coins': 700, 'iron': 450, 'fuel': 300}},

    # --- ГРУПА 1: КОРПУС ТА МОДУЛІ ---
    'hull_start': {'name': 'Герметизація', 'type': 'body', 'tier': 'I', 'cost': {'coins': 0, 'iron': 0, 'fuel': 0}},
    'hull_mk2': {'name': 'Композитний Корпус', 'type': 'body', 'tier': 'II', 'cost': {'coins': 550, 'iron': 700, 'fuel': 300}},
    'solar_upg': {'name': 'Фотоелементи MK-2', 'type': 'body', 'tier': 'III', 'cost': {'coins': 600, 'iron': 400, 'fuel': 200}},
    'solar_max': {'name': 'Квантові Панелі', 'type': 'body', 'tier': 'IV', 'cost': {'coins': 800, 'iron': 200, 'fuel': 500}},
    'aux_bay': {'name': 'Допоміжні Відсіки', 'type': 'body', 'tier': 'III', 'cost': {'coins': 500, 'iron': 600, 'fuel': 200}},
    'combat_bay': {'name': 'Бойовий Модуль', 'type': 'body', 'tier': 'IV', 'cost': {'coins': 750, 'iron': 800, 'fuel': 300}},
    'cannons': {'name': 'Плазмові Гармати', 'type': 'weapons', 'tier': 'V', 'cost': {'coins': 1000, 'iron': 500, 'fuel': 400}},

    # --- ГРУПА 2: ДВИГУНИ ---
    'eng_start': {'name': 'Форсаж', 'type': 'engine', 'tier': 'I', 'cost': {'coins': 0, 'iron': 0, 'fuel': 0}},
    'eng_ultimate': {'name': 'Гіпер-Турбіна', 'type': 'engine', 'tier': 'IV', 'cost': {'coins': 900, 'iron': 350, 'fuel': 500}},
    'eng_side': {'name': 'Бокові Рушії', 'type': 'engine', 'tier': 'II', 'cost': {'coins': 400, 'iron': 300, 'fuel': 250}},

    # --- ГРУПА 3: НІС ---
    'nose_start': {'name': 'Титановий Конус', 'type': 'nose', 'tier': 'I', 'cost': {'coins': 0, 'iron': 0, 'fuel': 0}},
    'nose_adv': {'name': 'Аеро-Композит', 'type': 'nose', 'tier': 'III', 'cost': {'coins': 550, 'iron': 250, 'fuel': 200}},
}

# --- НОВІ МАРШРУТИ ДЛЯ САЙТУ ---

@app.route('/')
def index():
    # Головна сторінка
    return send_from_directory('.', 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    # Будь-які інші файли (CSS, JS, картинки, інші HTML)
    return send_from_directory('.', path)

# -------------------------------

@app.route('/api/inventory', methods=['GET'])
def get_inventory():
    try:
        family_id = request.args.get('family_id')
        if not family_id:
            return jsonify({'error': 'No family_id provided'}), 400

        data = db.get_family_resources(family_id)
        if not data:
            return jsonify({'error': 'Family not found'}), 404

        resources_data = {
            'coins': data[0],
            'iron': data[1],
            'fuel': data[2],
            'regolith': data[3],
            'he3': data[4],
            'silicon': data[5],
            'oxide': data[6],
            'hydrogen': data[7],
            'helium': data[8]
        }

        owned_ids = db.get_family_unlocked_modules(family_id)
        
        modules_list = []
        for uid in owned_ids:
            if uid in CATALOG:
                mod_info = CATALOG[uid].copy()
                mod_info['id'] = uid
                modules_list.append(mod_info)

        return jsonify({
            'resources': resources_data,
            'modules': modules_list
        })
    except Exception as e:
        print(f"Error: {e}")
        return jsonify({'error': str(e)}), 500
    
@app.route('/api/investigate', methods=['POST'])
def investigate():
    try:
        data = request.json
        family_id = data.get('family_id')
        module_id = data.get('module_id')

        if not family_id or not module_id:
            return jsonify({'error': 'Неповні дані (відсутній ID сім\'ї або модуля)'}), 400

        # Отримуємо дані модуля з каталогу
        if module_id not in CATALOG:
            return jsonify({'error': f'Модуль {module_id} не знайдено в каталозі'}), 404

        module_info = CATALOG[module_id].copy()
        module_info['id'] = module_id
        
        # Додаємо вартість, якщо її немає в каталозі (на основі ваших treeNodes в JS)
        # Це запобігає KeyError в database.py
        if 'cost' not in module_info:
            # Дефолтна вартість для модулів, які не прописані детально
            module_info['cost'] = {'coins': 100, 'iron': 100, 'fuel': 50}

        # Викликаємо існуючий метод БД
        success, message = db.buy_module_upgrade(family_id, module_info)

        if success:
            return jsonify({'message': message}), 200
        else:
            return jsonify({'error': message}), 400
            
    except Exception as e:
        print(f"CRITICAL SERVER ERROR: {e}")
        return jsonify({'error': 'Внутрішня помилка сервера'}), 500

def run_flask():
    # Port 5000 стандартний, Render сам його прокине
    app.run(host='0.0.0.0', port=5000, debug=False, use_reloader=False)