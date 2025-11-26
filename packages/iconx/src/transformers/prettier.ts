import * as prettier from 'prettier'

export function prettierTransformer(code: string) {
  return prettier.format(code, {
    parser: 'typescript',
  })
}
