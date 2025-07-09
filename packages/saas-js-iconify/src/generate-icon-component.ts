import type { IconifyIcon, IconifyIconSet } from './types.ts'

export function generateIconComponent(
  iconName: string,
  iconData: IconifyIcon,
  iconSet: IconifyIconSet,
  defaultWidth?: number,
  defaultHeight?: number,
  defaultSize: string | number = "1em",
): string {
  const componentName = iconName
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('')

  const width = iconData.width || defaultWidth || 24
  const height = iconData.height || defaultHeight || 24
  const viewBox = iconData.viewBox || `0 0 ${width} ${height}`

  return `import React from 'react';

export interface ${componentName}IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
}

/**
 * ${iconName}
 * ${iconSet.name}
 * @url https://icon-sets.iconify.design/${iconSet.prefix}
 * @license ${iconSet.license.title}
 */
export const ${componentName}Icon: React.FC<${componentName}IconProps> = ({ 
  size = ${JSON.stringify(defaultSize)}, 
  ...props 
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="${viewBox}"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      ${iconData.body}
    </svg>
  );
};
`
}
