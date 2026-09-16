# TFT DoubleUp.GG プロジェクト開発 & デプロイルール (Project Guidelines)

本プロジェクトにおける開発・編集およびVPS本番デプロイ（`update_vps.bat`）において、過去に発生したエラーとユーザー要件に基づき以下のルールを絶対遵守すること。

---

## 1. 管理者ポータル非公開ルール (Admin Portal Privacy Rule)
* **公開UIへの管理者ボタン露出禁止**:
  - [Header.tsx](file:///c:/TFT-DoubleUP-Web/frontend/components/Header.tsx) を含む一般ユーザー向け公開ナビゲーション・ヘッダー・フッターに「管理者ポータル」ボタンや `/admin` への直接リンクを絶対に配置しないこと。
  - 公開画面の空状態（相方構成未登録時、盤面未設定時など）で「管理者ポータルから追加できます」などの管理者向け文言を表示させないこと（「今後のアップデートで随時追加されます」等にすること）。
* **管理者機能へのアクセス**:
  - 管理者機能はブラウザのアドレスバーに `/admin` を直接入力してアクセスし、`middleware.ts` およびパスコード認証によって保護される運用を徹底する。

---

## 2. 過去のエラー原因と再発防止チェック (Past Deployment Errors & Prevention)

過去に `update_vps.bat` 実行時（Next.js 14 SWC ビルド）に発生したエラー一覧と対策：

| エラーカテゴリ | 過去の発生原因 | 必須チェック内容 |
| :--- | :--- | :--- |
| **JSX / 構文不整合** | `currentUnits.map` の末尾が `); })}` ではなく `))` になっていた。 | 全ての変更対象 `.tsx`/`.ts` ファイルで `{}` と `()` の開閉差分が **0** であることをスクリプトで検証する。 |
| **SWCパーサー競合** | コンポーネント関数内にJSXを返すネスト関数（`renderBoardGrid`）や、属性内の即時実行関数 `(() => { ... })()` を配置したことでSWCが誤検知した。 | JSXを返すヘルパーはコンポーネント内に作らず、直接条件付きインライン `{activeTab === 'X' && (...)}` で記述するか、コンポーネント外に独立させる。 |
| **TypeScript 型エラー** | `compTypes.ts` の `Item` が `string` の場合（`TFT_Item_WarmogsArmor` など）に対応できず、`item.id` や `item.name` でビルド落ちした。 | `typeof item === 'string' ? item : item.id` のように常に型安全にガードする。 |
| **オプショナル引数** | `unit.cost` が `undefined` の場合に `costColor(cost: number)` が型エラーになった。 | `(cost?: number | string | null)` のようにオプショナル引数を安全に受ける。 |
| **リポジトリ未同期** | ルート `c:\TFT-DoubleUP-Web` 側のみ編集し、`app/` 側へコピーしていなかったため、VPSに旧コードが送られた。 | ルートと `app/` は常に100%完全同期させる。 |

---

## 3. update_vps.bat 実行前の必須検証手順 (Pre-Deployment Checklist)

ユーザーに `update_vps.bat` の実行を促す前に、AIアシスタントは**必ず**以下の手順を実行・確認すること：

1. **自動事前検証スクリプトの実行**:
   ```powershell
   powershell -NoProfile -ExecutionPolicy Bypass -File "c:\TFT-DoubleUP-Web\scripts\pre_deploy_check.ps1"
   ```
   - チェック1: `Header.tsx` に管理者ポータルボタン・`/admin` リンクが存在しないこと
   - チェック2: 一般公開コンポーネント内に「管理者ポータル」の文言が残っていないこと
   - チェック3: 全 `.ts` / `.tsx` ファイルの括弧 `{}` `()` がすべてバランスしていること（差分0）
   - チェック4: ルートの更新が `app/` リポジトリへ完全に同期されていること
2. **検証結果がすべて `[PASS]` で終了した場合のみ**、ユーザーへデプロイ完了の報告および `update_vps.bat` の実行を案内する。
