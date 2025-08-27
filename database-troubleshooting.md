# Database Troubleshooting Guide - Player Exit Issue

## Masalah yang Terjadi
Player yang menekan "Exit Game" di halaman wait tidak hilang dari host view secara real-time.

## Penyebab Potensial dan Solusi

### 1. **Real-time Subscription Issues**
**Status**: ✅ DIPERBAIKI
- Channel name dibuat unik per game: `players-${gameId}`
- Menambahkan delay 100ms untuk memastikan konsistensi database
- Menambahkan logging untuk subscription status

### 2. **Database Row Level Security (RLS)**
**Status**: ⚠️ PERLU DICEK

Pastikan tabel `players` memiliki RLS policy yang benar:

```sql
-- Cek RLS policy untuk tabel players
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'players';

-- Jika tidak ada policy untuk DELETE, tambahkan:
CREATE POLICY "Allow delete players" ON players
FOR DELETE USING (true);

-- Atau policy yang lebih spesifik:
CREATE POLICY "Allow delete own player" ON players
FOR DELETE USING (
  auth.uid() IS NOT NULL OR 
  current_setting('request.jwt.claims', true)::json->>'role' = 'authenticated'
);
```

### 3. **Database Indexes**
**Status**: ⚠️ PERLU DICEK

Pastikan ada index yang tepat untuk performa query:

```sql
-- Cek index yang ada
SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'players';

-- Jika belum ada, tambahkan index:
CREATE INDEX IF NOT EXISTS idx_players_game_id ON players(game_id);
CREATE INDEX IF NOT EXISTS idx_players_game_name ON players(game_id, name);
CREATE INDEX IF NOT EXISTS idx_players_id_game ON players(id, game_id);
```

### 4. **Database Triggers**
**Status**: ⚠️ PERLU DICEK

Pastikan tidak ada trigger yang menghalangi deletion:

```sql
-- Cek trigger yang ada pada tabel players
SELECT tgname, tgtype, tgenabled, tgisinternal, prosrc
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE tgrelid = 'players'::regclass;
```

### 5. **Supabase Real-time Configuration**
**Status**: ⚠️ PERLU DICEK

Pastikan real-time diaktifkan untuk tabel players:

1. Buka Supabase Dashboard
2. Pergi ke Database > Replication
3. Pastikan tabel `players` ada dalam daftar "Tables in replication"
4. Jika tidak, tambahkan dengan klik "Add table"

### 6. **Network/Connection Issues**
**Status**: ✅ DIPERBAIKI
- Menambahkan fallback deletion methods
- Menambahkan verification step
- Menambahkan error handling yang lebih robust

## Langkah Verifikasi

### Test Manual:
1. Buka 2 browser/tab: satu sebagai host, satu sebagai player
2. Join game sebagai player
3. Verifikasi player muncul di host view
4. Klik "Exit Game" di player view
5. Cek apakah player hilang dari host view dalam 1-2 detik

### Database Check:
```sql
-- Cek apakah player benar-benar terhapus dari database
SELECT * FROM players WHERE game_id = 'GAME_ID_HERE';
```

### Browser Console Check:
- Cek console log di host browser untuk melihat subscription messages
- Cek console log di player browser untuk melihat deletion process

## Solusi Implementasi

### A. Perbaikan Kode (✅ SELESAI)
1. **WaitContent.tsx**:
   - Perbaikan logic deletion dengan ID-based deletion
   - Menambahkan fallback methods
   - Menambahkan verification step
   - Menghapus multiple setTimeout yang bisa menyebabkan race condition

2. **HostContent.tsx**:
   - Unique channel name per game
   - Delay untuk konsistensi database
   - Subscription status logging

### B. Database Configuration (⚠️ BUTUH PENGECEKAN)
Jalankan query SQL di atas untuk memastikan:
- RLS policies benar
- Index tersedia
- Tidak ada trigger yang menghalangi
- Real-time replication aktif

## Monitoring

Untuk memantau masalah ini di production:

```javascript
// Tambahkan di WaitContent handleExit
console.log('[DEBUG] Player deletion:', {
  gameId,
  playerName,
  timestamp: new Date().toISOString()
});

// Tambahkan di HostContent subscription
console.log('[DEBUG] Received player deletion event:', {
  payload,
  timestamp: new Date().toISOString()
});
```
