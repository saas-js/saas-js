import type { ComponentProps } from 'react'

import { ark } from '@ark-ui/react/factory'

import { styled } from '#styled-system/jsx'
import { button } from '#styled-system/recipes'

export const Button = styled(ark.button, button)
export interface ButtonProps extends ComponentProps<typeof Button> {}
