// File: /src/components/RichText.tsx

import {
  DefaultNodeTypes,
  SerializedBlockNode,
  type DefaultTypedEditorState,
} from '@payloadcms/richtext-lexical'
import {
  JSXConvertersFunction,
  RichText as ConvertRichText,
} from '@payloadcms/richtext-lexical/react'
import { cn } from '../lib/utils'
import { Media } from '../payload-types'

// You can add your custom block types here if you have any
type NodeTypes =
  | DefaultNodeTypes
  | SerializedBlockNode<{
      blockType: 'upload'
      value: Media
      fields: any
    }>

const jsxConverters: JSXConvertersFunction<NodeTypes> = ({ defaultConverters }) => ({
  ...defaultConverters,
  // You can add custom converters for your blocks here if needed
  // For now, the default converters will handle headings, lists, etc.
})

type Props = {
  data: DefaultTypedEditorState
  enableGutter?: boolean
  className?: string
} & React.HTMLAttributes<HTMLDivElement>

export default function RichText({ className, data, enableGutter = true }: Props) {
  return (
    <ConvertRichText
      converters={jsxConverters}
      data={data}
      className={cn(
        'prose prose-slate max-w-none dark:prose-invert',
        {
          container: enableGutter,
        },
        className,
      )}
    />
  )
}
