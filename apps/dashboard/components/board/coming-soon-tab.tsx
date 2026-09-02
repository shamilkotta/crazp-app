export function ComingSoonTab({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return (
    <div className="flex min-h-[min(520px,calc(100dvh-14rem))] items-center justify-center px-4 py-10">
      <div className="w-full max-w-xl text-center">
        <p className="text-[20px] font-medium tracking-tight">{title}</p>
        <p className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed text-muted-foreground">
          {body}
        </p>
        <p className="mt-8 text-[13px] font-medium text-muted-foreground">
          Coming soon
        </p>
      </div>
    </div>
  );
}
