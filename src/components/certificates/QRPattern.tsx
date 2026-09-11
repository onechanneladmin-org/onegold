function hash(value: string): number[] {
  const cells: number[] = []
  let h = 0
  for (let i = 0; i < 49; i += 1) {
    h = (h * 31 + value.charCodeAt(i % value.length) + i * 17) % 97
    cells.push(h)
  }
  return cells
}

export function QRPattern({ value }: { value: string }) {
  const cells = hash(value)
  return (
    <div className="rounded-lg border border-gold/30 bg-background p-2">
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((n, i) => (
          <div key={i} className={n % 3 === 0 ? "h-2.5 w-2.5 bg-foreground" : "h-2.5 w-2.5 bg-foreground/15"} />
        ))}
      </div>
    </div>
  )
}
