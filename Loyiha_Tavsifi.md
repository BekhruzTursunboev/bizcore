# MedUz ERP - Zamonaviy Klinik Boshqaruv Tizimi
**Bitiruv Malakaviy Ishi (BMI)**
**Muallif:** Komilov Fazliddin

## 1. Loyiha Haqida Qisqacha Ma'lumot
MedUz ERP — bu zamonaviy shifoxona va klinikalarni to'liq raqamlashtirish uchun mo'ljallangan, yuqori yuklanishga (HighLoad) bardosh bera oladigan avtomatlashtirilgan tizim. Loyiha qog'ozbozlikni kamaytirish, bemorlar navbatini optimallashtirish, kassa va moliya tushumlarini shaffof nazorat qilish hamda xodimlar boshqaruvini bir joyga jamlash uchun ishlab chiqilgan.

## 2. Dasturiy Arxitektura (God-Tier Microservices)
Ushbu loyihaning eng katta ilmiy va amaliy yutug'i uning monolit emas, balki **Mikroservislar arxitekturasi (Microservices Architecture)** da yozilganligidadir. Tizim quyidagi 5 ta mustaqil backend xizmatlarga bo'lingan:
1. **API Gateway:** Barcha keladigan so'rovlarni qabul qilib, mos xizmatlarga taqsimlaydi.
2. **Patient Service (Bemorlar xizmati):** Bemorlarning kasallik tarixi va ma'lumotlarini qayta ishlaydi.
3. **Appointment Service (Navbatlar xizmati):** Shifokor qabullariga yozilish, vaqtni bron qilish amallarini bajaradi.
4. **Billing Service (Moliya xizmati):** To'lovlar, kassa va shaffof tushumlarni boshqaradi.
5. **Staff Service (Xodimlar xizmati):** Klinika shifokorlari va hamshiralarini ro'yxatga oladi.

## 3. Texnologiyalar Steki (Technology Stack)
Loyihada bugungi kunning eng zamonaviy va korporativ darajadagi texnologiyalari qo'llanilgan:
- **Frontend (Foydalanuvchi interfeysi):** React.js, Vite, Material-UI (MUI), Recharts (Analitika uchun).
- **Backend (Orqa fon):** NestJS (Node.js freymvorki), TypeScript, RxJS, TCP transport (Mikroservislar o'zaro aloqasi uchun).
- **Ma'lumotlar Bazasi (Database):** CockroachDB (Taqsimlangan, yuqori xavfsizlikka ega SQL baza) hamda Global Cloud JSON API (Cross-device sinxronizatsiya uchun).
- **Infratuzilma:** Docker, Docker Compose, Vercel (Deployment uchun).

## 4. Loyiha Imkoniyatlari
- **Dinamik Asosiy Boshqaruv (Command Center):** Klinikaning real vaqtdagi daromadlari, navbatlar soni va xodimlar taqsimoti interaktiv grafiklarda aks etadi.
- **Mukammal Bemorlar tizimi:** Bemorlarni tizimda ro'yxatga olish, avtomat tarzda "Xodimlar" bo'limidagi haqiqiy Shifokorlarga biriktirish.
- **Kassa tushumlari va PDF Hisobotlar:** To'lovlarni avtomatlashtirish, qarz va to'langan maqomlarni belgilash hamda istalgan jadvalni PDF shaklida chop etish (Export to PDF).
- **Cross-Device Moslashuvchanligi:** Dastur planshet, mobil telefon va katta kompyuter ekranlarida birdek mukammal ishlaydi (Responsive Grid Design).

## 5. Xulosa
MedUz ERP tizimi o'zining mustahkam backend arxitekturasi va tezkor frontend qismi bilan nafaqat O'zbekiston, balki xalqaro tibbiyot muassasalarida bemalol joriy etilishi mumkin bo'lgan dasturiy mahsulot hisoblanadi.
