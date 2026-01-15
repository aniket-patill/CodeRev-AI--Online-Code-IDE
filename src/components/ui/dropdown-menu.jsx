'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

// Helper function to merge refs
function mergeRefs(refs) {
  return (node) => {
    refs.forEach((ref) => {
      if (typeof ref === 'function') {
        ref(node);
      } else if (ref != null) {
        ref.current = node;
      }
    });
  };
}

// Dropdown Root Component
const DropdownMenu = ({ children, open, onOpenChange, ...props }) => {
  const [isOpen, setIsOpen] = React.useState(false);

  const toggleOpen = () => {
    const newState = !isOpen;
    setIsOpen(newState);
    if (onOpenChange) onOpenChange(newState);
  };

  return (
    <div className="relative inline-block text-left" {...props}>
      {React.Children.map(children, (child) =>
        React.isValidElement(child)
          ? child.type === DropdownMenuTrigger
            ? React.cloneElement(child, { onClick: toggleOpen, isOpen })
            : child.type === DropdownMenuContent
            ? React.cloneElement(child, { isOpen, onClose: () => setIsOpen(false) })
            : child
          : child
      )}
    </div>
  );
};

// Dropdown Trigger Component
const DropdownMenuTrigger = React.forwardRef(({ children, onClick, isOpen, asChild = false, ...props }, ref) => {
  const cloneElement = (element, newProps) => {
    const mergedRef = mergeRefs([ref, element.ref]);
    return React.cloneElement(element, {
      ...newProps,
      ref: mergedRef,
    });
  };
  
  if (asChild && React.isValidElement(children)) {
    return cloneElement(children, {
      onClick: (e) => {
        onClick?.(e);
        children.props.onClick?.(e);
      },
      'aria-expanded': isOpen,
      ...props,
    });
  }
  
  return React.cloneElement(children, {
    ref,
    onClick: (e) => {
      onClick?.(e);
      children.props.onClick?.(e);
    },
    'aria-expanded': isOpen,
    ...props,
  });
});
DropdownMenuTrigger.displayName = 'DropdownMenuTrigger';

// Dropdown Content Component
const DropdownMenuContent = React.forwardRef(({ children, className, align = 'end', isOpen, onClose, ...props }, ref) => {
  const contentRef = React.useRef(null);

  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (contentRef.current && !contentRef.current.contains(event.target)) {
        onClose?.();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={contentRef}
      className={cn(
        'absolute z-50 mt-1 w-48 origin-top-right rounded-md bg-zinc-900 border border-zinc-800 shadow-lg',
        'data-[side=bottom]:translate-y-1 data-[side=top]:-translate-y-1',
        'data-[align=start]:left-0 data-[align=center]:left-1/2 data-[align=end]:right-0',
        'data-[align=center]:-translate-x-1/2',
        align === 'end' ? 'right-0' : align === 'start' ? 'left-0' : 'left-1/2 -translate-x-1/2',
        className
      )}
      {...props}
    >
      <div className="p-1">{children}</div>
    </div>
  );
});
DropdownMenuContent.displayName = 'DropdownMenuContent';

// Dropdown Item Component
const DropdownMenuItem = React.forwardRef(({ children, className, onClick, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        'relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors',
        'focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        'hover:bg-zinc-800 hover:text-white',
        className
      )}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  );
});
DropdownMenuItem.displayName = 'DropdownMenuItem';

// Export components
export { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger };