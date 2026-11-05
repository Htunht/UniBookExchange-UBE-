import { fileURLToPath } from "node:url";
import { PrismaPg } from "@prisma/adapter-pg";
import { config } from "dotenv";
import { PrismaClient } from "./generated/prisma/client.js";

config({ path: fileURLToPath(new URL("../.env", import.meta.url)) });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL မသတ်မှတ်ရသေးပါ။");
}

const adapter = new PrismaPg({ connectionString });

export const prisma = new PrismaClient({ adapter });
