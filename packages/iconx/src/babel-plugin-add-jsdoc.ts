import type { PluginObj } from '@babel/core'

interface PluginOptions {
  iconName: string
  iconSetName: string
  iconSetPrefix: string
  iconSetLicense: string
  defaultSize: string | number
}

export default function babelPluginAddJSDoc(
  { types: t }: { types: any },
  options: PluginOptions,
): PluginObj {
  const { iconName, iconSetName, iconSetPrefix, iconSetLicense, defaultSize } =
    options

  // Generate JSDoc comment text (without the /** and */ wrapper, addComment adds those)
  const jsdocText = `*
 * ${iconName}
 * ${iconSetName}
 * @url https://icon-sets.iconify.design/${iconSetPrefix}
 * @license ${iconSetLicense}
 `

  return {
    name: 'add-jsdoc',
    visitor: {
      ExportNamedDeclaration(path) {
        // Check if this export is a variable declaration (export const ...)
        if (path.node.declaration?.type === 'VariableDeclaration') {
          // Check if we haven't already added a JSDoc comment
          const leadingComments = path.node.leadingComments
          if (
            !leadingComments?.some(
              (comment) =>
                comment.type === 'CommentBlock' &&
                comment.value.includes(iconName),
            )
          ) {
            // Add JSDoc comment before the export
            // The third parameter (false) means it's a block comment
            path.addComment('leading', jsdocText, false)
          }
        }
      },
      JSXOpeningElement(path) {
        // Ensure we're working on the root <svg> element
        if (
          path.node.name.type !== 'JSXIdentifier' ||
          path.node.name.name !== 'svg'
        ) {
          return
        }

        // Remove existing width/height attributes if present
        const attrs = path.node.attributes
        const filteredAttrs = attrs.filter((attr: any) => {
          // Keep non-attribute nodes (e.g. JSXSpreadAttribute)
          if (attr.type !== 'JSXAttribute') return true

          // Extra defensive guards – some nodes can be weirdly shaped
          if (!attr.name || attr.name.type !== 'JSXIdentifier') return true

          const attrName = attr.name.name
          return attrName !== 'width' && attrName !== 'height'
        })

        // Build `props.size == null ? DEFAULT : props.size`
        const sizeProp = t.memberExpression(
          t.identifier('props'),
          t.identifier('size'),
        )

        const defaultLiteral =
          typeof defaultSize === 'number'
            ? t.numericLiteral(defaultSize)
            : t.stringLiteral(String(defaultSize))

        const sizeExpr = t.logicalExpression('||', sizeProp, defaultLiteral)

        const widthAttr = t.jsxAttribute(
          t.jsxIdentifier('width'),
          t.jsxExpressionContainer(sizeExpr),
        )
        const heightAttr = t.jsxAttribute(
          t.jsxIdentifier('height'),
          t.jsxExpressionContainer(sizeExpr),
        )

        // Insert width/height just before any spread props, or at the end
        const spreadIndex = filteredAttrs.findIndex(
          (attr: any) => attr.type === 'JSXSpreadAttribute',
        )

        if (spreadIndex === -1) {
          filteredAttrs.push(widthAttr, heightAttr)
        } else {
          filteredAttrs.splice(spreadIndex, 0, widthAttr, heightAttr)
        }

        path.node.attributes = filteredAttrs
      },
    },
  }
}
