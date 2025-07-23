# Claude Code Instructions

このプロジェクトは自学自習AIアプリケーションです。

## プロジェクト概要
- AIとの対話的な学習を支援するWebアプリケーション
- ファイルアップロード → AI音声インタビュー → 学習記録のフローで構成
- Next.js + TypeScript + Supabase + shadcn/ui を使用

## 重要な技術要件
- **UI**: 仕様書に従い、shadcn/uiコンポーネントを使用
- **バックエンド**: Supabase Edge Functionsを使用予定
- **音声機能**: ElevenLabs/Google TTS + Whisper API
- **スタイリング**: 落ち着いた色合い（ベージュ、ライトグレー、ネイビー）

## 開発時の注意点
1. コードを書く前に必ずlintとtypecheckを実行: `npm run lint`, `npm run typecheck`
2. UIコンポーネントは必ずshadcn/uiを使用
3. 新しいページを作成する際は、ナビゲーションにも追加
4. Supabase Edge Functionsは`/supabase/functions`ディレクトリに配置予定

## ディレクトリ構造
- `/app` - Next.js App Router のページ
- `/components` - 共通コンポーネント
- `/lib` - ユーティリティ関数
- `/types` - TypeScript型定義
- `/supabase` - Supabaseの設定とマイグレーション