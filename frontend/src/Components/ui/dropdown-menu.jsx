import * as React from "react";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";

export const DropdownMenu = DropdownMenuPrimitive.Root;
export const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;

export const DropdownMenuContent = React.forwardRef(
  ({ className = "", ...props }, ref) => (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        ref={ref}
        className={`z-[9999] min-w-[8rem] overflow-hidden rounded-xl border border-[var(--theme-border)] bg-[var(--theme-card)] backdrop-blur-xl p-2 text-[var(--theme-fg)] shadow-2xl animate-in fade-in-0 slide-in-from-top-2 ${className}`}
        sideOffset={8}
        alignOffset={-4}
        {...props}
      />
    </DropdownMenuPrimitive.Portal>
  )
);
DropdownMenuContent.displayName = "DropdownMenuContent";

export const DropdownMenuItem = React.forwardRef(
  ({ className = "", ...props }, ref) => (
    <DropdownMenuPrimitive.Item
      ref={ref}
      className={`cursor-pointer select-none rounded-lg px-3 py-2.5 text-sm text-[var(--theme-fg)] outline-none transition-all duration-200 hover:bg-[var(--theme-surface)] hover:text-[var(--theme-accent)] focus:bg-[var(--theme-surface)] focus:text-[var(--theme-accent)] active:bg-[var(--theme-surface)] active:scale-95 z-[9999] flex items-center gap-2 ${className}`}
      {...props}
    />
  )
);
DropdownMenuItem.displayName = "DropdownMenuItem";

export const DropdownMenuSeparator = React.forwardRef(
  ({ className = "", ...props }, ref) => (
    <DropdownMenuPrimitive.Separator
      ref={ref}
      className={`-mx-1 my-2 h-px bg-[var(--theme-border)] ${className}`}
      {...props}
    />
  )
);
DropdownMenuSeparator.displayName = "DropdownMenuSeparator";