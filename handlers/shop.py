from aiogram import Router, F, types
from aiogram.utils.keyboard import InlineKeyboardBuilder
from aiogram.types import WebAppInfo
from database import Database
from config import WEB_APP_URL1
import urllib.parse

router = Router()
db = Database('space.db')


@router.message(F.text == "🛒 Магазин")
async def open_shop(message: types.Message):
    family_id = db.get_user_family(message.from_user.id)
    if not family_id:
        return await message.answer("Спочатку вступіть в сім'ю!")

    info = db.get_family_info(family_id)
    res = db.get_family_resources(family_id)

    # Генеруємо посилання на Web App для Дерева Досліджень
    # Передаємо параметри, щоб сайт знав, хто зайшов
    params = {
        "family": info[0],
        "planet": res[11],
        "balance": res[0],
        "engine_lvl": info[3],
        "hull_lvl": info[4]
    }
    web_url = f"{WEB_APP_URL1}?{urllib.parse.urlencode(params)}"

    # Ціни на швидкі покращення
    eng_price = info[3] * 500
    hull_price = info[4] * 500

    builder = InlineKeyboardBuilder()
    # Кнопка на Веб-додаток
    builder.button(text="🔬 Відкрити Дерево Досліджень (WEB)", web_app=WebAppInfo(url=WEB_APP_URL1))

    # Швидкі кнопки (якщо треба швидко апнути стат без вебу)
    builder.button(text=f"🔥 Двигун v{info[3] + 1} (💰{eng_price})", callback_data=f"upg:engine_lvl:{eng_price}")
    builder.button(text=f"🛡 Корпус v{info[4] + 1} (💰{hull_price})", callback_data=f"upg:hull_lvl:{hull_price}")
    builder.adjust(1)

    text = (
        f"🛒 **ЦЕНТР ЗАБЕЗПЕЧЕННЯ**\n"
        f"━━━━━━━━━━━━━━━━━━━━━\n"
        f"💰 Бюджет: **{res[0]}**\n\n"
        f"🔬 **Лабораторія:**\n"
        f"Для доступу до повного дерева технологій використовуйте Веб-термінал.\n\n"
        f"🔧 **Швидкий сервіс:**\n"
        f"🔥 Двигун: **Lv.{info[3]}** (Атака/Швидкість)\n"
        f"🛡 Корпус: **Lv.{info[4]}** (Захист від піратів)"
    )

    await message.answer(text, reply_markup=builder.as_markup(), parse_mode="Markdown")


@router.callback_query(F.data.startswith("upg:"))
async def buy_upgrade(call: types.CallbackQuery):
    _, upg_type, price = call.data.split(":")
    price = int(price)
    fid = db.get_user_family(call.from_user.id)

    bal = db.get_family_resources(fid)[0]

    if bal >= price:
        db.deduct_resources(fid, price)
        db.update_upgrade(fid, upg_type)

        # Оновлюємо текст повідомлення (не шлемо нове!)
        info = db.get_family_info(fid)
        new_eng_price = info[3] * 500
        new_hull_price = info[4] * 500

        builder = InlineKeyboardBuilder()
        # Генеруємо URL знову, щоб оновити дані
        params = {"family": info[0], "planet": info[5], "balance": bal - price}
        web_url = f"{WEB_APP_URL1}?{urllib.parse.urlencode(params)}"

        builder.button(text="🔬 Відкрити Дерево Досліджень (WEB)", web_app=WebAppInfo(url=web_url))
        builder.button(text=f"🔥 Двигун v{info[3] + 1} (💰{new_eng_price})",
                       callback_data=f"upg:engine_lvl:{new_eng_price}")
        builder.button(text=f"🛡 Корпус v{info[4] + 1} (💰{new_hull_price})",
                       callback_data=f"upg:hull_lvl:{new_hull_price}")
        builder.adjust(1)

        new_text = (
            f"✅ **МОДЕРНІЗАЦІЮ ЗАВЕРШЕНО!**\n"
            f"━━━━━━━━━━━━━━━━━━━━━\n"
            f"💰 Бюджет: **{bal - price}**\n\n"
            f"🔧 **Поточний стан:**\n"
            f"🔥 Двигун: **Lv.{info[3]}**\n"
            f"🛡 Корпус: **Lv.{info[4]}**"
        )

        await call.message.edit_text(new_text, reply_markup=builder.as_markup(), parse_mode="Markdown")
    else:
        await call.answer("❌ Недостатньо коштів!", show_alert=True)