import AuthForm from "@/components/auth-form";

export default function CadastrarPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <AuthForm modo="cadastrar" />
    </main>
  );
}
