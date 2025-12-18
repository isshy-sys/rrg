# SSL証明書設定

Azure Database for MySQLに接続するためのSSL証明書設定です。

## 証明書ファイル

このディレクトリには以下の証明書ファイルが配置されます：

- `DigiCertGlobalRootCA.crt.pem` - Azure MySQL用のルートCA証明書

## 自動ダウンロード

証明書は以下のコマンドでダウンロードできます：

```bash
# DigiCert Global Root CA（Azure MySQL用）
curl -o ssl/DigiCertGlobalRootCA.crt.pem https://cacerts.digicert.com/DigiCertGlobalRootCA.crt.pem
```

## 環境変数設定

`.env`ファイルで使用する証明書を指定：

```bash
MYSQL_SSL_CA=ssl/DigiCertGlobalRootCA.crt.pem
```

## 注意事項

- 証明書ファイルは`.gitignore`に含まれており、Gitにコミットされません
- 各環境で個別にダウンロードする必要があります
- Azure MySQLサーバーによって必要な証明書が異なる場合があります

## トラブルシューティング

### SSL接続エラーが発生する場合

1. 証明書ファイルが存在することを確認
2. ファイルパスが正しいことを確認
3. Azure MySQLサーバーのSSL設定を確認
4. ファイアウォール設定を確認

### 証明書の検証

```bash
# 証明書の内容を確認
openssl x509 -in ssl/DigiCertGlobalRootCA.crt.pem -text -noout
```