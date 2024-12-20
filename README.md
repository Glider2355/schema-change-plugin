# 概要

pt-online-schema-changeのプラグインを含んだリポジトリです。

## サンプルのMySQLでスキーマ変更をする方法

1. sample-dbを立ち上げる

```bash
cd sample-db
docker compose up -d
```

2.テーブルとトリガーを削除せず、同期する

```bash
docker compose up -d

docker exec -it percona-toolkit bash

pt-online-schema-change --alter "ADD COLUMN new_column INT" --user=root --password=root --host=127.0.0.1 --port=3306 D=testdb,t=test1 --no-swap-tables --no-drop-triggers --execute
```

3.テーブルを入れ替える

```sql
ANALYZE TABLE testdb._test1_new;

RENAME TABLE
  testdb.test1 TO testdb.test1_backup,
  testdb._test1_new TO testdb.test1;
```

4.バックアップテーブルをdropする

```sql
DROP TABLE testdb.test1_backup;
```

## トリガーを作成せずにデータ同期を行う方法

```sql
pt-online-schema-change --alter "ADD COLUMN new_column2 INT" --plugin /plugins/SkipCreateTriggers.pm --user=root --password=root --host=127.0.0.1 --port=3306 D=testdb,t=test1 --no-swap-tables --no-drop-new-table --execute
```

## 各種Option

- 監視系option
  - --max-load
    - デフォルト：25スレッド
    - 指定スレッド数を超えた場合、処理を一時停止
    - 負荷が落ち着くと再開する
  - --critical-load
    - デフォルト：50スレッド
    - 指定スレッド数を超えた場合、処理を終了する
    - 一時テーブルやトリガーは残る

- 実行系option
  - --dry-run
    - 実際には処理が行われないドライラン確認用オプション
  - --execute
    - 処理の実行を行うオプション
  - --nodrop-old-table
    - デフォルト: yes
    - スキーマ変更前の旧テーブルのDROPを行わないオプション。確認で残しておきたい時に
  - --no-swap-tables
    - renameによるtableの入れ替えを行わない
  - --no-drop-triggers
    - 同期する際のトリガを削除しない
  - --where
    - 同期するレコードの対象を決める
    - 例: --where "id > 1234" (idが1235以降のレコードだけ同期される)

- チャンクの調整系option
  - --sleep N
    - デフォルト：0 (秒)
    - チャンクごとのコピーの間にスリープを挟む。
    - Nの単位は秒
  - --chunk-size N
    - デフォルト: 1000
    - チャンク内のレコード数の調整を行なう。
    - 明示的に指定した場合は動的なチャンクサイズの変更が効かない
  - --chunk-time X
    - デフォルト: 0.5(秒)
    - チャンク1つあたりのコピーにX秒かかるよう、チャンクサイズを動的に変更する。

- ロック系option
  - --set-vars
    - デフォルト
      - wait_timeout=10000
        - サーバーがクライアント接続を待機する最大時間（秒）
      - innodb_lock_wait_timeout=1
        - 行ロックの待機時間（秒）
      - lock_wait_timeout=60
        - メタデータロックを取得するための待機時間（秒）
    - 設定方法例
      - --set-vars lock_wait_timeout=10,innodb_lock_wait_timeout=5,lock_wait_timeout=5
  - --tries
    - デフォルト:1秒間隔で10回
    - lock_wait_timeoutを超えてDDLが失敗した場合は、pt-oscが自動で再試行する。
    - 失敗する確率が高い場合には調整する

- 外部キー系option(外部キーがある場合は要注意)
  - --[no]check-foreign-keys
    - デフォルト: yes
    - 自己参照外部キーをチェックする
    - 現在、自己参照 FK は完全にはサポートされていない
  - --alter-foreign-keys-method auto
    - 最適な方法を自動的に決定する
  - --alter-foreign-keys-method rebuild_constraints
    - 新しいテーブルを参照する外部キー制約を削除して再度追加する
    - 1 つ以上の「子」テーブルが非常に大きく、時間がかかりすぎる場合を除き、これは推奨される手法
    - インデックス名に_がつくかも
  - --alter-foreign-keys-method drop_swap
    - 元のテーブルを削除してから、新しいテーブルの名前をその場所に変更する(drop + rename)
    - 高速
    - 元のテーブルを削除してから一時テーブルの名前を変更するまでの短い時間、テーブルが消滅するためエラーになる
    - 新しいテーブルを古いテーブルと同じ場所に名前変更できない場合、古いテーブルは永久に失われる
    - --no-swap-tables と --no-drop-old-tableが必須
  - --alter-foreign-keys-method none
    - 元のテーブルを参照していた外部キーは、存在しないテーブルを参照するようになる

外部キーが貼られているか確認するクエリ

```sql
SELECT
TABLE_NAME AS 参照元テーブル,
COLUMN_NAME AS 参照元カラム,
CONSTRAINT_NAME AS 外部キー名,
REFERENCED_TABLE_NAME AS 参照先テーブル,
REFERENCED_COLUMN_NAME AS 参照先カラム
FROM
information_schema.KEY_COLUMN_USAGE
WHERE
TABLE_SCHEMA = 'testdb'
AND REFERENCED_TABLE_NAME = 'test1';
```

## 公式ドキュメント

<https://docs.percona.com/percona-toolkit/pt-online-schema-change.html>
