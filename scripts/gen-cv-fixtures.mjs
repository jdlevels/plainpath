/**
 * QA fixture generator -- Compare Versions positive-diff pair
 * Creates two minimal text-layer PDFs with known intentional diffs.
 *
 * Differences (original to revised):
 *   D1: Section 3 -- Monthly rent $1,450 to $1,650
 *   D2: Section 2 -- Lease end date June 30, 2025 to June 30, 2026
 *   D3: Section 5 -- Late-fee grace period five (5) to three (3) days
 *   D4: Section 4 -- Parking clause added (2 new lines)
 *   D5: Section 7 -- Penalty "two months" to "sixty (60) days"
 *
 * Output: qa/fixtures/compare-versions/lease_original.pdf
 *         qa/fixtures/compare-versions/lease_revised.pdf
 */

import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { writeFileSync, mkdirSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, "../qa/fixtures/compare-versions");
mkdirSync(OUT_DIR, { recursive: true });

async function buildPdf(lines) {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const W = 612;
  const H = 792;
  const MARGIN = 60;
  const LINE_HEIGHT = 16;
  const WRAP_WIDTH = W - MARGIN * 2;

  let page = pdfDoc.addPage([W, H]);
  let y = H - MARGIN;

  function wrapLine(text, maxWidth, f, size) {
    const words = text.split(" ");
    const wrapped = [];
    let current = "";
    for (const w of words) {
      const test = current ? current + " " + w : w;
      if (f.widthOfTextAtSize(test, size) > maxWidth && current) {
        wrapped.push(current);
        current = w;
      } else {
        current = test;
      }
    }
    if (current) wrapped.push(current);
    return wrapped;
  }

  function drawText(text, opts) {
    const size = (opts && opts.size) || 10;
    const useBold = (opts && opts.bold) || false;
    const indent = (opts && opts.indent) || 0;
    const spaceBefore = (opts && opts.spaceBefore) || 0;
    const spaceAfter = (opts && opts.spaceAfter) || 0;
    const f = useBold ? bold : font;
    if (spaceBefore) y -= spaceBefore;
    const subLines = wrapLine(text, WRAP_WIDTH - indent, f, size);
    for (const sl of subLines) {
      if (y < MARGIN + LINE_HEIGHT) {
        page = pdfDoc.addPage([W, H]);
        y = H - MARGIN;
      }
      page.drawText(sl, { x: MARGIN + indent, y, size, font: f, color: rgb(0, 0, 0) });
      y -= LINE_HEIGHT;
    }
    if (spaceAfter) y -= spaceAfter;
  }

  for (const line of lines) {
    if (line === null) { y -= LINE_HEIGHT; continue; }
    if (typeof line === "string") {
      drawText(line, {});
    } else {
      drawText(line.text, line);
    }
  }

  return pdfDoc.save();
}

const TITLE = { text: "RESIDENTIAL LEASE AGREEMENT", bold: true, size: 14, spaceBefore: 0, spaceAfter: 6 };
function SUB(t) { return { text: t, bold: true, size: 11, spaceBefore: 10, spaceAfter: 4 }; }
function BODY(t, indent) { return { text: t, size: 10, indent: indent || 0, spaceAfter: 2 }; }

