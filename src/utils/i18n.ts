export type Language = 'en' | 'id';

export const translations = {
  en: {
    nav: {
      home: 'Home',
      liveTv: 'Live TV',
      shipTracker: 'Ship Tracker',
      flightTracker: 'Flight Tracker',
      conflictTracker: 'Conflict Tracker',
      analysis: 'Analysis',
      about: 'About',
    },
    hero: {
      breakingLabel: 'Hot Intelligence',
      headlineLead: 'Middle East heats up.',
      headlineFocus: 'Who is pushing the line now?',
      subtitle: 'Sharp updates on pressure points, troop moves, energy routes, and market shocks. Fast, clear, no fluff.',
      readAnalysis: 'Read The Brief',
      aboutLazarus: 'Why Lazarus',
      timeAgo: 'hours ago',
      cards: [
        {
          category: 'Geopolitics',
          title: 'NATO pressure rises in Eastern Europe. Diplomatic fallout next?',
          time: '2'
        },
        {
          category: 'Military',
          title: 'US carrier group enters the Gulf. Deterrence move or setup?',
          time: '4'
        },
        {
          category: 'Breaking',
          title: 'Hormuz tension hits oil hard. How far can this run?',
          time: '6'
        },
        {
          category: 'Crypto',
          title: 'Bitcoin jumps again as big money piles in. FOMO starts now?',
          time: '8'
        }
      ]
    },
    sections: {
      latestIntelligence: 'Intelligence Update',
      lazarusExclusive: 'Lazarus Spotlight',
      liveMarkets: 'Market Pulse',
      filter: 'Filter',
      searchPlaceholder: 'Search...',
      sortLatest: 'Latest',
      sortRelevance: 'Relevance',
      noArticles: 'No articles found.',
      adjustFilters: 'Try another filter or keyword.',
      source: '',
      loadingMap: 'Loading map...',
      vesselsTracked: 'vessels tracked',
    },
    shipTracker: {
      title: 'Global Maritime Intelligence',
      subtitle: 'Real-time Strategic Deployment Monitoring',
      activeVessels: 'Active Vessels Tracked',
      criticalZones: 'Critical Zones Monitored',
      alerts: 'Strategic Alerts',
    },
    about: {
      title: 'About Lazarus Report',
      philosophyTitle: 'Why Lazarus',
      philosophyText: 'Lazarus stands for information brought back to life. When headlines get polished and facts get buried, we dig again until the picture is clear.',
      whoWeAreTitle: 'Who We Are',
      whoWeAreText: 'We are an independent media desk. No state ties. No corporate leash. We track geopolitics, military risk, energy stress, and market shocks.',
      coverageTitle: 'What We Track',
      coverageText: 'We watch global flashpoints, live maritime traffic, conflict zones, oil routes, and crypto flows. Why guess when the movement is visible?',
      commitmentTitle: 'What We Promise',
      commitmentText: 'Independent. Direct. Precise. We do not spoon-feed conclusions. We give you the facts, the context, and the pressure points that matter.',
      disclaimer: 'This platform is for information only. It is not financial, investment, legal, or security advice.',
      followCta: 'Stay close to the signal',
    },
    categories: {
      all: 'All',
      geopolitics: 'Geopolitics',
      military: 'Military',
      markets: 'Markets',
      finance: 'Finance',
      crypto: 'Crypto',
      oilEnergy: 'Oil & Energy',
      middleEast: 'Middle East',
      breaking: 'Breaking',
      analysis: 'Analysis',
      intelligence: 'Intelligence',
      deepDive: 'Deep Dive',
    },
    pages: {
      geopolitics: {
        title: 'Geopolitics',
        description: 'Power pressure, alliance shifts, and the moves that keep redrawing the map.',
        metaDescription: 'Sharp geopolitical analysis on alliances, diplomatic stress, power shifts, and global fallout.'
      },
      military: {
        title: 'Military & Defense',
        description: 'Troop moves, deterrence signals, and conflicts that can turn fast.',
        metaDescription: 'Military deployments, defense posture, weapons systems, and real conflict analysis.'
      },
      markets: {
        title: 'Markets & Finance',
        description: 'Oil, crypto, and global markets under pressure. Where does the money run next?',
        metaDescription: 'Live market data, financial pressure points, crypto tracking, and global economic intelligence.'
      },
      crypto: {
        title: 'Crypto',
        description: 'Digital asset flows, sentiment shifts, and the money behind the move.',
        metaDescription: 'Cryptocurrency market analysis, Bitcoin, Ethereum, and digital asset intelligence.'
      },
      analysis: {
        title: 'Analysis',
        description: 'Long reads for when headlines are not enough.',
        metaDescription: 'In-depth analytical reports on geopolitics, security, economics, and global trends.'
      },
      liveTv: {
        title: 'Live TV',
        description: 'Track live coverage from Al Jazeera English, France 24, and Bloomberg Television in one focused monitoring desk.',
        metaDescription: 'Watch live YouTube news streams from Al Jazeera English, France 24 English, and Bloomberg Television in a production-ready monitoring page.'
      },
      flightTracker: {
        title: 'Global Flight Intelligence',
        description: 'Real-time Strategic Air Traffic Monitoring',
        metaDescription: 'Track live global flight data, military transponders, and strategic air corridors.'
      },
      conflictTracker: {
        title: 'Conflict Intelligence',
        description: 'OSINT tracker for the Iran-US-Israel conflict operations and associated geopolitical data.',
        metaDescription: 'Track real-time data, waves, and tactical intelligence on the Iran-Israel-US conflict using OSINT sources.'
      }
    },
    footer: {
      description: 'Independent intelligence on geopolitics, military risk, markets, and maritime pressure points. Clear facts. Sharp framing.',
      coverage: 'Coverage',
      connect: 'Connect',
      disclaimer: 'For information only. Not financial, legal, investment, or strategic advice.',
      rights: 'Lazarus Report Global. All rights reserved.',
      builtWith: 'Built with',
      forTruth: 'for clarity'
    },
    shipTrackerUI: {
      globalLiveTracking: 'Global Live Tracking',
      statusOnline: 'SYS.STATUS: ONLINE | LATENCY: 12ms | SAT.UPLINK: ACTIVE',
      coords: 'COORDINATES: CLASSIFIED',
      encryption: 'ENCRYPTION: AES-256',
      chokepointTraffic: 'Chokepoint Traffic',
      fullMap: 'Open Full Map',
      tacticalAlerts: 'TACTICAL ALERTS',
      feedLoading: 'Opening live feed',
      relayActive: 'Live AIS relay is on',
      encryptedFeed: 'encrypted feed',
      alerts: [
        '> US CARRIER STRIKE GROUP DETECTED IN PERSIAN GULF',
        '> Houthi missile activity reported near RED SEA',
        '> GPS Spoofing detected in Black Sea region'
      ],
      rawFeed: 'RAW_FEED:',
      logs: [
        '> Establishing secure connection...',
        '> Receiving AIS packets [Batch 0x4F2A]',
        '> Decrypting position data...',
        '> Filtering military vessels...',
        '> Overlaying target signatures...',
        '> Validating checksums...',
        '> Re-establishing handshake...',
        '> Packets decoded.'
      ]
    },
    conflictTrackerUI: {
      title: 'CONFLICT INTELLIGENCE',
      statusOnline: 'SYS.STATUS: ONLINE | DATA LINK: SECURE',
      totalWaves: 'Total Waves',
      totalFatalities: 'Reported Fatalities',
      countriesTargeted: 'Countries Targeted',
      daysActive: 'Days Active',
      timeline: 'Operational Timeline',
      latestIncidents: 'Latest Tactical Incidents',
      wave: 'Wave',
      date: 'Date',
      weapons: 'Payload',
      targets: 'Targets',
      outcome: 'Outcome',
      casualties: 'Casualties',
      loading: 'Decrypting intel feed...',
      source: 'Data Source:'
    },
    flightTrackerUI: {
      globalLiveTracking: 'Global Air Intelligence',
      statusOnline: 'SYS.STATUS: ONLINE | LATENCY: 8ms | SAT.UPLINK: ACTIVE',
      coords: 'FLIGHT_PATH: CLASSIFIED',
      encryption: 'ENCRYPTION: AES-256',
      airTraffic: 'Strategic Air Corridor',
      fullMap: 'Open Tactical Map',
      tacticalAlerts: 'AIRSPACE ALERTS',
      feedLoading: 'Syncing transponder data',
      relayActive: 'Live ADSB relay is on',
      encryptedFeed: 'encrypted air digits',
      alerts: [
        '> NATO AWACS DETECTED IN POLAND-UKRAINE BORDER',
        '> US Air Force Global Hawk activity in Black Sea',
        '> Tanker fleet movement near STRAIT OF HORMUZ'
      ],
      rawFeed: 'ADSB_RAW:',
      logs: [
        '> Handshaking with ADSB-FI nodes...',
        '> Fetching transponder packets [Batch 0x9B1C]',
        '> Decrypting squawk codes...',
        '> Filtering civil-military mix...',
        '> Mapping altitude & velocity vectors...',
        '> Validating hex-id signatures...',
        '> Secure uplink maintained.',
        '> Digits synced.'
      ]
    },
    sidebar: {
      article1: 'BRICS shifts again. New bloc, new pressure, new game.',
      article2: 'Fresh satellite shots show military build-up. Routine move? Hardly.',
      article3: 'Energy war is back on. Who controls tomorrow now?'
    },
    verification: {
      title: 'SECURE ACCESS PROTOCOL',
      subtitle: 'HUMAN VERIFICATION REQUIRED',
      slide: 'SLIDE TO UNLOCK SYSTEM',
      code: 'ENTER ACCESS CODE',
      status: 'SYS.STATUS: PENDING_VERIFICATION',
      granted: 'ACCESS GRANTED. DECRYPTING FEED...'
    }
  },
  id: {
    nav: {
      home: 'Beranda',
      liveTv: 'Live TV',
      shipTracker: 'Pelacak Kapal',
      flightTracker: 'Pelacak Pesawat',
      conflictTracker: 'Pelacak Konflik',
      analysis: 'Analisis',
      about: 'Tentang',
    },
    hero: {
      breakingLabel: 'Berita Panas',
      headlineLead: 'Tekanan Timur Tengah makin parah.',
      headlineFocus: 'Siapa yang sedang dorong situasi ke batas?',
      subtitle: 'Update jitu soal titik panas, gerak militer, jalur energi, dan pasar yang bisa berbalik habis dalam hitungan jam.',
      readAnalysis: 'Baca Update',
      aboutLazarus: 'Kenapa Lazarus',
      timeAgo: 'jam lalu',
      cards: [
        {
          category: 'Geopolitik',
          title: 'Tekanan NATO di Eropa Timur naik lagi. Krisis diplomatik baru?',
          time: '2'
        },
        {
          category: 'Militer',
          title: 'Kapal induk AS masuk Teluk. Cuma jaga-jaga atau sinyal keras?',
          time: '4'
        },
        {
          category: 'Berita Panas',
          title: 'Hormuz memanas, minyak langsung lompat. Baru mulai?',
          time: '6'
        },
        {
          category: 'Crypto',
          title: 'Bitcoin naik tajam lagi. Uang besar masuk diam-diam?',
          time: '8'
        }
      ]
    },
    sections: {
      latestIntelligence: 'Intelijen Terkini',
      lazarusExclusive: 'Sorotan Lazarus',
      liveMarkets: 'Update Pasar Hari Ini',
      filter: 'Filter',
      searchPlaceholder: 'Cari...',
      sortLatest: 'Terbaru',
      sortRelevance: 'Relevansi',
      noArticles: 'Belum ada artikel yang cocok.',
      adjustFilters: 'Coba geser filter. Mungkin ada yang kelewat.',
      source: '',
      loadingMap: 'Memuat peta...',
      vesselsTracked: 'kapal dilacak',
    },
    shipTracker: {
      title: 'Intelijen Maritim Global',
      subtitle: 'Pemantauan Penempatan Strategis Real-time',
      activeVessels: 'Kapal Aktif Terlacak',
      criticalZones: 'Zona Kritis Dipantau',
      alerts: 'Peringatan Strategis',
    },
    about: {
      title: 'Tentang Lazarus Report',
      philosophyTitle: 'Kenapa Namanya Lazarus',
      philosophyText: 'Buat kita, Lazarus itu simbol satu hal: fakta yang dihidupkan lagi. Saat narasi rapi menutup detail penting, kita bongkar ulang sampai jelas.',
      whoWeAreTitle: 'Siapa Kita',
      whoWeAreText: 'Kita media independen. Tidak bawa agenda negara. Tidak disetir korporasi. Fokus kita geopolitik, risiko militer, energi, dan pasar global.',
      coverageTitle: 'Apa Yang Kita Pantau',
      coverageText: 'Kita pantau titik panas dunia, pergerakan kapal, konflik, jalur energi, sampai arus crypto. Datanya bergerak cepat. Kamu harus lihat yang penting.',
      commitmentTitle: 'Pegangan Kita',
      commitmentText: 'Mandiri. Tajam. Akurat. Kita tidak suruh kamu percaya mentah-mentah. Kita kasih fakta, konteks, dan sudut yang sering sengaja dilewatkan.',
      disclaimer: 'Semua info di sini buat informasi. Bukan nasihat keuangan, investasi, hukum, atau keamanan.',
      followCta: 'Masuk ke jaringan update kita',
    },
    categories: {
      all: 'Semua',
      geopolitics: 'Geopolitik',
      military: 'Militer',
      markets: 'Pasar',
      finance: 'Pasar',
      crypto: 'Crypto',
      oilEnergy: 'Pasar',
      middleEast: 'Geopolitik',
      breaking: 'Berita Panas',
      analysis: 'Analisis',
      intelligence: 'Intelijen',
      deepDive: 'Kajian Mendalam',
    },
    pages: {
      geopolitics: {
        title: 'Geopolitik',
        description: 'Tarik-menarik kekuasaan global. Siapa tekan siapa, dan kenapa itu penting.',
        metaDescription: 'Update geopolitik tajam soal aliansi, tekanan diplomatik, pergeseran kekuatan, dan dampaknya ke kawasan.'
      },
      military: {
        title: 'Militer & Pertahanan',
        description: 'Gerak pasukan, sinyal deterrence, dan konflik yang bisa meledak kapan saja.',
        metaDescription: 'Pantau penempatan militer, strategi pertahanan, sistem senjata, dan eskalasi konflik global.'
      },
      markets: {
        title: 'Pasar',
        description: 'Minyak, indeks, crypto, dan arus uang besar. Kena sentuh geopolitik, langsung gerak.',
        metaDescription: 'Pantau pasar global, minyak, crypto, dan tekanan ekonomi yang muncul dari krisis geopolitik.'
      },
      crypto: {
        title: 'Crypto',
        description: 'Bitcoin, Ethereum, dan aliran dana besar. Hype doang atau sinyal jitu?',
        metaDescription: 'Update crypto tajam soal Bitcoin, Ethereum, arus institusional, dan sentimen pasar digital.'
      },
      analysis: {
        title: 'Analisis',
        description: 'Laporan panjang saat berita cepat saja tidak cukup. Butuh konteks? Di sini tempatnya.',
        metaDescription: 'Analisis mendalam soal geopolitik, keamanan, ekonomi, dan tren global yang sedang membentuk peta baru.'
      },
      liveTv: {
        title: 'Live TV',
        description: 'Pantau siaran langsung Al Jazeera English, France 24, dan Bloomberg Television dalam satu desk monitoring yang fokus.',
        metaDescription: 'Tonton live stream YouTube dari Al Jazeera English, France 24 English, dan Bloomberg Television dalam halaman monitoring yang siap produksi.'
      },
      flightTracker: {
        title: 'Intelijen Penerbangan Global',
        description: 'Pemantauan Lalu Lintas Udara Strategis Real-time',
        metaDescription: 'Pantau data penerbangan global langsung, transponder militer, dan koridor udara strategis.'
      },
      conflictTracker: {
        title: 'Intelijen Konflik',
        description: 'Pelacak OSINT untuk operasi konflik Iran-AS-Israel dan data geopolitik terkait.',
        metaDescription: 'Pantau data real-time, gelombang serangan, dan intelijen taktis pada konflik Iran-Israel-AS menggunakan sumber OSINT.'
      }
    },
    footer: {
      description: 'Update independen soal geopolitik, militer, pasar, dan jalur maritim. Singkat, tajam, dan langsung kena inti.',
      coverage: 'Cakupan',
      connect: 'Terhubung',
      disclaimer: 'Konten ini buat informasi. Bukan nasihat keuangan, hukum, investasi, atau strategi.',
      rights: 'Lazarus Report Global. Seluruh hak cipta dilindungi.',
      builtWith: 'Dibuat dengan',
      forTruth: 'biar tetap jernih'
    },
    shipTrackerUI: {
      globalLiveTracking: 'Pelacakan Global Langsung',
      statusOnline: 'SYS.STATUS: ONLINE | LATENCY: 12ms | SAT.UPLINK: ACTIVE',
      coords: 'KOORDINAT: RAHASIA',
      encryption: 'ENKRIPSI: AES-256',
      chokepointTraffic: 'Lalu Lintas Titik Sempit',
      fullMap: 'Buka Peta Penuh',
      tacticalAlerts: 'PERINGATAN TAKTIKAL',
      feedLoading: 'Membuka feed langsung',
      relayActive: 'Relay AIS langsung aktif',
      encryptedFeed: 'feed terenkripsi',
      alerts: [
        '> KELOMPOK TEMPUR KAPAL INDUK AS TERDETEKSI DI TELUK PERSIA',
        '> Aktivitas rudal Houthi dilaporkan dekat LAUT MERAH',
        '> Spoofing GPS terdeteksi di kawasan Laut Hitam'
      ],
      rawFeed: 'UMPAN_MENTAH:',
      logs: [
        '> Membangun koneksi aman...',
        '> Menerima paket AIS [Batch 0x4F2A]',
        '> Mendekripsi data posisi...',
        '> Menyaring kapal militer...',
        '> Menyematkan tanda target...',
        '> Memvalidasi checksum...',
        '> Menjalin ulang sambungan...',
        '> Paket berhasil didekode.'
      ]
    },
    conflictTrackerUI: {
      title: 'INTELIJEN KONFLIK',
      statusOnline: 'SYS.STATUS: ONLINE | DATA LINK: AMAN',
      totalWaves: 'Total Gelombang',
      totalFatalities: 'Korban Jiwa Dilaporkan',
      countriesTargeted: 'Negara Ditargetkan',
      daysActive: 'Hari Aktif',
      timeline: 'Linimasa Operasional',
      latestIncidents: 'Insiden Taktis Terbaru',
      wave: 'Gel.',
      date: 'Tanggal',
      weapons: 'Muatan',
      targets: 'Target',
      outcome: 'Hasil',
      casualties: 'Korban',
      loading: 'Mendekripsi feed intelijen...',
      source: 'Sumber Data:'
    },
    flightTrackerUI: {
      globalLiveTracking: 'Intelijen Udara Global',
      statusOnline: 'SYS.STATUS: ONLINE | LATENCY: 8ms | SAT.UPLINK: ACTIVE',
      coords: 'JALUR_TERBANG: RAHASIA',
      encryption: 'ENKRIPSI: AES-256',
      airTraffic: 'Koridor Udara Strategis',
      fullMap: 'Buka Peta Taktikal',
      tacticalAlerts: 'PERINGATAN UDARA',
      feedLoading: 'Sinkronisasi data transponder',
      relayActive: 'Relay ADSB langsung aktif',
      encryptedFeed: 'data udara terenkripsi',
      alerts: [
        '> AWACS NATO TERDETEKSI DI PERBATASAN POLANDIA-UKRAINA',
        '> Aktivitas US Air Force Global Hawk di Laut Hitam',
        '> Pergerakan armada Tanker dekat SELAT HORMUZ'
      ],
      rawFeed: 'MENTAH_ADSB:',
      logs: [
        '> Handshake dengan node ADSB-FI...',
        '> Mengambil paket transponder [Batch 0x9B1C]',
        '> Mendekripsi kode squawk...',
        '> Menyaring campuran sipil-militer...',
        '> Memetakan vektor ketinggian & kecepatan...',
        '> Validasi tanda hex-id...',
        '> Uplink aman terjaga.',
        '> Data sinkron.'
      ]
    },
    sidebar: {
      article1: 'BRICS geser lagi. Peta pengaruh global ikut berubah.',
      article2: 'Foto satelit buka instalasi baru. Kebetulan? Rasanya tidak.',
      article3: 'Perang energi balik panas. Siapa pegang keran, dia pegang arah.'
    },
    verification: {
      title: 'PROTOKOL KEAMANAN',
      subtitle: 'VERIFIKASI MANUSIA DIPERLUKAN',
      slide: 'GESER UNTUK MEMBUKA SISTEM',
      code: 'MASUKKAN KODE AKSES',
      status: 'SYS.STATUS: MENUNGGU_VERIFIKASI',
      granted: 'AKSES DITERIMA. MENDEKRIPSI DATA...'
    }
  }
};

export function getTranslation(lang: string | undefined): typeof translations['en'] {
  const safeLang = lang === 'id' ? 'id' : 'en';
  return translations[safeLang];
}
