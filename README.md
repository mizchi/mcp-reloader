# MCP Hot Reload Server

MCPサーバーのホットリロード機能を実装した検証プロジェクトです。

## 概要

このプロジェクトは、MCPサーバー開発時の課題である「変更時にクライアントの再起動が必要」という問題を解決します。ファイル監視機能と`tools/list_changed`通知を使用して、ツールの動的な追加・変更・削除を可能にします。

## 機能

- **動的ツール読み込み**: `src/tools/`ディレクトリ内のJSファイルを自動的に読み込み
- **ファイル監視**: chokidarを使用してツールファイルの変更を検知
- **自動通知**: ツールの変更時に`tools/list_changed`通知を送信
- **エラーハンドリング**: ツール読み込みエラーを適切に処理
- **includeパターン**: 任意のファイルを監視し、変更時にプロセスを再起動
- **カスタムコマンド**: 任意のLSPプロセスをホットリロード対応でラップ

## セットアップ

```bash
cd mcp-hot-reload
npm install
```

## 使用方法

### 基本的なサーバーの起動

```bash
# デフォルトのMCPサーバーを起動
npm run dev

# ラッパー経由で起動（自動再起動対応）
npm run dev:wrapper
```

### Includeパターンを使用した起動

```bash
# 設定ファイルの変更を監視してプロセスを再起動
node src/wrapper.js --include "config/**/*.json" --include "src/lib/**/*.js"

# または環境変数で指定
MCP_HOT_RELOAD_INCLUDE='config/**/*.json,src/lib/**/*.js' node src/wrapper.js
```

### カスタムLSPサーバーのラップ

```bash
# Pythonで書かれたLSPサーバーをホットリロード対応でラップ
node src/wrapper.js --include "**/*.yaml" -- python my-lsp-server.py --port 3000

# Node.jsのLSPサーバーをラップ（複雑な引数付き）
node src/wrapper.js --include "config.json" -- node --experimental-modules ./dist/lsp-server.js --debug

# レガシーのcmd:形式もサポート
node src/wrapper.js --include "config.json" cmd:node ./dist/lsp-server.js
```

### テストクライアントの実行

```bash
npm test
```

### 新しいツールの追加

`src/tools/`ディレクトリに新しいJSファイルを作成：

```javascript
export default {
  name: "my_tool",
  description: "My custom tool",
  inputSchema: {
    type: "object",
    properties: {
      param: { type: "string" }
    },
    required: ["param"]
  },
  handler: async ({ param }) => {
    return `Result: ${param}`;
  }
};
```

ファイルを保存すると、サーバーが自動的に新しいツールを読み込み、クライアントに通知します。

## MCP仕様の実装

### tools/list_changed通知

[MCP仕様](https://modelcontextprotocol.io/specification/2025-03-26/server/tools#list-changed-notification)に従い、ツールリストが変更された際に通知を送信します：

```javascript
await this.server.notification({
  method: "tools/list_changed"
});
```

クライアントはこの通知を受け取ると、`tools/list`を再度呼び出してツールリストを更新できます。

## Claude Desktopでの使用

`.mcp.json`または`claude_desktop_config.json`に以下を追加：

```json
{
  "mcpServers": {
    "hot-reload": {
      "command": "node",
      "args": [
        "/path/to/mcp-hot-reload/src/wrapper.js",
        "--include", "config/**/*.json",
        "--include", "src/lib/**/*.js"
      ]
    },
    "custom-lsp": {
      "command": "node",
      "args": [
        "/path/to/mcp-hot-reload/src/wrapper.js",
        "--include", "**/*.yaml",
        "--",
        "python",
        "my-lsp-server.py",
        "--config", "server.yaml"
      ]
    }
  }
}
```

## コマンドライン引数

### --include パターン

glob形式のファイルパターンを指定して、変更を監視します。マッチするファイルが変更されると、プロセス全体が再起動されます。

```bash
# 単一パターン
node src/wrapper.js --include "config.json"

# 複数パターン
node src/wrapper.js --include "**/*.yaml" --include "lib/**/*.js"
```

### -- 区切り文字

`--`以降の引数は、実行するコマンドとその引数として解釈されます。これにより、複雑な引数を持つコマンドもエスケープなしで指定できます。

```bash
# Pythonスクリプトを実行
node src/wrapper.js -- python server.py --port 3000

# Node.jsで複雑な引数を持つスクリプトを実行
node src/wrapper.js --include "**/*.ts" -- node --experimental-specifier-resolution=node ./dist/server.js --config ./config.json

# スペースや特殊文字を含む引数も簡単に渡せる
node src/wrapper.js -- python script.py --message "Hello World!" --path "/path with spaces/"
```

### cmd: コマンド（レガシー）

後方互換性のため、`cmd:`形式も引き続きサポートされます。

```bash
node src/wrapper.js cmd:python server.py --port 3000
```

## 期待される動作

### 1. 初期起動時
- サーバー起動時に`src/tools/`内の全ツールファイルを読み込む
- 初期状態では`echo`と`get_time`の2つのツールが利用可能
- テストクライアントで両ツールの動作を確認できる

### 2. ツールファイルの追加
- 新規ファイル（例: `src/tools/hello.js`）を作成すると：
  - サーバーがファイル追加を検知
  - 新しいツールを自動的に読み込み
  - `tools/list_changed`通知をクライアントに送信
  - クライアントが通知を受け取り、ツールリストを更新

### 3. ツールファイルの変更
- 既存ファイル（例: `src/tools/echo.js`）を編集すると：
  - サーバーがファイル変更を検知
  - ツールを再読み込み（ESモジュールキャッシュ回避）
  - `tools/list_changed`通知をクライアントに送信
  - 変更後のツールの動作が即座に反映される

### 4. ツールファイルの削除
- ファイル（例: `src/tools/time.js`）を削除すると：
  - サーバーがファイル削除を検知
  - ツールリストから該当ツールを削除
  - `tools/list_changed`通知をクライアントに送信
  - 削除されたツールは呼び出し不可になる

### 5. エラーハンドリング
- 不正なツールファイル（構文エラーなど）を追加しても：
  - エラーをコンソールに表示
  - 他のツールは正常に動作を継続
  - サーバーはクラッシュしない

### 6. 通知の動作確認
- テストクライアント実行中のコンソールで：
  - `Received tools/list_changed notification (count: X)`が表示される
  - 現在利用可能なツール一覧が更新される

## 注意事項

- ESモジュールのキャッシュを回避するため、動的importにタイムスタンプを付加
- ツールの読み込みエラーは個別に処理され、他のツールには影響しない
- 開発時は`--watch`フラグでサーバー自体もホットリロード可能