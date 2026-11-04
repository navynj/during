/** Where a ripple or a reply was written, "in Church": the card stack's and the splash's All (H75). */
export function ThreadLabel({ children }: { children: string }) {
  return (
    <span data-card-thread-label className="text-pool-500 text-[10px] font-medium">
      {children}
    </span>
  );
}
