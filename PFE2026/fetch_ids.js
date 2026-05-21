const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres:admin@localhost:5432/cosmetica_db' });
client.connect().then(async () => {
  const users = await client.query('SELECT id FROM "user" LIMIT 5');
  console.log('USERS:', JSON.stringify(users.rows));
  const products = await client.query('SELECT id FROM products LIMIT 10');
  console.log('PRODUCTS:', JSON.stringify(products.rows));
  await client.end();
}).catch(e => console.error(e));
