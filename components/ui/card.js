export function Card({ children, className }) {
  return <div className={`rounded shadow ${className}`}>{children}</div>;
}
export function CardContent({ children, className }) {
  return <div className={className}>{children}</div>;
}