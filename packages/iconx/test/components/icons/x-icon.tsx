import * as React from "react";
import type { SVGProps } from "react";
export interface XIconProps extends SVGProps<SVGSVGElement> {
  size?: number | string;
}
/**
 * x
 * Lucide
 * @url https://icon-sets.iconify.design/lucide
 * @license ISC
 */
export const XIcon = (props: XIconProps) => {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      width={props.size || "1em"}
      height={props.size || "1em"}
      {...props}
    >
      <path
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M18 6L6 18M6 6l12 12"
      />
    </svg>
  );
};
