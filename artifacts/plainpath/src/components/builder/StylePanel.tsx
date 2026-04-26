import { useRef } from "react";
import { ImagePlus, X, AlignLeft, AlignCenter, AlignRight } from "lucide-react";
import type { BrandingState, HeaderStyle, LogoPosition } from "@/lib/builderTypes";

interface Props {
  branding: BrandingState;
  onChange: (b: BrandingState) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function set<K extends keyof BrandingState>(
  branding: BrandingState,
  onChange: (b: BrandingState) => void,
  key: K,
  value: BrandingState[K],
) {
  onChange({ ...branding, [key]: value });
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PRESET_COLORS = [
  "#1d4ed8", "#0f766e", "#7c3aed", "#b91c1c",
  "#d97706", "#16a34a", "#0e7490", "#374151",
];

const HEADER_STYLES: Array<{ value: HeaderStyle; label: string; desc: string }> = [
  { value: "minimal",  label: "Minimal",      desc: "Company name + thin accent line" },
  { value: "formal",   label: "Formal",        desc: "Full-width colored header block" },
  { value: "modern",   label: "Modern",        desc: "Left accent bar + company name" },
  { value: "internal", label: "Internal Use",  desc: "Gray header with internal badge" },
];

const LOGO_POSITIONS: Array<{ value: LogoPosition; icon: typeof AlignLeft; label: string }> = [
  { value: "left",   icon: AlignLeft,   label: "Left" },
  { value: "center", icon: AlignCenter, label: "Center" },
  { value: "right",  icon: AlignRight,  label: "Right" },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
      {children}
    </p>
  );
}

function GroupCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card px-4 py-4 space-y-3">
      {children}
    </div>
  );
}

function FieldRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-[11px] font-medium text-muted-foreground mb-1">
        {label}
      </label>
      {children}
    </div>
  );
}

