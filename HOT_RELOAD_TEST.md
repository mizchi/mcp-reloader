# MCPホットリロードテスト手順

## セットアップ完了内容

1. **拡張されたechoツール** (`src/tools/echo.js`)
   - タイムスタンプ付きレスポンス
   - 絵文字オプション（`emoji: true`で🔊を追加）

2. **新規debug_infoツール** (`src/tools/debug.js`)
   - 環境情報（`type: "env"`）
   - メモリ使用状況（`type: "memory"`）
   - 全情報（`type: "all"`）

3. **新規error_testツール** (`src/tools/error-test.js`)
   - エラーハンドリングのテスト
   - `errorType`: "throw", "reject", "syntax", "timeout"

## テスト手順

### 1. サーバー起動
```bash
npm run dev
```

### 2. 別ターミナルでMCPクライアントから接続

Claude Desktop等の設定（`.mcp.json`）:
```json
{
  "mcpServers": {
    "hot-reload": {
      "command": "node",
      "args": ["/home/mizchi/ideas/mcp-hot-reload/src/server.js"]
    }
  }
}
```

### 3. ホットリロードの確認

#### a. 初期状態の確認
- ツール一覧: `echo`, `get_time`, `debug_info`, `error_test`

#### b. echoツールの新機能テスト
```
echo("Hello", emoji=true)
→ 🔊 [10:35:42] Echo: Hello
```

#### c. ファイル変更時の自動リロード
1. `src/tools/`内のファイルを編集
2. サーバーログで「Tool changed, reloading...」を確認
3. MCPクライアントで新機能が即座に利用可能

#### d. 新ツール追加時の動的認識
1. 新しい`.js`ファイルを`src/tools/`に追加
2. サーバーログで「Tool added, reloading...」を確認
3. ツールリストが自動更新される

## 確認されたホットリロード機能

✅ ファイル変更の自動検知（chokidarによる監視）
✅ ツールの動的リロード（ESMのキャッシュバスティング）
✅ クライアントへの通知（`tools/list_changed`）
✅ エラーハンドリング（不正なツールファイルをスキップ）

## トラブルシューティング

- サーバー起動時の「Error: Not connected」は初回読み込み時の正常な動作
- クライアント接続後は正常に通知が送信される