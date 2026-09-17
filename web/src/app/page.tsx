"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Church, Eye, EyeOff, Lock, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

const pillInputClass =
  "h-14 rounded-full border-none bg-muted pl-12 text-base placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary/40";

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [manterConectado, setManterConectado] = useState(true);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const { error: signInError } = await authClient.signIn.email({
      email,
      password,
      rememberMe: manterConectado,
    });

    setLoading(false);

    if (signInError) {
      setError("E-mail ou senha incorretos.");
      return;
    }

    router.push("/dashboard");
  }

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center text-center">
          <div className="flex size-20 items-center justify-center rounded-3xl bg-accent">
            <Church className="size-9 text-primary" strokeWidth={1.75} />
          </div>

          <h1 className="mt-6 font-serif text-5xl text-foreground">
            Paróquia
          </h1>

          <p className="mt-4 text-base text-muted-foreground">
            Área de Administração.
          </p>
        </div>

        <form className="mt-10 flex flex-col gap-5" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">E-mail</Label>
            <div className="relative">
              <Mail
                className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground"
                strokeWidth={1.75}
              />
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="voce@exemplo.com.br"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={pillInputClass}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="password">Senha</Label>
            <div className="relative">
              <Lock
                className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground"
                strokeWidth={1.75}
              />
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className={cn(pillInputClass, "pr-12")}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              >
                {showPassword ? (
                  <EyeOff className="size-5" strokeWidth={1.75} />
                ) : (
                  <Eye className="size-5" strokeWidth={1.75} />
                )}
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setManterConectado((v) => !v)}
            className="flex items-center gap-2.5 self-start"
          >
            <span
              className={cn(
                "flex size-5 items-center justify-center rounded-md border-2 transition-colors",
                manterConectado ? "border-primary bg-primary" : "border-border bg-transparent",
              )}
            >
              {manterConectado ? (
                <Check className="size-3.5 text-primary-foreground" strokeWidth={3} />
              ) : null}
            </span>
            <span className="text-sm text-muted-foreground">Manter conectado</span>
          </button>

          {error ? (
            <p className="text-center text-sm text-destructive">{error}</p>
          ) : null}

          <Button
            type="submit"
            disabled={loading}
            className="mt-2 h-14 rounded-full bg-primary text-base font-bold text-primary-foreground hover:bg-primary/90"
          >
            {loading ? "Entrando..." : "Entrar"}
          </Button>
        </form>
      </div>
    </main>
  );
}
