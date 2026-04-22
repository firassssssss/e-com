import { db } from "./src/infrastructure/db/index.js";
import { users } from "./src/infrastructure/db/schema/auth.js";
import { eq } from "drizzle-orm";

const email = "danielmetatrin@gmail.com";

const result = await db.delete(users).where(eq(users.email, email));
console.log(`Deleted ${result.rowCount} user(s) with email ${email}`);
process.exit(0);
