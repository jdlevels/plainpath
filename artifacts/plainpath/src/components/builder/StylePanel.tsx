interface BrandingState {
  companyName: string;
  brandColor: string;
  headerStyle: "minimal" | "banner" | "classic";
  footerText: string;
}

interface Props {
  branding: BrandingState;
  onChange: (b: BrandingState) => void;
}

const HEADER_STYLES: Array<{ value: BrandingState["headerStyle"]; label: string; desc: string }> = [
  { value: "minimal", label: "Minimal",  desc: "Company name only" },
  { value: "banner",  label: "Banner",   desc: "Full-width colored header" },
  { value: "classic", label: "Classic",  desc: "Name + accent line" },
];

const PRESET_COLORS = [
  "#1d4ed8", "#0f766e", "#7c3aed", "#b91c1c",
  "#d97706", "#16a34a", "#0e7490", "#374151",
];

export function StylePanel({ branding, onChange }: Props) {
  function set<K extends keyof BrandingState>(key: K, value: BrandingState[K]) {
    onChange({ ...branding, [key]: value });
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="px-4 pt-4 pb-3 border-b border-border/60">
        <p className="text-xs font-semibold text-foreground">Document Style</p>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          Branding is preview-only for now. Export with styles is coming soon.
        </p>
      </div>

      <div className="px-4 py-4 space-y-5">
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">
            Company name
          </label>
          <input
            type="text"
            value={branding.companyName}
            onChange={(e) => set("companyName", e.target.value)}
            placeholder="Your company name"
            maxLength={80}
            className="w-full text-sm bg-background border border-border rounded-lg px-3 py-2 outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/20 transition-colors placeholder:text-muted-foreground/40"
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">
            Brand color
          </label>
          <div className="flex flex-wrap gap-2 mb-2">
            {PRESET_COLORS.map((color) => (
              <button
                key={color}
                onClick={() => set("brandColor", color)}
                title={color}
                className={`w-7 h-7 rounded-full border-2 transition-all ${
                  branding.brandColor === color
                    ? "border-foreground scale-110 shadow-sm"
                    : "border-transparent hover:border-foreground/40"
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={branding.brandColor}
              onChange={(e) => set("brandColor", e.target.value)}
              className="w-8 h-8 rounded cursor-pointer border border-border bg-background p-0.5"
            />
            <input
              type="text"
              value={branding.brandColor}
              onChange={(e) => {
                const val = e.target.value;
                if (/^#[0-9a-fA-F]{0,6}$/.test(val)) set("brandColor", val);
              }}
              maxLength={7}
              className="flex-1 text-sm bg-background border border-border rounded-lg px-3 py-1.5 outline-none focus:border-primary/60 font-mono"
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">
            Header style
          </label>
          <div className="space-y-1.5">
            {HEADER_STYLES.map(({ value, label, desc }) => (
              <button
                key={value}
                onClick={() => set("headerStyle", value)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-colors ${
                  branding.headerStyle === value
                    ? "border-primary bg-primary/6 text-primary"
                    : "border-border bg-card text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                }`}
              >
                <div
                  className="w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center"
                  style={{ borderColor: branding.headerStyle === value ? branding.brandColor : undefined }}
                >
                  {branding.headerStyle === value && (
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: branding.brandColor }} />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium leading-tight">{label}</p>
                  <p className="text-[11px] opacity-70 mt-0.5">{desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">
            Footer text
          </label>
          <input
            type="text"
            value={branding.footerText}
            onChange={(e) => set("footerText", e.target.value)}
            placeholder="e.g. Confidential — Internal Use Only"
            maxLength={120}
            className="w-full text-sm bg-background border border-border rounded-lg px-3 py-2 outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/20 transition-colors placeholder:text-muted-foreground/40"
          />
        </div>

        <div className="rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 px-3 py-2.5">
          <p className="text-[11px] text-amber-800 dark:text-amber-400 leading-relaxed">
            Style settings are stored locally. Branded export (PDF/DOCX with your logo and colors) is coming in a future update.
          </p>
        </div>
      </div>
    </div>
  );
}
