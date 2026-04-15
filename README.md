# OpinionSync

CogniTwin araştırma ekosisteminin bir parçası olarak geliştirilen interaktif görüş haritalama uygulaması.

## Genel Bakış

Katılımcılara sosyal meselelerle ilgili gerçekçi senaryolar sunulur. Her senaryoda 10 farklı görüş yer alır; katılımcı her görüşe **Katılıyorum / Katılmıyorum / Fikrim yok** oyunu verir ve isteğe bağlı kısa bir yorum ekler. Tur sonunda kendi görüşünü ekleyebileceği açık bir alan sunulur.

Her tur tamamlandığında Claude API bir **Entegre Prompt** üretir: katılımcının karar örüntüsünü, değer yapısını ve belirsizlik örüntülerini özetleyen 150–200 kelimelik davranışsal bir profil.

## Akış

```
Giriş → Senaryo + 10 Görüş → [Oy + Yorum (her biri için)] → Ek Görüş → Tur Özeti → (5 tur) → Tamamlandı
```

## Teknik Yığın

| Katman | Teknoloji |
|---|---|
| Frontend + Backend | Next.js 14 (App Router) |
| Deployment | Vercel |
| Veri Saklama | Vercel KV (`@vercel/kv`) |
| LLM | Anthropic Claude (`claude-sonnet-4-20250514`) |
| Export | SheetJS (xlsx) |

## Proje Yapısı

```
opinionsync/
├── app/
│   ├── page.tsx                  # Ana oyun arayüzü (5 tur)
│   ├── admin/
│   │   └── page.tsx              # Admin paneli — /admin (şifre: cogni)
│   ├── api/
│   │   ├── save-round/route.ts   # Tur kaydet + entegre prompt üret
│   │   └── admin/
│   │       ├── route.ts          # Admin istatistikleri
│   │       └── export/route.ts   # Excel export
│   ├── globals.css
│   └── layout.tsx
├── lib/
│   ├── scenarios.ts              # 15 senaryo × 10 görüş havuzu
│   ├── types.ts                  # TypeScript tipleri
│   └── kv.ts                     # Vercel KV istemcisi
├── .env.example
└── package.json
```

## Veri Modeli

### Katılımcı (`os:participant:{id}`)
```typescript
{
  participantId: string
  createdAt: string
  totalRounds: number
  rounds: Round[]
}
```

### Tur (`Round`)
```typescript
{
  roundNumber: number
  scenarioId: string
  scenarioText: string
  responses: OpinionResponse[]   // 10 adet
  additionalOpinion: string      // Katılımcının kendi görüşü
  completedAt: string
  integratedPrompt?: string      // Claude tarafından üretilir
}
```

### Görüş Yanıtı (`OpinionResponse`)
```typescript
{
  opinion: string
  vote: 'approve' | 'disapprove' | 'unsure'
  comment: string    // Görüşe özel yorum (boş olabilir)
}
```

### Redis Key'leri
- `os:participants` → Set (tüm participant ID'leri)
- `os:participant:{id}` → JSON (katılımcı verisi)

> **Not:** CogniTwin `ct:` prefix'ini kullanır; bu proje `os:` kullanır. Aynı Vercel KV instance'ına bağlanılabilir, key çakışması olmaz.

## Kurulum

### 1. Repoyu klonla / oluştur

```bash
git clone https://github.com/sinalper/opinionsync.git
cd opinionsync
npm install
```

### 2. Vercel'e deploy et

1. [vercel.com](https://vercel.com) → **Add New Project** → GitHub reposunu seç
2. Framework: **Next.js** (otomatik algılanır)
3. **Storage** sekmesi → **Connect Database** → KV seç
   - Yeni KV oluştur **ya da** mevcut CogniTwin KV'sine bağlan (aynı prefix'ler farklı)
4. **Environment Variables** — KV bağlandığında otomatik eklenir; yalnızca şunu elle ekle:
   ```
   ANTHROPIC_API_KEY=sk-ant-...
   ```
5. **Deploy**
6. Settings → **Deployment Protection** → **Disabled** (kamuya açık erişim için)

### 3. Local geliştirme

```bash
# Vercel KV değerlerini .env.local'e kopyala
cp .env.example .env.local
# Değerleri doldur (Vercel dashboard → Storage → KV → .env.local)

npm run dev
# http://localhost:3000
```

## Admin Paneli

URL: `https://your-app.vercel.app/admin`  
Şifre: `cogni`

**Özellikler:**
- Toplam katılımcı, tur, oy sayıları
- Oy dağılımı (onay / ret / fikrim yok) ve yüzdeleri
- Son 20 tur listesi
- Katılımcı bazlı detay görünümü (entegre prompt dahil)
- Excel export (3 sayfa: Responses, Rounds, Participants)

## Excel Export İçeriği

| Sayfa | Sütunlar |
|---|---|
| **Responses** | participantId, roundNumber, completedAt, scenarioId, scenarioText, opinionIndex, opinion, vote, comment |
| **Rounds** | participantId, roundNumber, completedAt, scenarioId, approve/disapprove/unsureCount, commentsGiven, additionalOpinion, integratedPrompt |
| **Participants** | participantId, createdAt, totalRounds, totalVotes |

## Senaryo Havuzu

15 Türkçe senaryo, her biri 10 görüşle:

| ID | Konu |
|---|---|
| s01 | İnşaat gürültüsü ve yasal sınırlar |
| s02 | İşyerinde hata bildirme |
| s03 | Parklarda evsizlik yasağı |
| s04 | Kampüste yüz tanıma sistemi |
| s05 | Araç girişi ücretlendirmesi |
| s06 | Okullarda telefon yasağı |
| s07 | İşyerinde ekran izleme |
| s08 | Yoğun bakımda algoritma |
| s09 | Düşük gelirli mahallede lüks konut |
| s10 | Dört günlük çalışma haftası |
| s11 | Okulda sosyoekonomik sınıf karması |
| s12 | Su kullanımı kısıtlaması |
| s13 | Mahalle içi barınak açılması |
| s14 | Akıllı hız limiti sistemi |
| s15 | İşe alımda yapay zekâ |
