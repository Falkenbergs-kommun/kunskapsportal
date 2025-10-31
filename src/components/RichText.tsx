// File: /src/components/RichText.tsx

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkBreaks from 'remark-breaks'
import rehypeRaw from 'rehype-raw'
import { cn } from '../lib/utils'

type Props = {
  data: string
  enableGutter?: boolean
  className?: string
} & React.HTMLAttributes<HTMLDivElement>

export default function RichText({ className, data, enableGutter = true }: Props) {
  return (
    <div
      className={cn(
        'prose prose-slate max-w-none dark:prose-invert',
        {
          container: enableGutter,
        },
        className,
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        rehypePlugins={[rehypeRaw]}
        components={{
          // Custom renderers for specific elements if needed
          a: ({ node, ...props }) => <a {...props} target="_blank" rel="noopener noreferrer" />,
        }}
      >
        {data || ''}
      </ReactMarkdown>
    </div>
  )
}
