# MedUz ERP - BMI Himoya Shpargalkasi (Cheatsheet)

## 1. Loyiha Maqsadi va Dolzarbligi
**"MedUz ERP"** — bu kasalxona va xususiy klinikalarni to'liq raqamlashtirish uchun mo'ljallangan, bulutli (Cloud) texnologiyalarga asoslangan zamonaviy boshqaruv tizimidir. 
- **Asosiy maqsad:** Qog'ozbozlikni yo'q qilish. Bemorlar, navbatlar, xodimlar va moliya tushumlarini yagona, shaffof tizim orqali avtomatlashtirilgan holda boshqarish.

---

## 2. Tizim Arxitekturasi (Qanday qurilgan?)
*Ushbu loyihaning eng katta ilmiy va amaliy yutug'i — u odatiy Monolit emas, balki yirik IT kompaniyalardek **Mikroservislar arxitekturasi (Microservices Architecture)** asosida qurilganligidir.*

Backend bir-biri bilan TCP transport orqali ishlovchi **5 ta mustaqil xizmatga** bo'lingan:
1. **API Gateway:** Barcha so'rovlarni qabul qilib, kerakli xizmatlarga xavfsiz yo'naltiradi.
2. **Patient Service:** Bemorlarning ma'lumotlari va kasallik tarixini qayta ishlaydi.
3. **Appointment Service:** Shifokor qabullariga navbatga yozilishni nazorat qiladi.
4. **Staff Service:** Klinika xodimlari va ularning lavozimlarini boshqaradi.
5. **Billing Service:** To'lovlar, qarzlar va kassa tushumlarini hisoblaydi.

> **Asosiy Argument (Komissiyaga):** "Mikroservis arxitekturasining afzalligi shuki, agar Moliya (Billing) serverida nosozlik chiqsa ham, butun tizim qotib qolmaydi. Bemorlarni ro'yxatga olish yoki navbatga yozish ishlashda davom etaveradi. Bu 24/7 barqaror ishlashni ta'minlaydi."

---

## 3. Texnologiyalar Steki (Nimalardan foydalanilgan?)
- **Frontend:** **Vite** va **React.js** (yuqori tezlik uchun). Dizayn uchun **Material-UI (MUI)**, jonli grafiklar uchun **Recharts**.
- **Backend:** **NestJS** freymvorki (TypeScript va RxJS asosida).
- **Ma'lumotlar bazasi:** **CockroachDB** (Yuqori yuklanishlarga (HighLoad) mo'ljallangan taqsimlangan SQL baza).
- **Infratuzilma:** **Docker** va **Docker Compose** (barcha kompyuterlarda xatosiz ishlashi uchun), frontend xostingi uchun **Vercel**.

---

## 4. Loyihaning O'ziga Xosligi va Universalligi
- **Gibrid baza (`safeApi` texnologiyasi):** Dastur avval lokal serverga ulanadi. Agar u o'chiq bo'lsa (masalan, telefondan kirganda), tizim xato bermasdan avtomatik **Global Cloud JSON DB** ga ulanadi. Ma'lumotlar barcha qurilmalarda uzilishlarsiz sinxronlashadi.
- **Dinamik UI:** "Bemorga navbat olish" bo'limida tizim avtomat ravishda faqat "Shifokor" lavozimidagi xodimlarnigina ko'rsatadi (Bog'langan ma'lumotlar).
- **Mahalliylashtirish (O'zbekiston uchun):** Pul aylanmasi dollarda emas, O'zbek so'mida yuritiladi va mingliklarga ajratiladi (`1 000 000 so'm` formatida).
- **PDF Hisobotlar:** Qilingan to'lovlar, qarzdorliklar va bemor ro'yxatlarini bitta tugma bilan **PDF shaklida chop etish** (Export to PDF) xususiyati mavjud.

---

## 5. Himoyada Kutiladigan Savollarga Javoblar

**Savol: Nega standart PostgreSQL emas, CockroachDB ishlatdingiz?**
**Javob:** "CockroachDB PostgreSQL'ga o'xshash, lekin u taqsimlangan (distributed) va HighLoad tizimlar uchun yozilgan. Agar klinika kelajakda viloyatlarda filial ochsa, CockroachDB serverlarni bir-biriga bog'lab, ma'lumotlarni hech qanday yo'qotishlarsiz yagona bazada saqlash imkonini beradi."

**Savol: Bu tizimni amaliyotda (haqiqiy poliklinikaga) joriy qilsa bo'ladimi?**
**Javob:** "Albatta. Tizim poydevori 100% tayyor. Unga faqat tibbiy retseptlar (dori-darmon) moduli va bemorlarga SMS eslatma uchun Telegram bot ulasak, loyihani bemalol xususiy klinikalarga tijoriy maqsadda joriy etish mumkin."
