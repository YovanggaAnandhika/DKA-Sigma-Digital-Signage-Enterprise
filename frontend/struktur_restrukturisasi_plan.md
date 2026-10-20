# Rencana Restrukturisasi Folder Frontend (Berdasarkan Domain / Modul)

> **Status per 2026-10-20 (hasil kalibrasi):**
> - **API gRPC: SELESAI.** `frontend/src/app/(api)/api/grpc/` sudah terbagi menjadi `common/`, `hardware/`, `iam/`, `studio/`, dan `distribution/`.
> - **Halaman: BELUM dipindah ke `(apps)`.** Halaman masih berada di `(dashboard)/hardware`, `(dashboard)/iam`, dan `(dashboard)/studio`; tidak ada folder `distribution/simulator`.
> - Rencana Route Groups `(apps)` di bawah **belum dieksekusi** dan sifatnya opsional.

Berdasarkan struktur *protobuf* di backend, terdapat 4 domain utama yaitu: **`hardware`**, **`iam`**, **`studio`**, dan **`distribution`**. Kita akan merapikan struktur API dan halaman (apps) di frontend agar selaras dengan domain-domain tersebut.

## 1. Restrukturisasi `(api)/api/grpc`
Saat ini semua *route* gRPC berada di satu level (`api/grpc/*`). Kita akan memindahkannya ke dalam folder domain masing-masing. (Perubahan ini akan mengubah *endpoint* URL dari `/api/grpc/device` menjadi `/api/grpc/hardware/device`, sehingga kita juga perlu memperbarui *service caller* di sisi *client* jika ada pemanggilan fetch manual, namun karena gRPC menggunakan client generation, URL fetch manual mungkin harus dicek ulang).

**Struktur Baru:**
```text
frontend/src/app/(api)/api/grpc/
├── hardware/
│   ├── device/
│   └── display_group/
├── iam/
│   ├── permission/
│   ├── role/
│   └── user/
└── studio/
    ├── layer/
    ├── layer_block/
    ├── layer_override/
    ├── layout/
    ├── media/
    ├── playlist/
    ├── schedule/
    ├── transition/
    └── visual_filter/
```

## 2. Restrukturisasi Halaman `(apps)`
Untuk merapikan hierarki halaman tanpa mengubah rute URL asli (misal `/layouts` tetap `/layouts`), kita bisa menggunakan **Route Groups** bawaan Next.js (menggunakan tanda kurung `(...)`). Jika Anda ingin URL-nya ikut berubah (misal menjadi `/studio/layouts`), kita bisa menggunakan nama folder biasa.

*(Saya merekomendasikan menggunakan Route Groups agar rapi di kode namun URL tetap ramah pengguna / tidak berubah).*

**Struktur Baru (Menggunakan Route Groups):**
```text
frontend/src/app/(apps)/
├── (hardware)/
│   ├── displays/
│   └── groups/
├── (iam)/
│   ├── login/
│   └── roles/
├── (studio)/
│   ├── layouts/
│   ├── media/
│   ├── playlists/
│   └── schedules/
└── (distribution)/
    └── simulator/
```

## 3. Langkah-Langkah Eksekusi
1. **Memindahkan Folder API — SELESAI:** Folder di `(api)/api/grpc` sudah dikelompokkan per domain (`common`, `hardware`, `iam`, `studio`, `distribution`).
2. **Memperbarui Path Pemanggilan API — SELESAI:** Service di `src/lib/services/` sudah memakai endpoint berdomain.
3. **Memindahkan Folder Apps — BELUM:** Halaman masih di `(dashboard)/hardware`, `(dashboard)/iam`, `(dashboard)/studio`.
4. **Memperbarui Relative Imports — hanya relevan bila langkah 3 dikerjakan.**
5. **Verifikasi:** Gunakan `bunx tsc --noEmit` dan `bun run lint`. **Jangan** menjalankan `bun run build`/`next build` (dilarang oleh AGENTS.md; dev server berjalan via Docker Compose dengan HMR).

Keputusan yang masih terbuka: apakah tetap memakai URL datar (`/hardware/...`, `/studio/...`) dengan Route Groups `(apps)`, atau mengubah URL menjadi berawalan domain (`/studio/layouts`). Saat ini URL datar yang berlaku.
