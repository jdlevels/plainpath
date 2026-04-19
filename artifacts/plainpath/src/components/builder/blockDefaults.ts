import type { KnownBlockType } from "@/lib/builderTypes";

export function getDefaultPayload(type: KnownBlockType): Record<string, unknown> {
  switch (type) {
    case "heading":
      return { text: "", level: 2 };
    case "paragraph":
      return { text: "", marks: [] };
    case "bullet-list":
      return { items: [""] };
    case "numbered-list":
      return { items: [""], start: 1 };
    case "checklist":
      return { items: [{ text: "", checked: false }] };
    case "key-value":
      return { pairs: [{ key: "", value: "" }], layout: "two-column" };
    case "divider":
      return { style: "line" };
    case "note":
      return { text: "", variant: "info" };
    case "table":
      return {
        columns: ["Column 1", "Column 2"],
        rows: [["", ""]],
        has_header_row: true,
      };
    default:
      return {};
  }
}
