from aiogram.types import ReplyKeyboardMarkup, KeyboardButton

def get_main_kb_no_family():
    return ReplyKeyboardMarkup(
        keyboard=[
            [KeyboardButton(text="🚀 Створити сім'ю"), KeyboardButton(text="🔗 Приєднатися до сім'ї")]
        ], 
        resize_keyboard=True
    )

def get_main_kb_with_family():
    return ReplyKeyboardMarkup(
        keyboard=[
            [KeyboardButton(text="🌌 Кабінет сім'ї"), KeyboardButton(text="🛸 Політ (Веб)")],
            [KeyboardButton(text="📡 Місії"), KeyboardButton(text="🏭 Інфраструктура")],
            [KeyboardButton(text="🛒 Магазин"), KeyboardButton(text="🎁 Вітальний бонус")],
            [KeyboardButton(text="🎲 Розваги"), KeyboardButton(text="⚔️ Рейд")],
            [KeyboardButton(text="👾 Космічний бій"), KeyboardButton(text="🚀 Навігація")],
            [KeyboardButton(text="❌ Покинути сім'ю")]
        ], 
        resize_keyboard=True
    )

# 👇 ДОДАЙТЕ ЦЮ ФУНКЦІЮ, ЩОБ ВИПРАВИТИ ПОМИЛКУ
def main_keyboard():
    return get_main_kb_with_family()