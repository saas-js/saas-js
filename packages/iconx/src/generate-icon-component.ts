import { transform } from '@svgr/core'

import babelPluginAddJSDoc from './transformers/babel-plugin-add-jsdoc.ts'
import { prettierTransformer } from './transformers/prettier.ts'
import type { IconifyIcon, IconifyIconSet } from './types.ts'

export async function generateIconComponent(
  iconName: string,
  iconData: IconifyIcon,
  iconSet: IconifyIconSet,
  defaultWidth?: number,
  defaultHeight?: number,
  defaultSize: string | number = '1em',
): Promise<string> {
  const componentName =
    iconName
      .split('-')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join('') + 'Icon'

  const width = iconData.width || defaultWidth || 24
  const height = iconData.height || defaultHeight || 24
  const viewBox = iconData.viewBox || `0 0 ${width} ${height}`

  const template = (variables, { tpl }) => {
    const propsName = `${variables.componentName}Props`

    return tpl`
${variables.imports};

export interface ${propsName} extends SVGProps<SVGSVGElement> {
  size?: number | string;
}

export const ${variables.componentName} = (props: ${propsName}) => {
  return ${variables.jsx};
};
`
  }

  const svgCode = await transform(
    `<svg viewBox="${viewBox}" fill="none" xmlns="http://www.w3.org/2000/svg">${iconData.body}</svg>`,
    {
      plugins: ['@svgr/plugin-jsx'],
      typescript: true,
      exportType: 'named',
      template,
      jsx: {
        babelConfig: {
          plugins: [
            [
              babelPluginAddJSDoc,
              {
                iconName,
                iconSetName: iconSet.name,
                iconSetPrefix: iconSet.prefix,
                iconSetLicense: iconSet.license.title,
                defaultSize,
              },
            ],
          ],
        },
      },
    },
    {
      componentName,
    },
  )

  return prettierTransformer(svgCode)
}
