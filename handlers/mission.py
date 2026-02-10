from aiogram import Router, F, types
from aiogram.utils.keyboard import InlineKeyboardBuilder
from database import Database
from datetime import datetime

router = Router()
db = Database('space.db') # Назва файлу тут не важлива, бо клас Database бере URL з config/env, але аргумент потрібен

@router.message(F.text == "📡 Місії")
async def show_missions(message: types.Message):
    fid = db.get_user_family(message.from_user.id)
    if not fid: 
        return await message.answer("Спочатку створіть сім'ю!")

    # 1. Перевірка, чи ракета вже в польоті
    timers = db.get_timers(fid) # [mission_end, launch_id, active_mission_id, upgrade_end]
    mission_end = timers[0]

    if mission_end:
        if datetime.now() < mission_end:
            rem = int((mission_end - datetime.now()).total_seconds() // 60)
            mid = timers[2]
            # Спробуємо отримати назву місії
            mis_info = db.get_mission_by_id(mid)
            mis_name = mis_info[1] if mis_info else "Секретна місія"
            
            await message.answer(
                f"🚀 **СТАТУС: У ПОЛЬОТІ**\n"
                f"🎯 Ціль: **{mis_name}**\n"
                f"⏳ До прибуття: **{rem} хв.**\n\n"
                f"_Центр управління очікує завершення маневру._",
                parse_mode="Markdown")
            return
        else:
            # Якщо час вийшов, але autocheck ще не спрацював - можна написати
            await message.answer("✅ Місію завершено! Очікуйте звіт.", parse_mode="Markdown")
            return

    # 2. Якщо польотів немає - показуємо список для поточної планети
    fam_info = db.get_family_resources(fid) # index 11 is current_planet
    planet = fam_info[11]
    
    missions = db.get_missions_by_planet(planet)

    if not missions:
        await message.answer(f"🔭 На планеті **{planet}** немає доступних місій.")
        return

    builder = InlineKeyboardBuilder()
    for m in missions:
        # m: 0=id, 1=name, 2=desc, 3=diff, 4=reward, 5=planet, 6=boss, 7=cost, 8=req_name, 9=req_amt, 10=time, 11=risk
        # Але get_missions_by_planet повертає скорочений список:
        # id, name, description, reward, is_boss_mission, cost_money, flight_time, pirate_risk
        
        m_id = m[0]
        name = m[1]
        is_boss = m[4]
        flight_time = m[6]
        risk = m[7]

        icon = "💀" if is_boss else "⭐"
        btn_text = f"{icon} {name} ({flight_time}хв | Ризик {risk}%)"
        builder.button(text=btn_text, callback_data=f"sel_mis:{m_id}")
    
    builder.adjust(1)
    
    # Emoji для краси
    planet_icons = {"Earth": "🌍", "Moon": "🌑", "Mars": "🔴", "Jupiter": "⚡"}
    icon = planet_icons.get(planet, "🌌")

    await message.answer(
        f"{icon} **ЦЕНТР ПОЛЬОТІВ: {planet.upper()}**\n"
        f"Оберіть завдання зі списку нижче.\n"
        f"Чим вищий ризик, тим більша нагорода.",
        reply_markup=builder.as_markup(), parse_mode="Markdown"
    )


@router.callback_query(F.data.startswith("sel_mis:"))
async def select_mission(call: types.CallbackQuery):
    try:
        mid = int(call.data.split(":")[1])
        fid = db.get_user_family(call.from_user.id)
        
        # Отримуємо повну інфо про місію
        mis = db.get_mission_by_id(mid)
        # mis: 0=id, 1=name, 2=desc, 3=diff, 4=reward, 5=planet, 6=boss, 7=cost, 8=req_res, 9=req_amt, 10=time, 11=risk

        res = db.get_family_resources(fid)
        balance = res[0]
        
        # Перевірка грошей (вартість запуску)
        cost = mis[7]
        if balance < cost:
            return await call.answer(f"❌ Брак коштів! Потрібно {cost}, є {balance}", show_alert=True)

        # Перевірка ресурсів (якщо місія вимагає паливо/залізо тощо)
        req_res_name = mis[8]
        req_res_amt = mis[9]
        
        if req_res_name and req_res_amt > 0:
            # Мапінг назв колонок на індекси у get_family_resources
            # 0:bal, 1:iron, 2:fuel, 3:regolith, 4:he3, 5:silicon, 6:oxide, 7:hydrogen, 8:helium
            res_map = {
                "res_iron": 1, "res_fuel": 2, "res_regolith": 3, "res_he3": 4,
                "res_silicon": 5, "res_oxide": 6, "res_hydrogen": 7, "res_helium": 8
            }
            
            idx = res_map.get(req_res_name)
            if idx:
                current_amount = res[idx]
                if current_amount < req_res_amt:
                     # Красива назва для алерту
                    readable_name = req_res_name.replace("res_", "").capitalize()
                    return await call.answer(f"❌ Не вистачає ресурсу {readable_name}! Треба {req_res_amt}.", show_alert=True)

        # Списуємо ресурси
        db.deduct_resources(fid, cost, req_res_name, req_res_amt)

        # Створюємо запис про запуск
        lid = db.start_launch(fid, mid)

        # Кнопка підтвердження
        builder = InlineKeyboardBuilder()
        builder.button(text="🚀 ПУСК (ПІДТВЕРДИТИ)", callback_data=f"conf_mis:{lid}")
        builder.button(text="🔙 Скасувати", callback_data="cancel_launch") # (скасування складне, бо вже списали гроші, тому поки просто кнопка)

        await call.message.edit_text(
            f"📋 **ПІДГОТОВКА ДО ЗАПУСКУ**\n"
            f"🎯 Місія: **{mis[1]}**\n"
            f"📝 Опис: _{mis[2]}_\n"
            f"⏳ Час польоту: **{mis[10]} хв**\n"
            f"☠️ Ризик піратів: **{mis[11]}%**\n\n"
            f"💸 Паливо заправлено, кошти списано.\n"
            f"Команда готова до старту?",
            reply_markup=builder.as_markup(), parse_mode="Markdown"
        )
        
    except Exception as e:
        print(f"Mission Error: {e}")
        await call.answer("Помилка при виборі місії.", show_alert=True)


@router.callback_query(F.data.startswith("conf_mis:"))
async def confirm_launch(call: types.CallbackQuery):
    lid = int(call.data.split(":")[1])
    fid = db.get_user_family(call.from_user.id)

    # Додаємо підпис користувача
    current_signatures = db.sign_launch(lid, call.from_user.id)
    
    if current_signatures is False:
        return await call.answer("Ви вже підтвердили запуск!", show_alert=True)

    # Отримуємо ID місії з таблиці launches, щоб дізнатися час польоту
    # Напряму через курсор, бо окремого методу get_launch_info немає
    conn = db.connection
    with conn.cursor() as c:
        c.execute("SELECT mission_id FROM launches WHERE id=%s", (lid,))
        row = c.fetchone()
        if not row:
            return await call.answer("Помилка запуску", show_alert=True)
        mid = row[0]
    
    mis = db.get_mission_by_id(mid)
    flight_time = mis[10]

    # Для спрощення гри - достатньо 1 підпису, щоб полетіти
    # (У майбутньому можна зробити require 50% учасників сім'ї)
    
    # Встановлюємо таймер
    db.set_mission_timer(fid, flight_time, lid, mid)
    db.update_launch_status(lid, "in_progress")

    await call.message.edit_text(
        f"🚀 **ЗАПУСК УСПІШНИЙ!**\n"
        f"Двигуни: 100%\n"
        f"Траєкторія: Номінальна\n\n"
        f"⏳ Розрахунковий час прибуття: **{flight_time} хв**.\n"
        f"_Ми повідомимо вас про результати місії._", 
        parse_mode="Markdown"
    )