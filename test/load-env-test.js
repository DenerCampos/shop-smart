const path = require('path');
const fs = require('fs');

const envPath = path.resolve(__dirname, '../.env.test');
if (!fs.existsSync(envPath)) {
  throw new Error(
    'E2E: arquivo .env.test não encontrado. Copie .env.test.example para .env.test na raiz do projeto.',
  );
}

require('dotenv').config({ path: envPath });
