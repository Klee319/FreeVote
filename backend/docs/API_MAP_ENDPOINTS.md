# 地図統計API仕様書

## 概要
日本地図に県別の1位アクセントを色分け表示するためのバックエンドAPIです。

## エンドポイント一覧

### 1. 語の地図統計取得
**GET** `/api/stats/map/:wordId`

特定の語に対する都道府県別のアクセント統計を取得します。

#### パラメータ
- `wordId` (必須): 語のID

#### レスポンス
```json
{
  "success": true,
  "data": {
    "wordId": 1,
    "headword": "雨",
    "reading": "あめ",
    "category": {
      "id": 1,
      "name": "天気"
    },
    "prefectureStats": [
      {
        "prefectureCode": "01",
        "prefectureName": "北海道",
        "region": "北海道",
        "dominantAccentTypeId": 1,
        "dominantAccentTypeName": "平板型",
        "totalVotes": 25,
        "hasEnoughData": true,
        "distribution": [
          {
            "accentTypeId": 1,
            "accentTypeName": "平板型",
            "voteCount": 15,
            "percentage": 60
          }
        ]
      }
    ],
    "nationalSummary": {
      "totalVotes": 1200,
      "dominantAccentTypeId": 1,
      "dominantAccentTypeName": "平板型",
      "distribution": []
    }
  }
}
```

### 2. 都道府県別全語統計取得
**GET** `/api/stats/map/prefecture/:code`

特定の都道府県における全語のアクセント統計を取得します。

#### パラメータ
- `code` (必須): 都道府県コード (01-47)

#### レスポンス
```json
{
  "success": true,
  "data": {
    "prefectureCode": "13",
    "prefectureName": "東京都",
    "region": "関東",
    "totalVotes": 5000,
    "accentTrends": [
      {
        "accentTypeId": 1,
        "accentTypeName": "平板型",
        "voteCount": 2000,
        "percentage": 40,
        "wordCount": 150
      }
    ],
    "topWords": [
      {
        "wordId": 1,
        "headword": "雨",
        "reading": "あめ",
        "voteCount": 100,
        "dominantAccentTypeId": 1,
        "dominantAccentTypeName": "平板型"
      }
    ]
  }
}
```

### 3. 全国概要統計取得
**GET** `/api/stats/map/overview`

全国の統計概要を取得します。

#### レスポンス
```json
{
  "success": true,
  "data": {
    "lastUpdated": "2025-01-04T12:00:00Z",
    "summary": {
      "totalWords": 1000,
      "totalVotes": 50000,
      "totalPrefectures": 47,
      "prefecturesWithData": 45
    },
    "regionalTrends": [
      {
        "region": "関東",
        "totalVotes": 15000,
        "dominantAccentTypeId": 1,
        "dominantAccentTypeName": "平板型",
        "prefectures": ["東京都", "神奈川県", "埼玉県"]
      }
    ],
    "mostVotedWords": [
      {
        "wordId": 1,
        "headword": "雨",
        "reading": "あめ",
        "totalVotes": 500
      }
    ]
  }
}
```

### 4. アクセントクラスター分析取得
**GET** `/api/stats/map/:wordId/clusters`

特定の語に対する地域クラスター分析を取得します。類似したアクセントパターンを持つ地域をグループ化します。

#### パラメータ
- `wordId` (必須): 語のID

#### レスポンス
```json
{
  "success": true,
  "data": {
    "wordId": 1,
    "clusters": [
      {
        "name": "関東クラスター",
        "dominantAccentTypeId": 1,
        "dominantAccentTypeName": "平板型",
        "prefectures": [
          {
            "code": "13",
            "name": "東京都",
            "similarity": 0.95
          }
        ]
      }
    ],
    "boundaries": [
      {
        "prefecture1": "東京都",
        "prefecture2": "山梨県",
        "difference": 0.7
      }
    ]
  }
}
```

### 5. 地域別傾向取得
**GET** `/api/stats/map/regional/trends`

地域別のアクセント傾向を取得します。

#### クエリパラメータ
- `region` (任意): 地域名（北海道、東北、関東、中部、近畿、中国、四国、九州）

#### レスポンス
```json
{
  "success": true,
  "data": [
    {
      "region": "関東",
      "totalVotes": 15000,
      "accentDistribution": [
        {
          "accentTypeId": 1,
          "accentTypeName": "平板型",
          "voteCount": 6000,
          "percentage": 40
        }
      ],
      "topWords": [
        {
          "wordId": 1,
          "headword": "雨",
          "reading": "あめ",
          "category": "天気",
          "voteCount": 100
        }
      ]
    }
  ]
}
```

## 実装詳細

### データ充足性の判定
- 各都道府県で投票数が10未満の場合は「データ不足」として扱います
- `hasEnoughData`フラグで判定可能です

### 地域区分
以下の8地域に分類されます：
- 北海道
- 東北（青森、岩手、宮城、秋田、山形、福島）
- 関東（茨城、栃木、群馬、埼玉、千葉、東京、神奈川）
- 中部（新潟、富山、石川、福井、山梨、長野、岐阜、静岡、愛知）
- 近畿（三重、滋賀、京都、大阪、兵庫、奈良、和歌山）
- 中国（鳥取、島根、岡山、広島、山口）
- 四国（徳島、香川、愛媛、高知）
- 九州（福岡、佐賀、長崎、熊本、大分、宮崎、鹿児島、沖縄）

### クラスター分析
- コサイン類似度を使用してアクセントパターンの類似性を計算
- 70%以上の類似度を持つ都道府県を同一クラスターとして分類
- 隣接する都道府県間の差異が50%以上の場合、境界線として検出

## エラーレスポンス

### 404 Not Found
```json
{
  "success": false,
  "error": {
    "message": "指定された語が見つかりません",
    "code": "NOT_FOUND"
  }
}
```

### 400 Bad Request
```json
{
  "success": false,
  "error": {
    "message": "入力データが無効です",
    "code": "VALIDATION_ERROR",
    "details": []
  }
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "error": {
    "message": "地図統計データの取得に失敗しました",
    "code": "MAP_STATS_ERROR"
  }
}
```