---
title: "セットアップガイド"
description: "開発ノートの初期設定と使い方"
order: 0
icon: wrench
---

## クイックスタート

```bash
git clone <repository-url> my-dev-notes
cd my-dev-notes
pnpm install
pnpm dev
```

`http://localhost:4321` にアクセス。

## コンテンツの同期

```bash
pnpm sync      # ~/.claude/ からコンテンツを同期
pnpm build     # ビルド + 検索インデックス生成
```

## ディレクトリ構成

```
src/content/
  rules/       <- ~/.claude/rules/ から同期
  skills/      <- ~/.claude/skills/ から同期
  agents/      <- ~/.claude/agents/ から同期
  infra/       <- 手動管理（MCP, パイプライン等）
```

## カスタマイズ

### カラーテーマ

`src/styles/global.css` の `--brand` と `--accent` を変更。
ヘッダー・サイドバーは `Header.astro` と `Sidebar.astro` の背景色を変更。

### スキルの除外

`scripts/sync-content.mjs` の `SKILL_EXCLUDES` に追加。
