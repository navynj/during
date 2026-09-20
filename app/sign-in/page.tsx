import { SignInButton } from '@/features/auth/sign-in-button';

export default function SignInPage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-8 px-6 text-center">
      <div className="space-y-3">
        <h1 className="text-main-400 text-3xl font-bold">During</h1>
        <p className="text-pool-500 max-w-xs">
          A one-line diary that assembles itself, for a few close friends.
        </p>
      </div>
      <SignInButton />
    </main>
  );
}
