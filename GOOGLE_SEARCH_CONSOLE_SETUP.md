# Google Search Console Setup Guide

## 🎯 Langkah-langkah Submit Website ke Google

### 1. Verifikasi Website
✅ File verifikasi sudah ada: `public/google2145b94a9220ab11.html`

**Cara Verifikasi:**
1. Buka [Google Search Console](https://search.google.com/search-console)
2. Klik "Add Property"
3. Pilih "URL prefix" dan masukkan: `https://www.lazarusreport.online`
4. Pilih metode verifikasi "HTML file"
5. Google akan mendeteksi file `google2145b94a9220ab11.html` yang sudah ada
6. Klik "Verify"

### 2. Submit Sitemap
Setelah verifikasi berhasil:

1. Di Google Search Console, buka menu "Sitemaps" (sidebar kiri)
2. Masukkan URL sitemap: `sitemap.xml`
3. Klik "Submit"

**Sitemap URL lengkap:** `https://www.lazarusreport.online/sitemap.xml`

### 3. Request Indexing untuk Halaman Penting

Setelah sitemap disubmit, request indexing manual untuk halaman-halaman penting:

1. Di Google Search Console, buka "URL Inspection" (sidebar kiri)
2. Masukkan URL halaman satu per satu:
   - `https://www.lazarusreport.online/`
   - `https://www.lazarusreport.online/conflict-tracker`
   - `https://www.lazarusreport.online/geopolitics`
   - `https://www.lazarusreport.online/analysis`
   - `https://www.lazarusreport.online/military`
   - `https://www.lazarusreport.online/about`
3. Klik "Request Indexing" untuk setiap halaman

### 4. Monitor Performance

**Timeline yang Diharapkan:**
- Indexing pertama: 1-3 hari
- Muncul di hasil pencarian: 3-7 hari
- Ranking stabil: 2-4 minggu
- Logo muncul di Google: 2-6 minggu (setelah structured data terdeteksi)

**Metrics untuk Dimonitor:**
- Total Clicks
- Total Impressions
- Average CTR
- Average Position
- Coverage (indexed pages)

### 5. Optimize untuk "Lazarus Report"

**Target Keywords:**
- lazarus report
- lazarus report global
- lazarus report online
- geopolitical analysis lazarus
- conflict tracker lazarus

**Tips Ranking #1:**
1. ✅ Pastikan "Lazarus Report" muncul di:
   - Title tag (sudah ✓)
   - H1 heading (sudah ✓)
   - Meta description (sudah ✓)
   - URL (sudah ✓)
   - Alt text logo (perlu dicek)

2. ✅ Internal linking:
   - Link antar halaman dengan anchor text "Lazarus Report"
   - Breadcrumbs (sudah ada schema)

3. ✅ External signals:
   - Social media mentions
   - Backlinks dari situs relevan
   - Brand searches

### 6. Bing Webmaster Tools (Bonus)

Bing juga penting untuk diversifikasi traffic:

1. Buka [Bing Webmaster Tools](https://www.bing.com/webmasters)
2. Add site: `https://www.lazarusreport.online`
3. Import dari Google Search Console (lebih mudah) atau verify manual
4. Submit sitemap: `https://www.lazarusreport.online/sitemap.xml`

### 7. Test Structured Data

**Sebelum Submit, Test Dulu:**

1. **Rich Results Test:**
   - URL: https://search.google.com/test/rich-results
   - Masukkan: `https://www.lazarusreport.online`
   - Pastikan Organization dan WebSite schema terdeteksi

2. **Schema Validator:**
   - URL: https://validator.schema.org/
   - Masukkan: `https://www.lazarusreport.online`
   - Pastikan tidak ada error

3. **Mobile-Friendly Test:**
   - URL: https://search.google.com/test/mobile-friendly
   - Masukkan: `https://www.lazarusreport.online`
   - Pastikan mobile-friendly

### 8. Troubleshooting

**Jika Logo Tidak Muncul di Google:**
- Tunggu 2-6 minggu (Google perlu waktu)
- Pastikan logo minimal 112x112px (logo kita 512x512 ✓)
- Pastikan Organization schema valid
- Logo harus di domain yang sama (✓)
- Format PNG/JPG (✓)

**Jika Tidak Terindex:**
- Check robots.txt tidak block
- Check canonical URL benar
- Check tidak ada noindex tag
- Request indexing manual
- Tunggu 3-7 hari

**Jika Ranking Rendah:**
- Tambah content berkualitas
- Build backlinks
- Improve user engagement (CTR, dwell time)
- Optimize page speed
- Add more internal links

### 9. Quick Commands untuk Testing

```bash
# Test robots.txt
curl https://www.lazarusreport.online/robots.txt

# Test sitemap
curl https://www.lazarusreport.online/sitemap.xml

# Test Google verification
curl https://www.lazarusreport.online/google2145b94a9220ab11.html

# Test manifest
curl https://www.lazarusreport.online/manifest.json
```

### 10. Content Strategy untuk SEO

**Publish Regular Content:**
- Minimal 2-3 artikel per minggu
- Focus pada keywords: geopolitical analysis, conflict tracker, OSINT
- Long-form content (1000+ words)
- Include images dengan alt text
- Internal linking ke halaman lain

**Content Ideas:**
- Daily conflict updates
- Weekly geopolitical analysis
- Monthly trend reports
- Breaking news coverage
- Expert interviews

---

## ✅ Checklist Sebelum Submit

- [x] Website deployed dan live
- [x] Google verification file ada
- [x] Sitemap.xml accessible
- [x] Robots.txt configured
- [x] Structured data implemented
- [x] Meta tags optimized
- [x] Logo accessible
- [x] Mobile-friendly
- [ ] Submit ke Google Search Console
- [ ] Submit sitemap
- [ ] Request indexing
- [ ] Monitor performance

---

**Status:** Ready to Submit! 🚀

**Next Action:** Submit website ke Google Search Console sekarang!

**Expected Result:** 
- Muncul di Google dalam 3-7 hari
- Logo muncul dalam 2-6 minggu
- Ranking #1 untuk "lazarus report" dalam 2-4 minggu (dengan content strategy yang baik)
