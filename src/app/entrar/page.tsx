import AuthForm from "@/components/auth-form";

export default function EntrarPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <AuthForm modo="entrar" />
    </main>
  );
}
