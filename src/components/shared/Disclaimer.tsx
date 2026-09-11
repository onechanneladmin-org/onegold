export function ComplianceNote({ className }: { className?: string }) {
  return (
    <p className={className ?? "text-xs text-muted-foreground"}>
      Requires operator / advisor review. OneGold does not certify legal or Shariah compliance.
    </p>
  )
}
