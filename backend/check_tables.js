const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

async function main() {
  const prisma = new PrismaClient();
  const count = await prisma.floorTable.count();
  console.log('COUNT:', count);
  
  if (count > 0) {
    const tables = await prisma.floorTable.findMany();
    console.log(tables[0]);
  }
}
main().catch(console.error).finally(() => process.exit(0));
