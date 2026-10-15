export default function SectionHeading({ children, action, tone = 'text-text' }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <h2 className={`font-pixel text-[11px] leading-relaxed ${tone}`}>
        {children}
      </h2>
      {action}
    </div>
  )
}