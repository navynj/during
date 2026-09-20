import { TabBar } from '@/components/ui/tab-bar';

export default function ShellLayout({ children }: LayoutProps<'/'>) {
  return (
    <div className="flex min-h-dvh flex-col">
      <div className="mx-auto w-full max-w-xl flex-1 px-6">{children}</div>
      <TabBar />
    </div>
  );
}
