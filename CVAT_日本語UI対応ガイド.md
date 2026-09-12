# CVAT 日本語UI対応ガイド（実装状況と続け方）

## 1. 現状（このコミットで実装した範囲）

CVATには元々**国際化(i18n)の仕組みが一切存在しない**（`react-intl`や`i18next`のようなライブラリ未導入、`cvat-ui/src`配下に`i18n`や`locale`という名前のディレクトリも無かった）。そのため今回、土台となる仕組みを新規に作り、その上で以下の2画面を実際に日本語化した。

- ログイン画面（`cvat-ui/src/components/login-page/login-form.tsx`）
- 設定モーダル（`cvat-ui/src/components/header/settings-modal/settings-modal.tsx`）に「General」タブを追加し、言語切替スイッチャーを設置

**確認方法**：CVATを起動 → ヘッダー右上のユーザーアイコン →「Settings」→「General」タブ →「Language」で「日本語」を選択すると、即座に（ページ再読み込みなしで）画面のテキストが切り替わる。設定はブラウザの`localStorage`に保存され、次回アクセス時も引き継がれる。

`cvat-ui/src`配下の画面ファイルは274個あり、ログイン画面(2ファイル)以外の約272ファイルはまだ英語のまま。これは「仕組みを作って実証する」までが今回のスコープであり、全画面翻訳は工数的に別作業として扱う必要があるため。

## 2. 仕組みの説明（初めて読む人向け）

普通のReactアプリでは、画面の文字は`<div>ログイン</div>`のようにソースコードに直接書き込まれている（ハードコーディング）。これでは言語を切り替える方法がない。

そこで使うのが**i18nライブラリ**という仕組み。やることは3つだけ：

1. 文字列をコードから抜き出し、`"login.form.title": "Sign in"`のような**ID→文字列の対応表(辞書)**を言語ごとに作る（`en.ts`＝英語辞書、`ja.ts`＝日本語辞書）。
2. コード側は`<FormattedMessage id="login.form.title" defaultMessage="Sign in" />`のように「このIDの文字を表示して」と書くだけにする。`defaultMessage`は辞書が見つからない時の保険（フォールバック）。
3. アプリ全体を`<IntlProvider locale="ja" messages={ja辞書}>`という部品で囲むと、その中の`FormattedMessage`が全部日本語辞書を参照するようになる。`locale`の値を切り替えるだけで、アプリ全体の言語が一括で変わる。

今回採用したライブラリは**react-intl**（React用の定番i18nライブラリ）。CVATが使っているUIライブラリ**antd**（Ant Design）自体にも独自の多言語設定（日付・ページネーション表記など）があるので、`ConfigProvider`という部品でこれも同時に日本語(`ja_JP`)へ切り替えている。

### 作成したファイルの役割

| ファイル | 役割 |
|---|---|
| `cvat-ui/src/i18n/language-store.ts` | 現在の言語(`en`/`ja`)を`localStorage`に保存・読み込みする小さな仕組み。Reduxを使わず独立させ、既存の設定システムに影響を与えないようにした。 |
| `cvat-ui/src/i18n/messages/en.ts` | 英語の辞書（フォールバック用、すべてのIDの基準） |
| `cvat-ui/src/i18n/messages/ja.ts` | 日本語の辞書。ここにIDと日本語訳を追加していけば翻訳が増える |
| `cvat-ui/src/i18n/index.tsx` | `IntlProvider`と`ConfigProvider`をまとめた`I18nRoot`（アプリ全体を囲む部品）と、言語切替用フック`useLanguage()`を提供 |
| `cvat-ui/src/index.tsx` | アプリのエントリーポイント。`I18nRoot`で全体を囲むよう1箇所だけ変更 |

## 3. 残りの画面を翻訳する手順（このパターンを273ファイルに繰り返す）

1. 対象ファイルを開き、ハードコードされた文字列（例：`<Button>Save</Button>`）を探す。
2. `cvat-ui/src/i18n/messages/en.ts`に一意なIDを追加：`'taskPage.saveButton': 'Save',`
3. `cvat-ui/src/i18n/messages/ja.ts`に対応する日本語訳を追加：`'taskPage.saveButton': '保存',`
4. コード側で置き換える：
   - JSXの子要素として表示される文字列 → `<FormattedMessage id='taskPage.saveButton' defaultMessage='Save' />`
   - `placeholder=`, `title=`, バリデーションの`message:`など**文字列そのものが必要な場所** → `useIntl()`フックを取得し、`intl.formatMessage({ id: 'taskPage.saveButton', defaultMessage: 'Save' })`
5. ファイル冒頭に`import { FormattedMessage, useIntl } from 'react-intl';`を追加（インポート順は`react-redux`など外部ライブラリと同じグループでよい。ESLintの`import/order`ルール参照）。

### 優先順位のおすすめ

全272ファイルを一度に翻訳するのは非効率かつリスクが高い（ビルド崩壊・レビュー困難）。以下の順で段階的に進めるのが安全：

1. ヘッダー・ナビゲーション（`components/header/header.tsx`）－ 全画面で常に表示される
2. タスク一覧・作成画面（`tasks-page/`, `create-task-page/`）－ 利用頻度が高い
3. アノテーション画面のツールバー（`annotation-page/`）－ 画面数が多く後回しでも影響は限定的
4. エラーメッセージ・通知（`notification`関連）－ 文字列が分散しているため最後にまとめて対応

## 4. 未対応・注意点（事実として明記）

- **文法上の複数形・助詞の変化には未対応**：react-intlはICU Message Format（`{count, plural, ...}`など）に対応しているが、今回の実装では単純なキー→文字列の対応のみ。件数によって「1個」「2個」のように変わる表現が必要な箇所は、対応時にICU構文を使う必要がある。
- **日付・数値の表示**：antdの`ConfigProvider`は日本語ロケール(`ja_JP`)に切り替えているが、コード内で直接`moment()`を使っている箇所（`cvat-ui`は`moment`ライブラリに依存）は、`moment.locale('ja')`を別途呼ばない限り英語表記のままになる可能性がある。実際に日付表示が残っている画面があれば、その時点で確認・対応する。
- **バックエンド側（Django）のメッセージ**：今回の対応はフロントエンド(`cvat-ui`)のみ。エラーメッセージをAPIが直接返す設計になっている箇所（`cvat/apps/*`）は、バックエンドの多言語化が別途必要（Django自体は`django.utils.translation`で多言語対応可能だが、CVATバックエンドは現状これも未導入）。
- **cvat-core / cvat-canvas**：ツールチップ等の文字列がこれらのパッケージ内にある場合、`cvat-ui`の辞書だけでは対応できない。該当箇所が見つかった時点で個別対応が必要。

## 5. 動作確認・ビルド検証について

このセッションでは`yarn install`をリポジトリのルートで実行し、`react-intl`が依存関係として正しく解決されるかを確認した（結果は別途コミットログ・作業ログを参照）。実機でのUI目視確認（ブラウザでの表示切替）は、Docker環境（`docker compose up`）またはローカル開発サーバー（`yarn workspace cvat-ui start`）を起動できる環境で別途行うこと。
