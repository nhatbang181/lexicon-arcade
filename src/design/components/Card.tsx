import React from 'react';
import { Button, type SkillColor } from './Button';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  skillAccent?: SkillColor;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  interactive?: boolean;
  elevated?: boolean;
}

const skillVarMap: Record<SkillColor, string> = {
  vocab: 'var(--color-vocab)',
  listening: 'var(--color-listening)',
  reading: 'var(--color-reading)',
  writing: 'var(--color-writing)',
  speaking: 'var(--color-speaking)',
  exam: 'var(--color-exam)',
  info: 'var(--color-info)',
};

const INTERACTIVE_TAGS = new Set(['button', 'a', 'input', 'select', 'textarea', 'summary']);

function hasNestedInteractive(node: React.ReactNode): boolean {
  let found = false;
  React.Children.forEach(node, (child) => {
    if (found || !React.isValidElement(child)) return;
    const type = child.type;
    const props = child.props as Record<string, unknown>;
    if (typeof type === 'string' && INTERACTIVE_TAGS.has(type)) {
      found = true;
      return;
    }
    if (type === Button || props.role === 'button' || props.role === 'link' || typeof props.onClick === 'function') {
      found = true;
      return;
    }
    if (props.children && hasNestedInteractive(props.children as React.ReactNode)) {
      found = true;
    }
  });
  return found;
}

export const Card: React.FC<CardProps> = ({
  skillAccent,
  padding = 'md',
  interactive = false,
  elevated = true,
  className = '',
  style,
  children,
  onClick,
  onKeyDown,
  role,
  tabIndex,
  ...rest
}) => {
  const padClass = {
    none: 'p-0',
    sm: 'p-4',
    md: 'p-5',
    lg: 'p-6',
  }[padding];

  const isClickable = interactive || typeof onClick === 'function';
  const nestedInteractive = isClickable && hasNestedInteractive(children);
  const attachButtonRole = isClickable && !nestedInteractive;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(e);
    if (e.defaultPrevented || !isClickable || !onClick) return;
    if (e.target !== e.currentTarget) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick(e as unknown as React.MouseEvent<HTMLDivElement>);
    }
  };

  return (
    <div
      role={attachButtonRole ? (role ?? 'button') : role}
      tabIndex={attachButtonRole ? (tabIndex ?? 0) : tabIndex}
      onClick={onClick}
      onKeyDown={isClickable ? handleKeyDown : onKeyDown}
      className={`rounded-[var(--radius-lg)] border transition-transform duration-150 ${padClass} ${
        isClickable ? 'cursor-pointer hover:-translate-y-0.5 active:scale-[0.99]' : ''
      } ${className}`}
      style={{
        backgroundColor: 'var(--color-surface)',
        borderColor: 'var(--color-border)',
        borderLeftWidth: skillAccent ? '4px' : '1px',
        borderLeftColor: skillAccent ? skillVarMap[skillAccent] : 'var(--color-border)',
        boxShadow: elevated ? 'var(--shadow-card)' : 'none',
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
};