function originalLines() {
  return [
    TITLE,
    BODY("This Residential Lease Agreement is entered into as of January 1, 2025, by and between"),
    BODY("Landlord: Greenfield Properties LLC, and Tenant: Jordan M. Carter."),
    null,
    SUB("Section 1. Premises"),
    BODY("Landlord hereby leases to Tenant the property located at 412 Maple Street, Apt 3B, Springfield, IL 62701"),
    BODY("for residential use only."),
    null,
    SUB("Section 2. Term"),
    BODY("The lease term shall commence on January 1, 2025, and shall expire on June 30, 2025, unless sooner"),
    BODY("terminated in accordance with the provisions of this Agreement."),
    null,
    SUB("Section 3. Rent"),
    BODY("Tenant agrees to pay Landlord a monthly rent of $1,450.00 (one thousand four hundred fifty dollars), due"),
    BODY("on the first (1st) day of each calendar month. Rent shall be paid by check or electronic transfer to"),
    BODY("Landlord at the address specified in Section 10."),
    null,
    SUB("Section 4. Security Deposit"),
    BODY("Tenant shall deposit with Landlord the sum of $2,900.00 (two thousand nine hundred dollars) as a security"),
    BODY("deposit prior to occupancy. The security deposit shall be held in a separate non-interest-bearing account."),
    null,
    SUB("Section 5. Late Fees"),
    BODY("If Tenant fails to pay rent within five (5) days after the due date, Tenant shall pay a late fee of $75.00."),
    BODY("Repeated late payments may be grounds for termination of this Agreement."),
    null,
    SUB("Section 6. Utilities"),
    BODY("Tenant is responsible for payment of all utilities, including electricity, gas, water, and internet service,"),
    BODY("unless otherwise specified by Landlord in a separate written addendum."),
    null,
    SUB("Section 7. Early Termination"),
    BODY("Should Tenant vacate the Premises prior to the expiration of the lease term, Tenant shall be liable for"),
    BODY("a termination penalty equal to two months of rent, in addition to forfeiture of the security deposit, unless"),
    BODY("the Landlord is able to re-let the Premises within thirty (30) days."),
    null,
    SUB("Section 8. Maintenance and Repairs"),
    BODY("Tenant shall keep the Premises in clean and sanitary condition. Tenant shall promptly notify Landlord of"),
    BODY("any damage, defect, or dangerous condition. Landlord shall be responsible for structural repairs."),
    null,
    SUB("Section 9. Rules and Restrictions"),
    BODY("No pets are permitted without prior written consent of Landlord. Smoking is prohibited within the Premises"),
    BODY("or within ten (10) feet of any building entrance. Tenant shall comply with all applicable HOA rules."),
    null,
    SUB("Section 10. Notices"),
    BODY("All notices shall be in writing and delivered by certified mail or personal delivery to:"),
    BODY("Landlord: Greenfield Properties LLC, 500 Commerce Drive, Suite 200, Springfield, IL 62701.", 20),
    BODY("Tenant: at the Premises address above.", 20),
    null,
    SUB("Section 11. Governing Law"),
    BODY("This Agreement shall be governed by the laws of the State of Illinois. Any disputes arising under this"),
    BODY("Agreement shall be resolved in the courts of Sangamon County, Illinois."),
    null,
    SUB("Section 12. Entire Agreement"),
    BODY("This Agreement constitutes the entire agreement between the parties and supersedes all prior negotiations,"),
    BODY("representations, warranties, and understandings of the parties. Modifications must be in writing."),
    null,
    { text: "IN WITNESS WHEREOF the parties have executed this Agreement as of the date first written above.", size: 10, spaceBefore: 10 },
    null,
    BODY("Landlord Signature: ___________________________   Date: ____________"),
    BODY("Tenant Signature:   ___________________________   Date: ____________"),
  ];
}

