# Azure App Service デプロイ手順

このドキュメントでは、GitHub ActionsとAzure App Serviceを使用して、モノリポからFrontendとBackendを個別にデプロイする方法を説明します。

## 前提条件

- Azureアカウント
- GitHubリポジトリ
- Azure CLI（ローカルでの設定用）

## 1. Azure App Serviceの作成

### 1.1 Azureポータルにログイン
https://portal.azure.com にアクセス

### 1.2 Frontend用App Serviceの作成

1. 「リソースの作成」→「Web App」を選択
2. 以下の設定を入力：
   - **名前**: `your-app-frontend`（任意の名前）
   - **ランタイムスタック**: Node 18 LTS
   - **オペレーティングシステム**: Linux
   - **リージョン**: Japan East（または任意）
   - **プラン**: Basic B1以上を推奨

3. 「確認および作成」→「作成」

### 1.3 Backend用App Serviceの作成

1. 「リソースの作成」→「Web App」を選択
2. 以下の設定を入力：
   - **名前**: `your-app-backend`（任意の名前）
   - **ランタイムスタック**: Python 3.11
   - **オペレーティングシステム**: Linux
   - **リージョン**: Japan East（または任意）
   - **プラン**: Basic B1以上を推奨

3. 「確認および作成」→「作成」

## 2. 発行プロファイルの取得

### 2.1 Frontend用

1. Azureポータルで`your-app-frontend`を開く
2. 左メニューから「デプロイメントセンター」を選択
3. 上部の「発行プロファイルのダウンロード」をクリック
4. ダウンロードしたXMLファイルの内容をコピー

### 2.2 Backend用

1. Azureポータルで`your-app-backend`を開く
2. 左メニューから「デプロイメントセンター」を選択
3. 上部の「発行プロファイルのダウンロード」をクリック
4. ダウンロードしたXMLファイルの内容をコピー

## 3. GitHubシークレットの設定

### 3.1 GitHubリポジトリを開く

1. GitHubでリポジトリを開く
2. 「Settings」→「Secrets and variables」→「Actions」を選択
3. 「New repository secret」をクリック

### 3.2 Frontend用シークレットの追加

- **Name**: `AZURE_WEBAPP_PUBLISH_PROFILE_FRONTEND`
- **Value**: Frontend用の発行プロファイルの内容を貼り付け
- 「Add secret」をクリック

### 3.3 Backend用シークレットの追加

- **Name**: `AZURE_WEBAPP_PUBLISH_PROFILE_BACKEND`
- **Value**: Backend用の発行プロファイルの内容を貼り付け
- 「Add secret」をクリック

## 4. ワークフローファイルの設定

`.github/workflows/deploy.yml`ファイルを開き、以下の箇所を実際のApp Service名に変更：

```yaml
# Frontend用（35行目付近）
app-name: 'your-app-frontend'  # ← 実際のApp Service名に変更

# Backend用（58行目付近）
app-name: 'your-app-backend'   # ← 実際のApp Service名に変更
```

## 5. Backend用の環境変数設定

Azureポータルで`your-app-backend`を開き、環境変数を設定します：

1. 左メニューから「構成」を選択
2. 「アプリケーション設定」タブで「新しいアプリケーション設定」をクリック
3. 以下の環境変数を追加：

```
AZURE_OPENAI_ENDPOINT=https://your-openai-resource.openai.azure.com/
AZURE_OPENAI_API_KEY=your-api-key
AZURE_OPENAI_DEPLOYMENT_NAME=your-deployment-name
AZURE_OPENAI_API_VERSION=2024-02-15-preview

MYSQL_HOST=your-mysql-server.mysql.database.azure.com
MYSQL_PORT=3306
MYSQL_DATABASE=your-database-name
MYSQL_USERNAME=your-username
MYSQL_PASSWORD=your-password
MYSQL_SSL_MODE=REQUIRED

AZURE_STORAGE_CONNECTION_STRING=your-storage-connection-string
AZURE_STORAGE_CONTAINER_NAME=audio-files

FRONTEND_URL=https://your-app-frontend.azurewebsites.net
```

4. 「保存」をクリック

### 5.1 スタートアップコマンドの設定

1. 同じ「構成」画面で「全般設定」タブを選択
2. 「スタートアップコマンド」に以下を入力：

```bash
gunicorn --bind 0.0.0.0:8000 --workers 4 --timeout 600 main:app
```

3. 「保存」をクリック

## 6. Frontend用の環境変数設定

Azureポータルで`your-app-frontend`を開き、環境変数を設定します：

1. 左メニューから「構成」を選択
2. 「アプリケーション設定」タブで「新しいアプリケーション設定」をクリック
3. 以下の環境変数を追加：

```
VITE_API_BASE_URL=https://your-app-backend.azurewebsites.net
```

4. 「保存」をクリック

## 7. デプロイのテスト

### 7.1 変更をプッシュ

```bash
# Frontendのみ変更した場合
git add frontend/
git commit -m "Update frontend"
git push origin main
# → Frontend のみデプロイされます

# Backendのみ変更した場合
git add backend/
git commit -m "Update backend"
git push origin main
# → Backend のみデプロイされます

# 両方変更した場合
git add .
git commit -m "Update frontend and backend"
git push origin main
# → 両方デプロイされます
```

### 7.2 デプロイ状況の確認

1. GitHubリポジトリの「Actions」タブを開く
2. 最新のワークフロー実行を確認
3. 各ジョブのログを確認してエラーがないかチェック

## 8. 動作確認

### 8.1 Backend

```bash
curl https://your-app-backend.azurewebsites.net/health
```

正常に動作していれば、`{"status": "healthy"}` が返ります。

### 8.2 Frontend

ブラウザで以下にアクセス：
```
https://your-app-frontend.azurewebsites.net
```

## トラブルシューティング

### デプロイが失敗する場合

1. **GitHub Actionsのログを確認**
   - GitHubの「Actions」タブで詳細なエラーログを確認

2. **Azure App Serviceのログを確認**
   - Azureポータル → App Service → 「ログストリーム」

3. **環境変数の確認**
   - すべての必要な環境変数が設定されているか確認

4. **発行プロファイルの再取得**
   - 発行プロファイルが古い場合、再ダウンロードして更新

### よくあるエラー

#### Backend: "Module not found"
- `requirements.txt`に必要なパッケージが含まれているか確認
- スタートアップコマンドが正しいか確認

#### Frontend: "API connection failed"
- `VITE_API_BASE_URL`が正しく設定されているか確認
- BackendのCORS設定を確認

#### Database connection error
- MySQL接続情報が正しいか確認
- Azureファイアウォール設定でApp ServiceのIPを許可

## カスタムドメインの設定（オプション）

1. Azureポータル → App Service → 「カスタムドメイン」
2. 独自ドメインを追加
3. SSL証明書を設定（無料のマネージド証明書を使用可能）

## まとめ

この設定により、以下が実現されます：

✅ モノリポから個別デプロイ
✅ 変更があった部分のみ自動デプロイ
✅ GitHub Actionsによる自動化
✅ Azure App Serviceでのホスティング

デプロイ後は、GitHubにプッシュするだけで自動的にデプロイされます！
