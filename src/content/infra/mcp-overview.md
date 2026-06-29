---
title: "MCP サーバーについて"
description: "Claude Code の MCP サーバー連携の概要"
order: 1
icon: plug
---

## MCP サーバーとは

MCP (Model Context Protocol) サーバーは、Claude Code に外部ツールの機能を提供するプラグインです。

## 設定方法

```bash
claude mcp add <server-name> -- <command>
```

## このサイトでの表示

`pnpm sync` を実行すると、セッション履歴から使用中の MCP サーバーが自動検出されます（`~/.claude/usage-data/session-meta/` が対象）。

## よく使われる MCP サーバー

| サーバー | 用途 |
|---|---|
| `serena` | コードベース解析（シンボル検索・リファクタ） |
| `notion-mcp` | Notion API（ページ作成・DB検索） |
| `claude-in-chrome` | Chrome ブラウザ自動化 |
