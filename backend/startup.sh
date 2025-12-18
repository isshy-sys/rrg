#!/bin/bash

# Azure App Service用のスタートアップスクリプト
echo "Starting TOEFL Speaking Master Backend..."

# 環境変数の確認
echo "Python version: $(python --version)"
echo "Current directory: $(pwd)"
echo "Files in current directory: $(ls -la)"

# 依存関係のインストール（念のため）
pip install -r requirements.txt

# データベースマイグレーション（必要に応じて）
# python -m alembic upgrade head

# Gunicornでアプリケーションを起動
gunicorn --bind 0.0.0.0:8000 --workers 4 --timeout 600 main:app