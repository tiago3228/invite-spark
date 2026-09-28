import { createFileRoute } from "@tanstack/react-router";
import { AuthForm } from "@/components/AuthForm";

export const Route = createFileRoute("/login")({
  component: Login,
  head: () => ({
    meta: [
      { title: "Entrar | Meu Convite" },
      { name: "description", content: "Entre na sua conta do Meu Convite." },
    ],
  }),
});

function Login() {
  return <AuthForm mode="login" />;
}
