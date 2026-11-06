/** The lime ribbon: a single, deliberately loud moment of the accent color. */
export function Ribbon({ items }: { items: string[] }) {
  const line = (
    <span className="flex shrink-0 items-center">
      {items.map((item, index) => (
        <span key={`${item}-${index}`} className="flex items-center">
          <span className="display px-6 text-2xl md:text-3xl">{item}</span>
          <svg viewBox="0 0 20 20" aria-hidden className="size-5 fill-ink">
            <path d="M0 20C0 9 9 0 20 0v20H0Z" />
          </svg>
        </span>
      ))}
    </span>
  );

  return (
    <div className="relative z-40 h-0 overflow-x-clip">
      <div
        className="absolute -inset-x-[2%] top-0 -translate-y-1/2 -rotate-[1.4deg] overflow-clip bg-lime py-3 text-ink shadow-[0_18px_40px_-18px_rgb(23_21_31/0.7)] rtl:rotate-[1.4deg]"
      >
        <p className="sr-only">{items.join(", ")}</p>
        <div aria-hidden className="marquee">
          {line}
          {line}
          {line}
          {line}
        </div>
      </div>
    </div>
  );
}
