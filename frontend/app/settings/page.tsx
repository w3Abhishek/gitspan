import { Shell } from '@/components/layout/shell'

export default function SettingsPage() {
  return (
    <Shell>
      <div className="space-y-5 max-w-lg">
        <p className="text-[11px] font-mono text-muted-foreground uppercase tracking-widest px-0.5">
          settings
        </p>
        <div className="flex flex-col rounded-md overflow-hidden border border-border divide-y divide-border">
          <SettingRow label="sync interval" value="5 minutes" />
          <SettingRow label="retry attempts" value="3" />
          <SettingRow label="database" value="sqlite (self-hosted)" />
          <SettingRow label="version" value="v0.1.0" />
        </div>
      </div>
    </Shell>
  )
}

function SettingRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between bg-card px-4 py-2.5">
      <span className="font-mono text-[12px] text-muted-foreground">{label}</span>
      <span className="font-mono text-[12px] text-card-foreground">{value}</span>
    </div>
  )
}
