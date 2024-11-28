import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ランダムな日付を生成
function getRandomDate(start: Date, end: Date): Date {
  const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  return new Date(date.toISOString().split('T')[0]); // 日付のみ（時刻は 00:00:00）
}

// ランダムな時刻を生成
function getRandomTime(): Date {
  const hours = Math.floor(Math.random() * 24); // 0~23
  const minutes = Math.floor(Math.random() * 60); // 0~59
  return new Date(2024, 0, 1, hours, minutes, 0); // 時間、分、秒を設定
}

// ランダムな整数を生成
function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function seedDatabase() {
  const batchSize = 1000; // 一度に挿入するレコード数
  const totalRecords = 1000 * 30; // 挿入する総レコード数
  const data: Array<{ user_id: number; date: Date; start_time: Date; end_time: Date }> = [];

  for (let i = 1; i <= totalRecords; i++) {
    const userId = getRandomInt(1, 1000); // ランダムなuser_id
    const date = getRandomDate(new Date('2024-11-01'), new Date('2024-11-30')); // 日付
    const startTime = getRandomTime(); // ランダムな開始時刻
    const endTime = new Date(startTime.getTime() + getRandomInt(1, 8) * 60 * 60 * 1000); // 開始時刻から1~8時間後の終了時刻

    data.push({
      user_id: userId,
      date: date,
      start_time: startTime,
      end_time: endTime,
    });

    // バッチサイズごとにデータを挿入
    if (data.length === batchSize || i === totalRecords) {
      await prisma.test1.createMany({
        data: data,
        skipDuplicates: true,
      });
      console.log(`${i} records inserted`);
      data.length = 0; // 配列をリセット
    }
  }

  console.log('All records inserted.');
}

async function seedDatabase2() {
  const batchSize = 1000; // 一度に挿入するレコード数
  const totalRecords = 1000 * 30; // 挿入する総レコード数
  const data: Array<{ kind: number; date: Date; start_time: Date; end_time: Date }> = [];
  const dataRelation: Array<{ relation_kind: number; relation_id: number; test2_id: number }> = [];

  for (let i = 1; i <= totalRecords; i++) {
    const kind = getRandomInt(1, 5);
    const relationKind = getRandomInt(1, 2);
    const date = getRandomDate(new Date('2024-11-01'), new Date('2024-11-30')); // 日付
    const startTime = getRandomTime(); // ランダムな開始時刻
    const endTime = new Date(startTime.getTime() + getRandomInt(1, 8) * 60 * 60 * 1000); // 開始時刻から1~8時間後の終了時刻

    data.push({
      kind: kind,
      date: date,
      start_time: startTime,
      end_time: endTime,
    });

    // バッチサイズごとにデータを挿入
    if (data.length === batchSize || i === totalRecords) {
      // test2 のデータを挿入し、生成された ID を取得
      const createdTest2Records = await Promise.all(
        data.map(async (record) => {
          return prisma.test2.create({
            data: record,
          });
        })
      );

      console.log(`${createdTest2Records.length} test2 records inserted`);

      // test2_relations に関連付けるデータを作成
      createdTest2Records.forEach((record) => {
        const test2Id = record.id; // 挿入された test2 の ID
        const userId = getRandomInt(1, 1000); // ランダムな user_id
        const relationKind = getRandomInt(1, 2);

        dataRelation.push({
          relation_kind: relationKind,
          relation_id: userId,
          test2_id: test2Id, // test2 の ID を関連付け
        });
      });

      data.length = 0; // 配列をリセット
    }
    for (let i:number = 0; i < 3; i++) {
    if (dataRelation.length === batchSize || i === totalRecords) {
      await prisma.test2_relations.createMany({
        data: dataRelation,
        skipDuplicates: true,
      });
      console.log(`${dataRelation.length} test2_relations records inserted`);
      dataRelation.length = 0; // 配列をリセット
    }
  }
  }

  console.log('All records inserted.');
}


async function main() {
  await seedDatabase();
  await seedDatabase2();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
