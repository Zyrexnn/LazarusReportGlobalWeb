# API News - Automatic Failover System

## Perubahan yang Dilakukan

### 1. API Health Tracking
- Setiap API sekarang dipantau kesehatannya (health status)
- Jika API gagal 3 kali berturut-turut, akan diblokir selama 10 menit
- Health status akan direset otomatis setelah 30 menit tanpa kegagalan

### 2. Automatic Failover
- Sistem mencoba SATU provider pada satu waktu
- Hanya beralih ke provider berikutnya jika yang pertama GAGAL
- Provider yang tidak sehat akan dilewati dalam rotasi
- Jika semua provider gagal, sistem akan mencoba ulang dengan provider yang diblokir

### 3. AGGRESSIVE Deduplication
- **Exact URL matching** - URL yang sama = duplikat
- **Exact title matching** - Judul yang sama persis = duplikat
- **Image matching** - Gambar yang sama = kemungkinan duplikat
- **Smart similarity** - Judul dengan kesamaan >70% = duplikat
- **Cross-check** - Gambar sama + judul mirip >50% = duplikat

### 4. Single Source Strategy
**PENTING**: Sistem sekarang hanya menggunakan SATU API per request!
- Tidak lagi mencampur artikel dari berbagai API
- Hanya beralih ke API lain jika yang pertama gagal total
- Ini menghilangkan duplikasi dari berbagai sumber

### 5. Multiple Sources (Backup)
API yang tersedia sebagai backup:
- **GNews** - Berita global dengan kategori
- **NewsData** - Agregator berita internasional
- **WorldNews** - API berita dunia
- **Finnhub** - Fokus pada finance dan crypto

### 6. Smart Provider Selection
Provider dipilih berdasarkan kategori:
- **Geopolitik**: GNews → NewsData → WorldNews
- **Military**: NewsData → GNews → WorldNews
- **Markets/Finance**: Finnhub → GNews → NewsData
- **Crypto**: Finnhub → GNews

### 7. Error Handling
- Deteksi rate limit (429) dan server errors (500+)
- Timeout 8 detik per request
- Fallback ke artikel default jika semua API gagal
- Logging untuk debugging

## Cara Kerja

1. Request masuk untuk kategori tertentu
2. Sistem cek cache (5 menit TTL)
3. Jika tidak ada cache, ambil daftar provider yang sehat
4. Coba provider pertama
5. **Jika berhasil, STOP dan gunakan hasil dari provider ini saja**
6. Jika gagal, coba provider berikutnya
7. Ulangi sampai dapat hasil
8. Jalankan aggressive deduplication
9. Simpan hasil ke cache

## Monitoring

Response API sekarang menyertakan informasi debug:
```json
{
  "articles": [...],
  "apiUsed": "GNews",
  "providerOrder": ["GNews", "NewsData", "WorldNews"],
  "attempted": [
    { "name": "GNews", "success": true, "count": 15 }
  ],
  "failed": [],
  "deduplication": {
    "before": 15,
    "after": 12,
    "removed": 3
  }
}
```

## Konfigurasi

Pastikan semua API keys sudah diisi di file `.env`:
```
NEWSDATA_API_KEY=your_key
WORLDNEWS_API_KEY=your_key
FINNHUB_API_KEY=your_key
GNEWS_API_KEY=your_key
```

## Keuntungan

✅ Tidak ada single point of failure
✅ Automatic recovery dari API yang down
✅ Rate limit handling
✅ **TIDAK ADA DUPLIKASI** - algoritma deduplikasi yang sangat ketat
✅ **Single source per request** - tidak mencampur dari berbagai API
✅ Caching untuk mengurangi API calls
✅ Logging untuk debugging
✅ Image-based deduplication
✅ Smart title similarity detection
