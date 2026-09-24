# Rencana Refactoring Pengecekan URL & Layouting (AppShell)

Pengecekan `pathname.includes('/layouts/')` atau mem-*bypass* komponen menggunakan kondisi *string matching* pada `AppShell.tsx` adalah anti-pattern di Next.js App Router (berisiko *brittle* atau mudah rusak jika URL berubah).

Berikut adalah 3 opsi pendekatan (Plan) untuk memperbaiki hal ini:

## Opsi 1: Menggunakan Next.js Route Groups & Nested Layouts (Sangat Direkomendasikan 🔥)
Cara paling "Next.js" adalah memisahkan pembungkus (Wrapper) ke dalam `layout.tsx` per grup rute, BUKAN ditaruh semua di `RootLayout` (`src/app/layout.tsx`).
Kita bisa memanfaatkan Route Groups `(nama_bebas)` yang **tidak mengubah struktur URL**.

**Struktur yang diusulkan:**
```text
src/app/
├── layout.tsx                <-- HANYA berisi <html>, <body>, <ThemeProvider>
├── (auth)/                   <-- Route Group untuk Login
│   ├── layout.tsx            <-- Layout Kosong (Tidak ada Sidebar/Navbar)
│   └── login/page.tsx        
├── (editor)/                 <-- Route Group khusus Editor Layout
│   ├── layout.tsx            <-- Layout Fullscreen (Tidak ada Sidebar, overflow hidden)
│   └── studio/layouts/[id]/edit/page.tsx 
└── (dashboard)/              <-- Route Group untuk halaman reguler
    ├── layout.tsx            <-- INILAH tempat AppShell/Sidebar/Navbar berada
    ├── hardware/
    ├── iam/roles/
    └── studio/ (kecuali editor)
```
**Kelebihan:** Bersih, mengikuti *best-practice* Next.js, performa lebih baik (halaman login tidak memuat kode Sidebar sama sekali).

## Opsi 2: Menggunakan Zustand / Context (Layout Dinamis via State)
Jika Anda tidak ingin merombak folder lagi, kita bisa membuat Context/Store untuk mengontrol tampilan `AppShell` langsung dari halaman terkait.
- Pada `AppShell.tsx`: `if (isEditorMode) return <FullscreenLayout/>`
- Pada `layouts/[id]/edit/page.tsx`:
  ```tsx
  useEffect(() => {
    useAppShellStore.setState({ isEditorMode: true, hideSidebar: true });
    return () => useAppShellStore.setState({ isEditorMode: false, hideSidebar: false });
  }, []);
  ```
**Kelebihan:** Struktur folder tetap, fleksibilitas tinggi.
**Kekurangan:** Terkadang ada kedipan (*flicker*) saat perpindahan state dari `false` ke `true` di klien.

## Opsi 3: Menggunakan Konfigurasi Regex (Route Matcher)
Tetap menggunakan `AppShell.tsx` seperti sekarang, namun merapikan logika pengecekan menggunakan utilitas standar seperti `path-to-regexp` atau objek konfigurasi rute (*Array of excluded paths*).
```tsx
const FULLSCREEN_ROUTES = [/^\/login$/, /^\/studio\/layouts\/[^/]+\/edit$/];
const isFullscreen = FULLSCREEN_ROUTES.some(regex => regex.test(pathname));
```
**Kelebihan:** Cepat diimplementasi, tidak mengubah apa-apa secara struktur.
**Kekurangan:** Tetap mengandalkan regex, AppShell tetap ter-render (secara memori) di latar belakang.

---

**Keputusan:** 
Apakah Anda ingin mengimplementasikan **Opsi 1** (merombak menggunakan Route Groups, cara paling rapi), atau **Opsi 3** (memperbaiki logika di dalam `AppShell.tsx` dengan Regex)?
