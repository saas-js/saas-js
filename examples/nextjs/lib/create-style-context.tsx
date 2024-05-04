import {
  type ComponentProps,
  type ElementType,
  type JSX,
  createContext,
  createElement,
  forwardRef,
  useContext,
} from 'react'

const splitProps = (props: Record<string, unknown>, splitProps: string[]) => {
  const otherProps: Record<string, any> = {}
  const variantProps: Record<string, any> = {}
  for (const key in props) {
    if (splitProps.includes(key)) {
      variantProps[key] = props[key]
    } else {
      otherProps[key] = props[key]
    }
  }
  return [otherProps, variantProps]
}

type GenericProps = Record<string, unknown>
type StyleRecipe = {
  (props?: GenericProps): Record<string, string>
  variantKeys: string[]
}
type StyleSlot<R extends StyleRecipe> = keyof ReturnType<R>
type StyleSlotRecipe<R extends StyleRecipe> = Record<StyleSlot<R>, string>
type StyleVariantProps<R extends StyleRecipe> = Parameters<R>[0]
type CombineProps<T, U> = Omit<T, keyof U> & U

const cx = (...args: (string | undefined)[]) => args.filter(Boolean).join(' ')

export interface ComponentVariants<
  T extends ElementType,
  R extends StyleRecipe,
> {
  (props: CombineProps<ComponentProps<T>, StyleVariantProps<R>>): JSX.Element
}

export const createStyleContext = <R extends StyleRecipe>(recipe: R) => {
  const StyleContext = createContext<StyleSlotRecipe<R> | null>(null)

  const withProvider = <T extends ElementType>(
    Component: T,
    slot?: StyleSlot<R>,
  ): ComponentVariants<T, R> => {
    const StyledComponent = forwardRef((props: ComponentProps<T>, ref) => {
      const [otherProps, variantProps] = splitProps(props, recipe.variantKeys)
      const slotStyles = recipe(variantProps) as StyleSlotRecipe<R>
      return (
        <StyleContext.Provider value={slotStyles}>
          <Component
            ref={ref}
            {...otherProps}
            className={cx(slotStyles[slot ?? ''], otherProps.className)}
          />
        </StyleContext.Provider>
      )
    })

    StyledComponent.displayName = `StyledComponentProvider`

    return StyledComponent as unknown as ComponentVariants<T, R>
  }

  const withContext = <T extends ElementType>(
    Component: T,
    slot?: StyleSlot<R>,
  ): T => {
    if (!slot) return Component
    const StyledComponent = forwardRef((props: ComponentProps<T>, ref) => {
      const slotStyles = useContext(StyleContext)
      return createElement(Component, {
        ...props,
        className: cx(slotStyles?.[slot ?? ''], props.className),
        ref,
      })
    })
    StyledComponent.displayName = `StyledComponentConsumer`
    return StyledComponent as unknown as T
  }

  return {
    withProvider,
    withContext,
  }
}
