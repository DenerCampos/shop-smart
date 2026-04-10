import { DataSource } from 'typeorm';
import dataSource from '../data-source';
import { seedThemeDev } from './theme.dev.seed';
import { seedDevTestUser } from './user.dev.seed';
import { seedOauthClientDev } from './OauthClientSeed';

type SeedFn = (ds: DataSource) => Promise<void>;

const DEV_SEEDS: Array<{ name: string; run: SeedFn }> = [
  { name: 'theme', run: seedThemeDev },
  { name: 'user (teste)', run: seedDevTestUser },
  { name: 'oauth client', run: seedOauthClientDev },
];

async function runAllDevSeeds(): Promise<void> {
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'Seeds de desenvolvimento bloqueados: NODE_ENV não pode ser production.',
    );
  }

  await dataSource.initialize();

  try {
    for (const seed of DEV_SEEDS) {
      await seed.run(dataSource);
      console.log(`Seed OK: ${seed.name}`);
    }
  } finally {
    await dataSource.destroy();
  }
}

runAllDevSeeds()
  .then(() => {
    console.log('Todos os seeds (dev) concluídos.');
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
