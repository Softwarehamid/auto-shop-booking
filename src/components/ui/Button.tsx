import React from "react";
import { clsx } from "clsx";
import { cva, type VariantProps } from "class-variance-authority";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-lg text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 !bg-blue-600 !text-white hover:!bg-blue-800 hover:!shadow-xl hover:!scale-110 hover:!brightness-110",
  {
    variants: {
      variant: {
        default: "",
        secondary: "!bg-gray-600 hover:!bg-gray-800",
        outline: "!bg-blue-600 hover:!bg-blue-800",
        ghost: "!bg-blue-600 hover:!bg-blue-800",
        destructive: "!bg-red-600 hover:!bg-red-800",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3 py-1.5",
        lg: "h-12 px-6 py-3",
        xl: "h-14 px-8 py-4 text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    return (
      <button
        className={clsx(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";

export { Button, buttonVariants };
