# 開発ノート テンプレート

Claude Code 開発環境のルール・スキル・インフラを体系的にまとめたドキュメントサイトのテンプレート。

## クイックスタート

```bash
# 1. リポジトリをクローン
git clone https://github.com/soyalumno/cc-env-docs-template.git my-dev-notes
cd my-dev-notes

# 2. 依存関係をインストール
pnpm install

# 3. 開発サーバーを起動
pnpm dev
```

`http://localhost:4321` にアクセスすると、サンプルコンテンツが表示されます。

## 自分の環境を同期する

```bash
pnpm sync      # ~/.claude/ からコンテンツを自動同期
pnpm build     # サイトをビルド（検索インデックス含む）
```

同期されるコンテンツ:

| カテゴリ | ソース | 内容 |
|---|---|---|
| Rules | `~/.claude/rules/*.md` | Claude Code の行動規範 |
| Skills | `~/.claude/skills/*/SKILL.md` | カスタムスキル |
| Agents | `~/.claude/agents/*.md` | カスタムサブエージェント |
| Infra | 自動生成 | MCP サーバー・パイプライン・CLI |

## 主な機能

- 全文検索（Pagefind）
- サイドバーフィルタ
- 見出しジャンプ（目次）
- 前後ページナビゲーション
- カテゴリバッジ
- レスポンシブ対応

## カスタマイズ

### カラーテーマ

`src/styles/global.css` でカラートークンを変更:

```css
@layer lism-base {
  :root {
    --brand: #0A3F71;
    --accent: #0A3F71;
  }
}
```

ヘッダー・サイドバーの背景色: `src/components/Header.astro`, `Sidebar.astro`

### スキルの除外

`scripts/sync-content.mjs` の `SKILL_EXCLUDES` に追加:

```js
const SKILL_EXCLUDES = new Set(['external-skill-name']);
```

### デプロイ（Cloudflare Workers）

```bash
pnpm add -D wrangler
echo '{"name":"my-dev-notes","compatibility_date":"2025-06-01","assets":{"directory":"./dist"}}' > wrangler.jsonc
pnpm exec wrangler login
pnpm exec wrangler deploy
```

## 技術スタック

- [Astro](https://astro.build/) — 静的サイト生成
- [Lism CSS](https://lism-css.com/) — レイアウト・コンポーネント
- [Pagefind](https://pagefind.app/) — 全文検索
