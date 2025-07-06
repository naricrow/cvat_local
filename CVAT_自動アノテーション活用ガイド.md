# CVAT 自動アノテーション活用ガイド

## 概要

このガイドでは、CVATの自動アノテーション機能を実際に活用するための具体的な手順とベストプラクティスを解説します。

## 目次

1. [セットアップ](#セットアップ)
2. [基本的な使用方法](#基本的な使用方法)
3. [サポートされるモデル](#サポートされるモデル)
4. [実際のワークフロー](#実際のワークフロー)
5. [パフォーマンス最適化](#パフォーマンス最適化)
6. [トラブルシューティング](#トラブルシューティング)
7. [ベストプラクティス](#ベストプラクティス)

## セットアップ

### 1. Nuclioの準備

**Docker Compose設定:**
```yaml
version: '3.8'
services:
  cvat:
    image: cvat/server:latest
    depends_on:
      - nuclio
    environment:
      - NUCLIO_HOST=nuclio
      - NUCLIO_PORT=8080

  nuclio:
    image: quay.io/nuclio/dashboard:stable-amd64
    ports:
      - "8080:8080"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
```

### 2. 自動アノテーションモデルのデプロイ

**CPU版のデプロイ:**
```bash
# サーバーレス関数のデプロイ
cd serverless/
./deploy_cpu.sh

# デプロイ状況の確認
nuctl get functions --platform local
```

**GPU版のデプロイ（推奨）:**
```bash
# GPU対応版のデプロイ
./deploy_gpu.sh

# GPU使用状況の確認
nvidia-smi
```

### 3. 利用可能なモデルの確認

**API経由での確認:**
```bash
# 利用可能な機能の一覧取得
curl -X GET "http://localhost:8080/api/lambda/functions" \
  -H "Authorization: Token your_token_here"
```

**Web UI での確認:**
1. CVATにログイン
2. `Settings` → `Models` → `Available Functions`

## 基本的な使用方法

### 1. オンライン実行（インタラクティブ）

**物体検出の例:**
```javascript
// Web UIでの基本的な使用方法
const response = await fetch('/api/lambda/functions/yolo-v7/call', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Token ${token}`
  },
  body: JSON.stringify({
    task: taskId,
    frame: 0,
    threshold: 0.5
  })
});

const annotations = await response.json();
```

**インタラクティブセグメンテーションの例:**
```javascript
// Segment Anythingの使用
const response = await fetch('/api/lambda/functions/sam/call', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Token ${token}`
  },
  body: JSON.stringify({
    task: taskId,
    frame: 0,
    pos_points: [[100, 100], [200, 200]], // 正例点
    neg_points: [[150, 50]]                // 負例点
  })
});
```

### 2. オフライン実行（バッチ）

**大量データの一括処理:**
```bash
# Python SDKを使用したバッチ処理
python -c "
import cvat_sdk
from cvat_sdk.auto_annotation import annotate_task

# タスクの自動アノテーション
result = annotate_task(
    task_id=123,
    function_name='yolo-v7',
    threshold=0.5,
    cleanup=True
)

print(f'Job ID: {result.id}')
print(f'Status: {result.status}')
"
```

## サポートされるモデル

### 物体検出モデル

| モデル名 | 用途 | 特徴 | 推奨設定 |
|----------|------|------|----------|
| YOLO v7 | 汎用物体検出 | 高速、80クラス対応 | threshold: 0.5 |
| RetinaNet R101 | 高精度検出 | 精度重視、重い | threshold: 0.7 |
| Faster R-CNN | 汎用検出 | バランス型 | threshold: 0.6 |

### インタラクティブセグメンテーション

| モデル名 | 用途 | 特徴 | 推奨設定 |
|----------|------|------|----------|
| Segment Anything (SAM) | 汎用セグメンテーション | 最高精度 | pos_points: 1以上 |
| f-BRS | 高速セグメンテーション | 軽量、高速 | pos_points: 1以上 |
| DEXTR | 境界重視 | 極値点ベース | pos_points: 4以上 |

### 追跡モデル

| モデル名 | 用途 | 特徴 | 推奨設定 |
|----------|------|------|----------|
| TransT | 汎用追跡 | 高精度、Transformer | - |
| SiamMask | マスク追跡 | セグメンテーション対応 | - |

## 実際のワークフロー

### 1. 物体検出プロジェクトの例

```bash
# 1. プロジェクトの作成
cvat-cli create project "Car Detection Project"

# 2. タスクの作成
cvat-cli create task \
  --project-id 1 \
  --name "Highway Videos" \
  --labels "car,truck,bus,motorcycle" \
  /path/to/videos/

# 3. 自動アノテーション実行
cvat-cli auto-annotate \
  --task-id 1 \
  --function yolo-v7 \
  --threshold 0.5 \
  --cleanup

# 4. 結果の確認と修正
cvat-cli export \
  --task-id 1 \
  --format "YOLO 1.1" \
  --output-dir ./results/
```

### 2. インタラクティブセグメンテーションの例

**Web UIでの操作手順:**
1. タスクを開く
2. `AI Tools` → `Interactor` → `Segment Anything`
3. 対象オブジェクトをクリック（正例点）
4. 不要な領域をクリック（負例点）
5. 結果を確認して調整
6. `Accept` で確定

### 3. 動画追跡プロジェクトの例

```python
# Python SDKを使用した追跡
import cvat_sdk

client = cvat_sdk.make_client("http://localhost:8080")
client.login(("username", "password"))

# タスクの取得
task = client.tasks.retrieve(task_id)

# 初期フレームでの物体検出
detections = client.auto_annotate(
    task_id=task.id,
    function="yolo-v7",
    frame=0,
    threshold=0.5
)

# 追跡の開始
tracking_result = client.track_objects(
    task_id=task.id,
    function="transt",
    initial_shapes=detections,
    start_frame=0,
    end_frame=100
)
```

## パフォーマンス最適化

### 1. ハードウェア最適化

**GPU設定:**
```yaml
# Docker Compose GPU設定
services:
  nuclio:
    runtime: nvidia
    environment:
      - NVIDIA_VISIBLE_DEVICES=all
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]
```

**メモリ最適化:**
```yaml
# メモリ設定
spec:
  triggers:
    myHttpTrigger:
      maxRequestBodySize: 268435456  # 256MB
      attributes:
        maxWorkers: 4
        targetCPU: 75
```

### 2. パラメータチューニング

**物体検出の最適化:**
```json
{
  "threshold": 0.5,        // 検出閾値（高い = 精度重視）
  "nms_threshold": 0.45,   // NMS閾値（低い = 重複除去強化）
  "max_detections": 100    // 最大検出数
}
```

**バッチ処理の最適化:**
```python
# バッチサイズの調整
batch_settings = {
    "frames_per_batch": 50,    # 一度に処理するフレーム数
    "parallel_workers": 4,      # 並列ワーカー数
    "memory_limit": "8GB"       # メモリ制限
}
```

### 3. モデル選択指針

**用途別推奨モデル:**
- **高速処理**: YOLO v7 (CPU/GPU), f-BRS
- **高精度**: RetinaNet R101, Segment Anything
- **メモリ効率**: OpenVINO版モデル
- **特殊用途**: 顔検出、テキスト検出

## トラブルシューティング

### 1. 一般的な問題と解決策

**問題: モデルが利用できない**
```bash
# 解決方法
# 1. Nuclioの状態確認
nuctl get functions --platform local

# 2. ログの確認
docker logs cvat_nuclio_1

# 3. 再デプロイ
./deploy_cpu.sh
```

**問題: 推論が遅い**
```bash
# 解決方法
# 1. GPU使用の確認
nvidia-smi

# 2. バッチサイズの調整
# 3. 軽量モデルの使用
```

**問題: メモリ不足**
```yaml
# 解決方法: リソース制限の調整
spec:
  triggers:
    myHttpTrigger:
      attributes:
        maxRequestBodySize: 134217728  # 128MB
  resources:
    limits:
      memory: 4Gi
```

### 2. デバッグ手法

**ログの確認:**
```bash
# CVATのログ
docker logs cvat_cvat_1

# Nuclioのログ
docker logs cvat_nuclio_1

# 特定の関数のログ
nuctl logs function-name --platform local
```

**API直接テスト:**
```bash
# 関数の直接呼び出し
curl -X POST "http://localhost:8080/api/lambda/functions/yolo-v7/call" \
  -H "Content-Type: application/json" \
  -d '{
    "task": 1,
    "frame": 0,
    "threshold": 0.5
  }'
```

## ベストプラクティス

### 1. プロジェクト設計

**ラベル設計:**
```python
# 良い例：階層的なラベル構造
labels = {
    "vehicle": {
        "car": ["sedan", "suv", "hatchback"],
        "truck": ["pickup", "delivery", "heavy"],
        "motorcycle": ["sport", "cruiser", "scooter"]
    }
}

# 悪い例：フラットすぎる構造
labels = ["car", "truck", "motorcycle", "bicycle", "bus"]
```

### 2. データ前処理

**画像品質の確保:**
```python
# 推奨設定
image_settings = {
    "min_resolution": (640, 480),
    "max_resolution": (1920, 1080),
    "format": "JPEG",
    "quality": 85
}
```

### 3. 自動アノテーション戦略

**段階的アプローチ:**
1. **第1段階**: 高閾値（0.8）で確実な検出
2. **第2段階**: 中閾値（0.5）で追加検出
3. **第3段階**: 手動で未検出オブジェクトを補完

**品質管理:**
```python
# 自動アノテーション後の品質チェック
quality_check = {
    "min_confidence": 0.5,
    "max_objects_per_frame": 50,
    "aspect_ratio_range": (0.1, 10.0)
}
```

### 4. 効率的なワークフロー

**チーム作業の分担:**
```markdown
1. **データ収集**: 高品質な画像・動画の収集
2. **自動アノテーション**: AIモデルによる一次処理
3. **品質管理**: 自動結果の検証と修正
4. **最終確認**: 専門家による最終チェック
```

**進捗管理:**
```python
# 進捗追跡の実装例
def track_annotation_progress(task_id):
    task = client.tasks.retrieve(task_id)
    total_frames = task.size
    annotated_frames = len(task.annotations)

    progress = {
        "total": total_frames,
        "annotated": annotated_frames,
        "percentage": (annotated_frames / total_frames) * 100
    }

    return progress
```

## まとめ

CVATの自動アノテーション機能を効果的に活用するためには：

1. **適切なモデル選択**: 用途に応じた最適なモデルの選択
2. **段階的アプローチ**: 自動→半自動→手動の組み合わせ
3. **品質管理**: 継続的な結果の検証と改善
4. **パフォーマンス最適化**: ハードウェアとソフトウェアの最適化
5. **チームワーク**: 役割分担と効率的なワークフロー

これらのベストプラクティスに従うことで、高品質なアノテーションデータを効率的に作成できます。

## 参考リンク

- [CVAT公式ドキュメント](https://docs.cvat.ai/)
- [Nuclio公式ドキュメント](https://nuclio.io/docs/)
- [CVAT SDK](https://github.com/cvat-ai/cvat-sdk)
- [サポートモデル一覧](https://github.com/cvat-ai/cvat/tree/develop/serverless)