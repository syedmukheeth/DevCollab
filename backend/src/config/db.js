const { PrismaClient } = require('@prisma/client');

let prisma;

const getPrisma = () => {
  if (!prisma) {
    prisma = new PrismaClient();
  }
  return prisma;
};

const connectDB = async () => {
  try {
    const client = getPrisma();
    await client.$connect();
    console.log('PostgreSQL (Prisma) connected');
  } catch (err) {
    console.error('Database connection error', err);
    process.exit(1);
  }
};

module.exports = {
  connectDB,
  get prisma() {
    return getPrisma();
  }
};
