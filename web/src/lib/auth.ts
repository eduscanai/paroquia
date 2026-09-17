import { expo } from "@better-auth/expo";
import { betterAuth } from "better-auth";

import { pool } from "@/lib/db";

export const ROLES = ["desenvolvedor", "paroquia", "comunidade", "fiel"] as const;
export type Role = (typeof ROLES)[number];

export const authOptions = {
  database: pool,
  // "mobile" é o `scheme` definido no app.json do app Expo — necessário
  // pro plugin expo() aceitar as requisições vindas dele.
  trustedOrigins: ["mobile://"],
  plugins: [expo()],
  emailAndPassword: {
    enabled: true,
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: true,
        defaultValue: "fiel",
        // Só é definido no servidor (seed, painel de admin) — nunca pelo
        // próprio usuário no cadastro, pra evitar auto-promoção de nível.
        input: false,
      } as const,
    },
  },
};

export const auth = betterAuth(authOptions);
