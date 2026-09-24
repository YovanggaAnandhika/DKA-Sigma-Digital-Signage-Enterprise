# Rencana Restrukturisasi Folder Frontend (Berdasarkan Domain / Modul)

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
1. **Memindahkan Folder API:** Memindahkan folder-folder di dalam `(api)/api/grpc` ke sub-folder domain `hardware`, `iam`, dan `studio`.
2. **Memperbarui Path Pemanggilan API:** Mengubah path URL di komponen/service frontend yang melakukan pemanggilan `fetch` ke endpoint `/api/grpc/...` agar menyesuaikan dengan penambahan domain.
3. **Memindahkan Folder Apps:** Memindahkan halaman-halaman utama ke dalam Route Groups `(hardware)`, `(iam)`, `(studio)`, dan `(distribution)`.
4. **Memperbarui Relative Imports:** Memperbarui path impor (seperti komponen, context, service) yang terdampak akibat perpindahan folder halaman.
5. **Verifikasi:** Melakukan *build* (`bunx tsc --noEmit` & `bun run build`) untuk memastikan tidak ada *import* atau *routing* yang rusak.

Apakah Anda setuju dengan rancangan struktur di atas, khususnya pada penggunaan **Route Groups** `(domain)` untuk halaman agar rute URL tidak berubah? Ataukah Anda ingin URL-nya ikut berawalan domain seperti `/studio/layouts`?
