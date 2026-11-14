import type { HTMLAttributes } from 'react';
import { cx } from './cx';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Use the alternate, slightly darker card background. */
  alt?: boolean;
}

export default function Card({ alt = false, className, ...rest }: CardProps) {
  return (
    <div
      className={cx(
        'rounded-2xl border border-nyx-border',
        alt ? 'bg-nyx-card-alt' : 'bg-nyx-card',
        className,
      )}
      {...rest}
    />
  );
}
