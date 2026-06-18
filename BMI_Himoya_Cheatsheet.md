# BizCore ERP - BMI Himoya Shpargalkasi (Cheatsheet)

## 1. Loyiha Maqsadi va Dolzarbligi
**"BizCore ERP"** — bu korxona va tashkilotlarning barcha ichki operatsiyalarini raqamlashtirish uchun mo'ljallangan, CockroachDB taqsimlangan ma'lumotlar bazasida ishlovchi zamonaviy korxona boshqaruv tizimidir (ERP).
- **Asosiy maqsad:** Korxonadagi resurslarni rejalashtirish, qog'ozbozlikni yo'q qilish hamda HR (Xodimlar), Moliya, Inventar, CRM va Kontraktlarni yagona, shaffof ekotizim orqali avtomatlashtirish.

---

## 2. Tizim Arxitekturasi (Qanday qurilgan?)
*Ushbu loyihaning eng katta amaliy yutug'i — u to'liq integratsiyalashgan, 8 ta mustaqil modullarni birlashtirgan **Ko'p modulli (Multi-module) tizim arxitekturasi** asosida qurilganligidir.*

1. **Frontend (Mijoz qismi):** **React.js** va **Vite** orqali o'ta tezkor interfeys tuzilgan. Analitika uchun **Recharts** grafiklari, PDF chop etish uchun **jsPDF** va **jspdf-autotable** integratsiya qilingan.
2. **Backend (Server qismi):** **Node.js** va **Express** freymvorki yordamida yozilgan tezkor API server.
3. **Ma'lumotlar bazasi:** **CockroachDB** (Yuqori yuklanishlarga (HighLoad) mo'ljallangan, bulutli taqsimlangan SQL ma'lumotlar bazasi).

---

## 3. Loyihaning O'ziga Xosligi va Murakkablik Elementlari
- **Interaktiv Kanban Taxtasi (Tasks Kanban):** Vazifalar bo'limida foydalanuvchi jadval va Kanban ko'rinishlarini almashtira oladi. Kanban ko'rinishida vazifalar holati bo'yicha ustunlarga ajraladi va kartalarni bitta tugma orqali boshqa holatga o'tkazish (drag/drop o'rniga tezkor backend o'zgartirishi) mumkin.
- **Relational CRM-Contracts Bog'lanishi (Bog'liqlik):** 
  - Shartnoma qo'shishda mijoz nomi qo'lda yozilmaydi, balki mijozlar bazasidan dropdown orqali tanlanadi.
  - Mijoz batafsil profili (CRM modal) ochilganda unga tegishli barcha faol shartnomalar, ularning summalari va to'lov foizlari avtomatik yuklanib jadval shaklida ko'rsatiladi.
- **Dinamik Cashflow AreaChart:** Bosh sahifadagi grafik Recharts'ning ilg'or linear gradients va area elementlaridan foydalanib kirim va chiqim oqimini zamonaviy va yorqin tarzda tasvirlaydi.
- **Professional PDF Hisobotlar (Export to PDF):** Har bir modulda hisobot chop etishda yuqorida ko'k rangli banner, operator ism-sharifi, va eng muhimi - moliyaviy hisob-kitoblar yig'indisi (Total summary stats - jami kirim, jami xarajat, sof balans, ombor jami qiymati) qo'shilgan.

---

## 4. Himoyada Kutiladigan Savollarga Javoblar

**Savol: Nega standart PostgreSQL emas, CockroachDB ishlatdingiz?**
**Javob:** "CockroachDB PostgreSQL API bilan mos keladigan, lekin undan farqli o'laroq HighLoad va taqsimlangan (distributed) SQL baza hisoblanadi. Korxona kelajakda viloyatlarda filial ochsa, CockroachDB serverlarni geografik bog'lab, ma'lumotlarni uzilishlarsiz yagona tizimda sinxronlashtirish imkonini beradi."

**Savol: CRM va shartnomalar bog'liqligini qanday ta'minladingiz?**
**Javob:** "Mijozning unikal nomi (Company Name) orqali shartnomalar jadvalidagi `client_name` ustunini bog'ladim. Har safar mijoz profili ochilganda frontend mijoz nomiga mos shartnomalarni API orqali so'rab oladi va interaktiv tarzda ko'rsatadi. Bu ma'lumotlar yaxlitligini ko'rsatib beradi."

**Savol: Ushbu tizimni real biznesda ishlatsa bo'ladimi?**
**Javob:** "Albatta. Tizim to'liq CRUD (Create, Read, Update, Delete) operatsiyalari, ma'lumotlarni validatsiya qilish, kiberxavfsizlik (JWT auth, bcrypt parol shifrlash) va hisobotlarni PDF yuklash imkoniyatlari bilan ta'minlangan. Faqat buxgalteriya hisobi va SMS-eslatmalar qo'shilsa, real korxonada bemalol qo'llash mumkin."
