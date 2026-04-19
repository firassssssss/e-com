import { betterAuth } from "better-auth";
import { bearer, openAPI } from "better-auth/plugins";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from '../infrastructure/db/index.js';

export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: "pg",
    }),
    emailAndPassword: {
        enabled: true,
    },
    session: {
        user: {
            fields: ['id', 'name', 'email', 'role'] // include role in session
        }
    },
    trustedOrigins: [
        "http://localhost:3001",
    ],
    plugins: [
        bearer(),
        openAPI()
    ]
});
