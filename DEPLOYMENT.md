# Azure App Service デプロイ手順

このドキュメントでは、GitHub ActionsとAzure App Serviceを使用して、モノリポからFrontendとBackendを個別にデプロイする方法を説明します。

## 前提条件

- Azureアカウント
- GitHubリポジトリ
- Azure CLI（オプション - コマンドラインでの管理用）

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
2. **方法A: 概要ページから**
   - 「概要」ページの上部にある「発行プロファイルの取得」をクリック
   
3. **方法B: デプロイメントセンターから**
   - 左メニューから「デプロイ」→「デプロイ センター」を選択
   - 右上の「発行プロファイルのダウンロード」をクリック
   
4. **方法C: 右クリックメニューから**
   - App Serviceの名前を右クリック
   - 「発行プロファイルのダウンロード」を選択

5. ダウンロードしたXMLファイルの内容をコピー

### 2.2 Backend用

1. Azureポータルで`your-app-backend`を開く
2. Frontend用と同じ方法で発行プロファイルをダウンロード
3. ダウンロードしたXMLファイルの内容をコピー

### 📝 .PublishSettingsファイルの開き方（Mac）

`.PublishSettings`ファイルはXMLファイルです。以下の方法で開けます：

#### 方法1: テキストエディタで開く
```bash
# ターミナルで実行
open -a "TextEdit" ~/Downloads/your-app-name.PublishSettings

# または VS Code で開く
code ~/Downloads/your-app-name.PublishSettings
```

#### 方法2: Finderから開く
1. Finderでダウンロードフォルダを開く
2. `.PublishSettings`ファイルを右クリック
3. 「このアプリケーションで開く」→「テキストエディット」を選択

#### 方法3: ファイル名を変更
```bash
# .xml拡張子に変更すると開きやすくなります
mv ~/Downloads/your-app-name.PublishSettings ~/Downloads/your-app-name.xml
```

#### 方法4: catコマンドで内容を表示
```bash
# ターミナルで内容を表示してコピー
cat ~/Downloads/your-app-name.PublishSettings
```

### ファイルの内容例
```xml
<?xml version="1.0" encoding="utf-8"?>
<publishData>
  <publishProfile profileName="your-app-name - Web Deploy" 
                  publishMethod="MSDeploy" 
                  publishUrl="your-app-name.scm.azurewebsites.net:443" 
                  msdeploysite="your-app-name" 
                  userName="$your-app-name" 
                  userPWD="..." 
                  destinationAppUrl="https://your-app-name.azurewebsites.net" 
                  SQLServerDBConnectionString="" 
                  mySQLDBConnectionString="" 
                  hostingProviderForumLink="" 
                  controlPanelLink="http://windows.azure.com" 
                  webSystem="WebSites">
    <!-- この全体をコピーしてGitHubシークレットに貼り付け -->
  </publishProfile>
</publishData>
```

**重要**: ファイル全体の内容をコピーして、GitHubシークレットに貼り付けてください。

### 💡 発行プロファイルが見つからない場合

以下の場所を確認してください：

1. **App Serviceの概要ページ**
   - 上部のツールバーに「発行プロファイルの取得」ボタン

2. **デプロイメントセンター**
   - 左メニュー「デプロイ」→「デプロイ センター」
   - 画面右上に「発行プロファイルのダウンロード」

3. **App Serviceを右クリック**
   - リソース一覧でApp Service名を右クリック
   - コンテキストメニューから選択

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
# Frontend用（40行目付近）
app-name: 'your-app-frontend'  # ← 実際のApp Service名に変更

# Backend用（70行目付近）
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

FRONTEND_URL=https://your-app-frontend.azurewebsites.net

# オプション: Azure Blob Storage（現在のコードでは不使用）
# AZURE_STORAGE_CONNECTION_STRING=your-storage-connection-string
# AZURE_STORAGE_CONTAINER_NAME=audio-files
```

4. 「保存」をクリック

### 5.1 Backend用スタートアップコマンドの設定

1. 同じ「構成」画面で「全般設定」タブを選択
2. 「スタートアップコマンド」に以下を入力：

```bash
gunicorn --bind 0.0.0.0:8000 --workers 4 --timeout 600 main:app
```

3. 「保存」をクリック

## 6. Frontend用の設定

Azureポータルで`your-app-frontend`を開き、設定を行います：

### 6.1 環境変数の設定

1. 左メニューから「構成」を選択
2. 「アプリケーション設定」タブで「新しいアプリケーション設定」をクリック
3. 以下の環境変数を追加：

```
VITE_API_BASE_URL=https://your-app-backend.azurewebsites.net
```

4. 「保存」をクリック

### 6.2 Frontend用スタートアップコマンドの設定

1. 同じ「構成」画面で「全般設定」タブを選択
2. 「スタートアップコマンド」に以下を入力：

```bash
pm2 serve /home/site/wwwroot --no-daemon --spa
```

**または、よりシンプルに：**

```bash
npx serve -s . -l 8080
```

3. 「保存」をクリック

**注意**: Frontendは静的ファイル（HTML/CSS/JS）なので、静的ファイルサーバーが必要です。

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

## Azure CLIについて（オプション）

### Azure CLIとは？

Azure CLI（Command Line Interface）は、コマンドラインからAzureリソースを管理するためのツールです。

### 発行プロファイル方式では必要？

**基本的には不要です。** Azureポータル（Webブラウザ）ですべての設定が可能です。

### Azure CLIが便利な場面

1. **複数のリソースを一括作成**
   ```bash
   # リソースグループ、App Service、データベースを一度に作成
   az group create --name myResourceGroup --location "Japan East"
   az appservice plan create --name myPlan --resource-group myResourceGroup --sku B1
   az webapp create --name myApp --resource-group myResourceGroup --plan myPlan
   ```

2. **設定の確認・変更**
   ```bash
   # App Serviceの設定を確認
   az webapp config show --name myApp --resource-group myResourceGroup
   
   # 環境変数を一括設定
   az webapp config appsettings set --name myApp --resource-group myResourceGroup \
     --settings MYSQL_HOST=myserver.mysql.database.azure.com MYSQL_PORT=3306
   ```

3. **ログの確認**
   ```bash
   # リアルタイムでログを確認
   az webapp log tail --name myApp --resource-group myResourceGroup
   ```

### インストール方法（必要な場合のみ）

#### Windows
```bash
# PowerShellで実行
Invoke-WebRequest -Uri https://aka.ms/installazurecliwindows -OutFile .\AzureCLI.msi; Start-Process msiexec.exe -Wait -ArgumentList '/I AzureCLI.msi /quiet'
```

#### macOS
```bash
# Homebrewを使用
brew update && brew install azure-cli
```

#### Linux (Ubuntu/Debian)
```bash
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash
```

### 使用方法
```bash
# Azureにログイン
az login

# サブスクリプション確認
az account show

# リソース一覧
az resource list --output table
```

### 結論

**発行プロファイル方式なら、Azure CLIは不要です。** すべてAzureポータル（Webブラウザ）で設定できます。

ただし、以下の場合はAzure CLIがあると便利：
- 複数の環境（開発・本番）を管理する
- コマンドラインでの作業が好み
- 設定をスクリプト化したい
