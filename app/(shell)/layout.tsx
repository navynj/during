import { TabBar } from '@/components/ui/tab-bar';
import { InputSheetProvider } from '@/features/input-sheet/sheet-provider';

export default function ShellLayout({ children }: LayoutProps<'/'>) {
  return (
    // The provider wraps both, so the FAB in the bar and the ghost slot in the
    // page reach the same sheet.
    <InputSheetProvider>
      <div className="flex min-h-dvh flex-col">
        <div className="mx-auto flex w-full max-w-xl flex-1 flex-col px-6">{children}</div>
        <TabBar />
      </div>
    </InputSheetProvider>
  );
}
