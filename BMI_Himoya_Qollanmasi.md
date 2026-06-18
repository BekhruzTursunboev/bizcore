# BizCore ERP - BMI Himoyasi Uchun To'liq Qo'llanma

Ushbu hujjat **BizCore ERP** loyihasining qanday ishlashi, uning ichki arxitekturasi va kodlarini to'liq va sodda tilda (lekin ilmiy darajada) tushuntirib beradi. Siz ushbu hujjatdan Bitiruv Malakaviy Ishi (BMI) himoyasi paytida komissiya savollariga javob berishda bemalol foydalanishingiz mumkin.

---

## 1. Loyiha Maqsadi va Dolzarbligi

**Maqsad:** Korxonalardagi byurokratiya va qog'ozbozlikni yo'q qilish, xodimlar (HR), moliya ko'rsatkichlari, ombor inventari, vazifalar, mijozlar va shartnomalarni bitta markazlashgan ekotizimdan boshqarish.

Hozirgi kunda ko'plab o'rta va yirik korxonalar ma'lumotlarni Excel yoki eskirgan lokal dasturlarda tarqoq holda saqlaydi. BizCore esa zamonaviy bulutli texnologiyalar va taqsimlangan SQL CockroachDB bazasi orqali yuqori xavfsizlik, tezlik va barqarorlikni ta'minlaydi.

---

## 2. Tizim Arxitekturasi va Rollar (Multi-role Administration)

Tizimda rollarga asoslangan ruxsatlar (Role-Based Access Control — RBAC) o'rnatilgan bo'lib, foydalanuvchilar o'z rollariga mos menyularni ko'radilar:
- **Direktor (Admin):** Tizimdagi eng katta vakolatga ega rol. Barcha moliyaviy tushumlar, oylik va haftalik grafik analitikalar, xodimlarni boshqarish va bo'limlar byudjetini tasdiqlash huquqiga ega.
- **Menejerlar (HR, Moliya, Savdo):** O'zlarining professional modullari bo'yicha cheklangan, lekin to'liq CRUD operatsiyalarini boshqara oladigan hisoblar (masalan: HR Menejer xodimlarni boshqaradi, Savdo Menejeri mijozlar va kontraktlar bilan ishlaydi).
- **Xodim (Xodimlar):** Tizimda o'ziga yuklatilgan vazifalarni (Tasks) ko'radi, bajarilish foizini yangilaydi hamde shartnomalarni tahrirlay oladi.

---

## 3. Loyihadagi "Murakkab va God-Tier" Xususiyatlar

### A. Interaktiv Kanban Board (Vazifalar nazorati)
Ko'p talabalar oddiy jadvallar ko'rsatishadi. BizCore ilovasida esa vazifalar sahifasida **Jadval va Kanban** ko'rinishlari joriy etilgan. Kanban rejimida vazifalar real-time holatlarga (Yangi, Jarayonda, Bajarildi, Bekor qilindi) ajraladi va kartochkalar pastidagi tezkor tugmalar orqali holati zudlik bilan bazada yangilanadi. Bu loyihani boshqarishning eng ilg'or uslubidir.

### B. Relational Integrity (Mijoz va Shartnoma bog'liqligi)
Mijozlar (CRM) va Shartnomalar modullari o'rtasida ma'lumotlar yaxlitligi ta'minlangan:
1. Yangi kontrakt tuzayotganda mijoz nomi qo'lda yozilmaydi, bu xatoliklarni oldini olish uchun bazadagi mijozlar ro'yxatidan (Dropdown Select) tanlanadi.
2. Mijoz batafsil profili ko'rilganda, dastur avtomatik tarzda ushbu mijozga biriktirilgan barcha shartnomalarni yig'ib jadval ko'rinishida taqdim etadi.

### C. Premium Analitika (Gradientli AreaChart)
Bosh sahifada Recharts kutubxonasi yordamida kirim va chiqim oqimi gradient ranglar (AreaChart) yordamida chiziladi. Grafiklar statik rasm emas, ma'lumotlar o'zgarganda avtomatik o'zgaruvchi interaktiv komponentlardir.

### D. Corporate PDF Generator (Jamlangan Hisobotlar)
Barcha jadvallarda taqdim etilgan PDF tugmasi oddiy ro'yxat emas, balki korporativ hujjat yaratadi:
- Yuqori qismida ko'k rangli sarlavha paneli;
- Moliyaviy va statistik jamlanmalar (Jami summalar, balans, inventar qiymati va h.k.);
- Qulay jadval va chop etgan operator hamda sana ko'rsatiladi.

---

## 4. Himoyada Kutiladigan Savollar va Javoblar

**Savol: Nega standart PostgreSQL emas, CockroachDB ishlatdingiz?**
**Javob:** "CockroachDB PostgreSQL API bilan mos keladigan, lekin undan farqli o'laroq HighLoad va taqsimlangan (distributed) SQL baza hisoblanadi. Korxona kelajakda viloyatlarda filial ochsa, CockroachDB serverlarni geografik bog'lab, ma'lumotlarni uzilishlarsiz yagona tizimda sinxronlashtirish imkonini beradi."

**Savol: CRM va shartnomalar bog'liqligini qanday ta'minladingiz?**
**Javob:** "Mijozning unikal nomi (Company Name) orqali shartnomalar jadvalidagi `client_name` ustunini bog'ladim. Har safar mijoz profili ochilganda frontend mijoz nomiga mos shartnomalarni API orqali so'rab oladi va interaktiv tarzda ko'rsatadi. Bu ma'lumotlar yaxlitligini ko'rsatib beradi."

**Savol: Ushbu tizimni real biznesda ishlatsa bo'ladimi?**
**Javob:** "Albatta. Tizim to'liq CRUD (Create, Read, Update, Delete) operatsiyalari, ma'lumotlarni validatsiya qilish, kiberxavfsizlik (JWT auth, bcrypt parol shifrlash) va hisobotlarni PDF yuklash imkoniyatlari bilan ta'minlangan. Faqat buxgalteriya hisobi va SMS-eslatmalar qo'shilsa, real korxonada bemalol qo'llash mumkin."
