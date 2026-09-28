import { createFileRoute } from "@tanstack/react-router";
import { AuthForm } from "@/components/AuthForm";

export const Route = createFileRoute("/cadastro")({
  component: Signup,
  head: () => ({
    meta: [
      { title: "Criar conta | Meu Convite" },
      { name: "description", content: "Crie sua conta no Meu Convite." },
    ],
  }),
});

function Signup() {
  return <AuthForm mode="signup" />;
}