function TextInput({
  value,
  onChange,
  placeholder,
  maxLength = 120,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  maxLength?: number;
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      maxLength={maxLength}
      className="w-full text-sm bg-background border border-border rounded-lg px-3 py-2 outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/20 transition-colors placeholder:text-muted-foreground/40"
    />
  );
}

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="w-full flex items-center justify-between gap-3 text-sm text-foreground"
    >
      <span>{label}</span>
      <div
        className={`relative w-9 h-5 rounded-full transition-colors shrink-0 ${
          checked ? "bg-primary" : "bg-border"
        }`}
      >
        <div
          className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
            checked ? "translate-x-4" : "translate-x-0.5"
          }`}
        />
      </div>
    </button>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

export function StylePanel({ branding, onChange }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      onChange({ ...branding, logoDataUrl: dataUrl });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  function removeLogo() {
    onChange({ ...branding, logoDataUrl: null });
  }

  function upd<K extends keyof BrandingState>(key: K, value: BrandingState[K]) {
    set(branding, onChange, key, value);
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-border/60 shrink-0">
        <p className="text-xs font-semibold text-foreground">Document Style</p>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          Branding changes reflect live in the preview. PDF/DOCX export with branding is coming soon.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
      <div className="max-w-[600px] space-y-5">

        {/* A. Company Identity */}
        <div>
          <SectionLabel>Company Identity</SectionLabel>
          <GroupCard>
            <FieldRow label="Company name">
              <TextInput
                value={branding.companyName}
                onChange={(v) => upd("companyName", v)}
                placeholder="Acme Corp"
                maxLength={80}
              />
            </FieldRow>
            <FieldRow label="Department / team">
              <TextInput
                value={branding.departmentName}
                onChange={(v) => upd("departmentName", v)}
                placeholder="e.g. Human Resources"
                maxLength={80}
              />
            </FieldRow>
            <FieldRow label="Document owner">
              <TextInput
                value={branding.documentOwner}
                onChange={(v) => upd("documentOwner", v)}
                placeholder="e.g. Jane Smith"
                maxLength={80}
              />
            </FieldRow>
            <FieldRow label="Approved by">
              <TextInput
                value={branding.approvedBy}
                onChange={(v) => upd("approvedBy", v)}
                placeholder="e.g. John Doe, VP Operations"
                maxLength={80}
              />
            </FieldRow>
            <FieldRow label="Review cycle">
              <TextInput
                value={branding.reviewCycle}
                onChange={(v) => upd("reviewCycle", v)}
                placeholder="e.g. Annually"
                maxLength={60}
              />
            </FieldRow>
          </GroupCard>
        </div>

        {/* B & C. Logo + Position */}
        <div>
          <SectionLabel>Logo</SectionLabel>
          <GroupCard>
            {branding.logoDataUrl ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-16 h-10 rounded-lg border border-border bg-background flex items-center justify-center overflow-hidden shrink-0">
                    <img
                      src={branding.logoDataUrl}
                      alt="Logo preview"
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground">Logo loaded</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Preview only — not saved to the server.</p>
                  </div>
                  <button
                    type="button"
                    onClick={removeLogo}
                    title="Remove logo"
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                {/* Position picker */}
                <div>
                  <p className="text-[11px] text-muted-foreground mb-2">Logo position</p>
                  <div className="flex gap-2">
                    {LOGO_POSITIONS.map(({ value, icon: Icon, label }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => upd("logoPosition", value)}
                        title={label}
                        className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-lg border text-[11px] transition-colors ${
                          branding.logoPosition === value
                            ? "border-primary bg-primary/8 text-primary"
                            : "border-border bg-background text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2.5 px-4 py-3 rounded-lg border border-dashed border-border hover:border-foreground/30 hover:bg-secondary/30 text-sm text-muted-foreground hover:text-foreground transition-all"
                >
                  <ImagePlus className="w-4 h-4 shrink-0" />
                  Upload logo
                </button>
                <p className="text-[11px] text-muted-foreground text-center">
                  Logo preview only — persistent logo storage coming soon.
                </p>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              className="hidden"
            />
          </GroupCard>
        </div>

        {/* D. Brand Color */}
        <div>
          <SectionLabel>Brand Color</SectionLabel>
          <GroupCard>
            <div className="flex flex-wrap gap-2 mb-2">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => upd("brandColor", color)}
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
                onChange={(e) => upd("brandColor", e.target.value)}
                className="w-8 h-8 rounded cursor-pointer border border-border bg-background p-0.5"
              />
              <input
                type="text"
                value={branding.brandColor}
                onChange={(e) => {
                  const val = e.target.value;
                  if (/^#[0-9a-fA-F]{0,6}$/.test(val)) upd("brandColor", val);
                }}
                maxLength={7}
                className="flex-1 text-sm bg-background border border-border rounded-lg px-3 py-1.5 outline-none focus:border-primary/60 font-mono"
              />
            </div>
            <p className="text-[11px] text-muted-foreground">
              Applies to section borders, headings, and accent lines in the preview.
            </p>
          </GroupCard>
        </div>

        {/* E. Header Style */}
        <div>
          <SectionLabel>Header Style</SectionLabel>
          <div className="space-y-1.5">
            {HEADER_STYLES.map(({ value, label, desc }) => (
              <button
                key={value}
                type="button"
                onClick={() => upd("headerStyle", value)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-colors ${
                  branding.headerStyle === value
                    ? "border-primary bg-primary/6 text-primary"
                    : "border-border bg-card text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                }`}
              >
                <div
                  className="w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center"
                  style={{
                    borderColor: branding.headerStyle === value ? branding.brandColor : undefined,
                  }}
                >
                  {branding.headerStyle === value && (
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: branding.brandColor }}
                    />
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

        {/* F. Footer */}
        <div>
          <SectionLabel>Footer</SectionLabel>
          <GroupCard>
            <FieldRow label="Footer text">
              <TextInput
                value={branding.footerText}
                onChange={(v) => upd("footerText", v)}
                placeholder="e.g. Confidential — Internal Use Only"
                maxLength={120}
              />
            </FieldRow>
            <div className="pt-1 space-y-3">
              <ToggleRow
                label="Show page number"
                checked={branding.showPageNumber}
                onChange={(v) => upd("showPageNumber", v)}
              />
              <ToggleRow
                label='Show "Confidential" badge'
                checked={branding.showConfidential}
                onChange={(v) => upd("showConfidential", v)}
              />
              <ToggleRow
                label="Show revision / date line"
                checked={branding.showRevisionLine}
                onChange={(v) => upd("showRevisionLine", v)}
              />
            </div>
          </GroupCard>
        </div>

        {/* G. Watermark */}
        <div>
          <SectionLabel>Watermark</SectionLabel>
          <GroupCard>
            <ToggleRow
              label="Confidential watermark"
              checked={branding.watermarkEnabled}
              onChange={(v) => upd("watermarkEnabled", v)}
            />
            {branding.watermarkEnabled && (
              <p className="text-[11px] text-muted-foreground">
                A light "CONFIDENTIAL" watermark appears diagonally across the document preview. It does not block readability.
              </p>
            )}
          </GroupCard>
        </div>

        {/* Persistence note */}
        <div className="rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 px-3 py-2.5">
          <p className="text-[11px] text-amber-800 dark:text-amber-400 leading-relaxed">
            Company identity, color, and footer settings are saved with the document. Logo is preview-only and is not stored between sessions. Branded PDF/DOCX export is coming soon.
          </p>
        </div>
      </div>
      </div>
    </div>
  );
}