function revisedLines() {
  return [
    TITLE,
    BODY("This Residential Lease Agreement is entered into as of January 1, 2025, by and between"),
    BODY("Landlord: Greenfield Properties LLC, and Tenant: Jordan M. Carter."),
    null,
    SUB("Section 1. Premises"),
    BODY("Landlord hereby leases to Tenant the property located at 412 Maple Street, Apt 3B, Springfield, IL 62701"),
    BODY("for residential use only."),
    null,
    SUB("Section 2. Term"),
    // D2: end date changed 2025 to 2026
    BODY("The lease term shall commence on January 1, 2025, and shall expire on June 30, 2026, unless sooner"),
    BODY("terminated in accordance with the provisions of this Agreement."),
    null,
    SUB("Section 3. Rent"),
    // D1: rent changed $1,450 to $1,650
    BODY("Tenant agrees to pay Landlord a monthly rent of $1,650.00 (one thousand six hundred fifty dollars), due"),
    BODY("on the first (1st) day of each calendar month. Rent shall be paid by check or electronic transfer to"),
    BODY("Landlord at the address specified in Section 10."),
    null,
    SUB("Section 4. Security Deposit"),
    BODY("Tenant shall deposit with Landlord the sum of $2,900.00 (two thousand nine hundred dollars) as a security"),
    BODY("deposit prior to occupancy. The security deposit shall be held in a separate non-interest-bearing account."),
    // D4: new parking clause
    BODY("Tenant is assigned one (1) designated parking space at no additional charge. Additional vehicles require"),
    BODY("prior written approval from Landlord."),
    null,
    SUB("Section 5. Late Fees"),
    // D3: grace period five (5) to three (3)
    BODY("If Tenant fails to pay rent within three (3) days after the due date, Tenant shall pay a late fee of $75.00."),
    BODY("Repeated late payments may be grounds for termination of this Agreement."),
    null,
    SUB("Section 6. Utilities"),
    BODY("Tenant is responsible for payment of all utilities, including electricity, gas, water, and internet service,"),
    BODY("unless otherwise specified by Landlord in a separate written addendum."),
    null,
    SUB("Section 7. Early Termination"),
    // D5: "two months" to "sixty (60) days"
    BODY("Should Tenant vacate the Premises prior to the expiration of the lease term, Tenant shall be liable for"),
    BODY("a termination penalty equal to sixty (60) days of rent, in addition to forfeiture of the security deposit, unless"),
    BODY("the Landlord is able to re-let the Premises within thirty (30) days."),
    null,
    SUB("Section 8. Maintenance and Repairs"),
    BODY("Tenant shall keep the Premises in clean and sanitary condition. Tenant shall promptly notify Landlord of"),
    BODY("any damage, defect, or dangerous condition. Landlord shall be responsible for structural repairs."),
    null,
    SUB("Section 9. Rules and Restrictions"),
    BODY("No pets are permitted without prior written consent of Landlord. Smoking is prohibited within the Premises"),
    BODY("or within ten (10) feet of any building entrance. Tenant shall comply with all applicable HOA rules."),
    null,
    SUB("Section 10. Notices"),
    BODY("All notices shall be in writing and delivered by certified mail or personal delivery to:"),
    BODY("Landlord: Greenfield Properties LLC, 500 Commerce Drive, Suite 200, Springfield, IL 62701.", 20),
    BODY("Tenant: at the Premises address above.", 20),
    null,
    SUB("Section 11. Governing Law"),
    BODY("This Agreement shall be governed by the laws of the State of Illinois. Any disputes arising under this"),
    BODY("Agreement shall be resolved in the courts of Sangamon County, Illinois."),
    null,
    SUB("Section 12. Entire Agreement"),
    BODY("This Agreement constitutes the entire agreement between the parties and supersedes all prior negotiations,"),
    BODY("representations, warranties, and understandings of the parties. Modifications must be in writing."),
    null,
    { text: "IN WITNESS WHEREOF the parties have executed this Agreement as of the date first written above.", size: 10, spaceBefore: 10 },
    null,
    BODY("Landlord Signature: ___________________________   Date: ____________"),
    BODY("Tenant Signature:   ___________________________   Date: ____________"),
  ];
}

const origBytes = await buildPdf(originalLines());
const revBytes  = await buildPdf(revisedLines());

writeFileSync(path.join(OUT_DIR, "lease_original.pdf"), origBytes);
writeFileSync(path.join(OUT_DIR, "lease_revised.pdf"), revBytes);

console.log("Generated qa/fixtures/compare-versions/lease_original.pdf");
console.log("Generated qa/fixtures/compare-versions/lease_revised.pdf");
console.log("");
console.log("Intentional diffs:");
console.log("  D1: Section 3 -- rent $1,450 to $1,650");
console.log("  D2: Section 2 -- end date June 30, 2025 to June 30, 2026");
console.log("  D3: Section 5 -- late fee grace period five (5) to three (3) days");
console.log("  D4: Section 4 -- parking clause added (2 new lines)");
console.log("  D5: Section 7 -- penalty 'two months' to 'sixty (60) days'");
