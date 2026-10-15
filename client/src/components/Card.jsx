export default function Card({ className = '', children, ...rest }) {
  return (
    <section
      className={`rounded-2xl border border-border bg-surface p-5 sm:p-6 ${className}`}
      {...rest}
    >
      {children}
    </section>
  )
}