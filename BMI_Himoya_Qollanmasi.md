# MedUz ERP - BMI Himoyasi Uchun To'liq Qo'llanma

Ushbu hujjat **MedUz ERP** loyihasining qanday ishlashi, uning ichki arxitekturasi va kodlarini to'liq va sodda tilda (lekin ilmiy darajada) tushuntirib beradi. Siz ushbu hujjatdan Bitiruv Malakaviy Ishi (BMI) himoyasi paytida komissiya savollariga javob berishda bemalol foydalanishingiz mumkin.

---

## 1. Loyiha Maqsadi va Dolzarbligi

**Maqsad:** Shifoxona va klinikalardagi byurokratiya va qog'ozbozlikni yo'q qilish, bemorlar, navbatlar, xodimlar hamda moliya tushumlarini bitta raqamlashtirilgan markazdan boshqarish.

Hozirgi kunda ko'plab klinikalar ma'lumotlarni Excel yoki eskirgan lokal dasturlarda saqlaydi. Bu loyiha esa **Bulutli (Cloud)** texnologiyalar va **Taqsimlangan (Microservices)** arxitektura orqali yuqori xavfsizlik va barqarorlikni ta'minlaydi.

---

## 2. Tizim Arxitekturasi (God-Tier Microservices)

Loyihaning komissiyani eng lol qoldiradigan qismi uning **Mikroservislar arxitekturasi** asosida qurilganligidadir. Odatda talabalar barcha kodlarni bitta joyga (Monolith) yozib qo'yishadi. Lekin bu tizim haqiqiy yirik IT kompaniyalaridek 5 ta alohida serverlarga bo'lingan:

1. **API Gateway (Kirish darvozasi):** Barcha so'rovlar (masalan Bemor qo'shish) avval Gateway'ga keladi va u so'rovni kerakli Mikroservisga yo'naltiradi.
2. **Patient Service (Bemorlar xizmati):** Bemorlarning kasallik tarixi va kontaktlarini saqlaydi.
3. **Appointment Service (Navbatlar xizmati):** Shifokor qabullariga vaqt belgilashni boshqaradi.
4. **Staff Service (Xodimlar xizmati):** Shifokor va hamshiralarning ma'lumotlari bilan ishlaydi.
5. **Billing Service (Moliya xizmati):** Kassa tushumlari, qarzlar va to'lovlarni hisoblaydi.

> **Komissiyaga shunday tushuntiring:** "Agar kasalxonada to'lovlar tizimi (Billing) ishdan chiqsa, butun dastur qotib qolmaydi. Mikroservis bo'lgani uchun qolgan qismlar (masalan, Bemor qo'shish yoki Navbatga yozilish) ishlashda davom etaveradi. Bu arxitekturaning eng katta yutug'idir!"

---

## 3. Ma'lumotlar Bazasi va Cross-Device Sinxronizatsiya

Loyihaning Backend qismi **CockroachDB** da ishlashga mo'ljallangan. Ammo, himoya jarayonida domlalar dasturni o'z telefonlari yoki turli kompyuterlarda tezkor ochib ko'rishlari uchun noyob gibrid yondashuv qo'llanilgan.

**`safeApi` texnologiyasi:**
Dastur kodlarida `safeApi` nomli maxsus o'zgaruvchi yaratilgan.
U qanday ishlaydi?
1. Dastur avval lokal Mikroservisga ulanishga harakat qiladi.
2. Agar lokal server o'chirilgan bo'lsa (yoki telefondan kirilsa), dastur xato bermaydi!
3. U avtomat tarzda **Global Cloud JSON DB** (REST API) ga ulanadi.

Bu nima degani? Siz kompyuteringizda turib yangi Bemor qo'shsangiz, u butun dunyo bo'ylab bulutga saqlanadi. Domla xuddi shu zaxoti Vercel havolasiga telefondan kirsa, u o'sha bemorni aniq ko'radi. Bularning barchasi soniyaning yuzdan bir bo'lagida sinxronlashadi!

---

## 4. Frontend va Interfeys (UI/UX)

Klinika boshqaruv interfeysi foydalanishga juda qulay qilib yozilgan.

- **Texnologiya:** Dastur eng tezkor **React.js (Vite)** kutubxonasida yaratilgan.
- **Dizayn qismi:** Material-UI (MUI) orqali professional, zamonaviy va sodda (minimalistik) dizayn tuzilgan. Dastur Qorong'u (Dark) va Yorug' (Light) rejimlarni qo'llab-quvvatlaydi.
- **Analitika (Recharts):** Bosh sahifadagi barcha grafiklar (Daromad chiziqlari, Xodimlar taqsimoti, Bemorlar holati aylanasi) qotib qolgan rasm emas. Ular haqiqiy kiritilayotgan ma'lumotlarga qarab raqamlarni avtomatik o'zgartiruvchi **Aqlli Grafiklar** dir.

**Dinamic Selectors:** Dasturdagi "Shifokor" ni tanlash qutisi (Dropdown) statik yozilmagan. Dastur avval Xodimlar (Staff) ro'yxatini o'qiydi va faqatgina lavozimi "Shifokor" bo'lgan xodimlarnigina bemorga biriktirish uchun ajratib beradi. Bu **Relational Data (Bog'langan ma'lumotlar)** tamoyilining amaliy isbotidir.

---

## 5. Himoyada Tushishi Mumkin Bo'lgan Savollar va Javoblar

**Savol: Nega PostgreSQL emas, aynan CockroachDB ishlatdingiz?**
**Javob:** CockroachDB PostgreSQL ga juda o'xshash, lekin u yirik yuklanishlar (HighLoad) uchun mo'ljallangan taqsimlangan (distributed) baza hisoblanadi. Agar kasalxona filillari ko'payib ketsa, serverlar bir-biriga ulanib ma'lumotlarni hech qanday yo'qotishlarsiz saqlashda davom etadi.

**Savol: Nima uchun pul o'lchovini dollarda emas, so'mda qildingiz va formatni qanday qildingiz?**
**Javob:** O'zbekiston miqyosida foydalanishga moslashtirish uchun milliy valyutamiz – so'mga o'tkazdim. Summani o'qish qulay bo'lishi uchun esa `Intl.NumberFormat('uz-UZ')` funksiyasidan foydalanib, pulni mingliklarga (masalan: 1 000 000 so'm) ajratib ko'rsatadigan qildim.

**Savol: Ushbu tizimni haqiqiy poliklinikaga ishlatsa bo'ladimi?**
**Javob:** Albatta! Tizim asosiy qolip sifatida to'liq tayyor. Unga shunchaki tibbiy retseptlar bazasi va telegram bot qo'shilsa (bemorlarga SMS yuborish uchun), bemalol xususiy klinikalarga sotib joriy etish mumkin.

---

**[Yakuniy xulosa]**
Sizning BMI himoyangiz nafaqat dasturlash kodlari bilan, balki ana shunday zamonaviy yechimlar va arxitektura orqali baholanadi. MedUz ERP tizimi o'zining mustahkam backend arxitekturasi va tezkor frontend qismi bilan komissiya a'zolarini to'liq qoniqtira oladi.
