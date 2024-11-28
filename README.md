# サンプルのMySQLのDBで試す

1. sample-dbを立ち上げる

```
cd sample-db
docker compose up -d
```

2.テーブルとトリガーを削除せず、同期する
```
docker compose up -d

docker exec -it percona-toolkit bash

pt-online-schema-change --alter "ADD COLUMN new_column INT" --user=root --password=root --host=127.0.0.1 --port=3306 D=testdb,t=test1 --no-swap-tables --no-drop-triggers --execute
```
