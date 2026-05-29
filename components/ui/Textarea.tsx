import { TextareaHTMLAttributes } from 'react'

interface Props extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export default function Textarea({ label, error, maxLength, value, className = '', ...props }: Props) {
  const current = typeof value === 'string' ? value.length : 0

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        {label && <label className="text-sm font-medium text-muted">{label}</label>}
        {maxLength && (
          <span className="text-xs tabular-nums text-faded">
            {current}/{maxLength}
          </span>
        )}
      </div>
      <textarea
        maxLength={maxLength}
        value={value}
        className={`rounded-lg border border-border bg-surface px-3 py-2 text-sm text-white placeholder:text-faded resize-none outline-none transition focus:ring-2 focus:ring-brand focus:border-brand ${
          error ? 'border-red-500' : 'border-border'
        } ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}
