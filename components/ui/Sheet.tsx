import type { ReactNode } from "react";

type Props = {
  id?: string;
  /** Background of the section above, visible behind this sheet's curved corner. */
  under: string;
  className?: string;
  labelledBy?: string;
  children: ReactNode;
};

/** A full-width section whose top corner carries the curve from the logo. */
export function Sheet({ id, under, className, labelledBy, children }: Props) {
  return (
    <div className={under}>
      <section
        id={id}
        tabIndex={id ? -1 : undefined}
        aria-labelledby={labelledBy}
        className={`sheet outline-none ${className ?? ""}`}
      >
        {children}
      </section>
    </div>
  );
}
