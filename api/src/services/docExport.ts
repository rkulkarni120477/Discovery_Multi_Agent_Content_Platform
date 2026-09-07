import { Document, Packer, Paragraph, HeadingLevel } from "docx";
import type { FinalPackage, Scenario1FinalPackage, Scenario3FinalPackage } from "../types";

function section(title: string, body: string): Paragraph[] {
  return [
    new Paragraph({ text: title, heading: HeadingLevel.HEADING_1 }),
    ...body
      .split("\n")
      .filter((line) => line.trim().length > 0)
      .map((line) => new Paragraph(line)),
  ];
}

export async function buildFinalPackageDocx(pkg: FinalPackage): Promise<Buffer> {
  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({ text: "Scenario 2 — Final Revision Package", heading: HeadingLevel.TITLE }),
          new Paragraph(`Selected literacy strategy: ${pkg.selected_literacy_strategy}`),
          new Paragraph(`Original location: ${pkg.original_location}`),
          new Paragraph(`Reason for change: ${pkg.reason_for_change}`),
          new Paragraph(`Literacy benefit: ${pkg.literacy_benefit}`),
          new Paragraph(`Science-learning benefit: ${pkg.science_learning_benefit}`),
          new Paragraph(`Timing / instructional impact: ${pkg.timing_or_instructional_impact}`),
          ...section("Student-Facing Content", pkg.student_content),
          ...section("Teacher-Facing Content", pkg.teacher_content),
          ...section("Rationale", pkg.rationale_doc),
          ...section("Connected Updates", pkg.connected_updates.join("\n")),
        ],
      },
    ],
  });
  return Packer.toBuffer(doc);
}

export async function buildScenario1FinalPackageDocx(pkg: Scenario1FinalPackage): Promise<Buffer> {
  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({ text: "Scenario 1 — NGSS-to-State Standards Crosswalk", heading: HeadingLevel.TITLE }),
          new Paragraph(
            `Classification -- Strong: ${pkg.sc_codes_strong}, Partial: ${pkg.sc_codes_partial}, ` +
              `Gap: ${pkg.sc_codes_gap} (of ${pkg.sc_codes_total} total)`
          ),
          ...section("Summary", pkg.summary),
          ...section("Overall Notes", pkg.overall_notes),
          ...section("Out of Scope", pkg.out_of_scope_note),
          ...section("Final QA Review", JSON.stringify(pkg.final_qa_review, null, 2)),
          ...section("NGSS-to-SC Crosswalk", JSON.stringify(pkg.crosswalk, null, 2)),
          ...section("SC Standards Deltas", JSON.stringify(pkg.sc_deltas, null, 2)),
          ...section("Performance Target Map", JSON.stringify(pkg.performance_target_map, null, 2)),
          ...section("Grade-Level Depth Validation", JSON.stringify(pkg.grade_level_depth_validation, null, 2)),
          ...section("Alignment/Evidence Criteria", JSON.stringify(pkg.alignment_criteria, null, 2)),
          ...section("Evidence Review", JSON.stringify(pkg.evidence_review, null, 2)),
          ...section("Classification (Strong/Partial/Gap)", JSON.stringify(pkg.classification, null, 2)),
          ...section("Gap Analysis & Remediation", JSON.stringify(pkg.gap_analysis, null, 2)),
        ],
      },
    ],
  });
  return Packer.toBuffer(doc);
}

export async function buildScenario3FinalPackageDocx(pkg: Scenario3FinalPackage): Promise<Buffer> {
  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({ text: "Scenario 3 — Standards Alignment Package", heading: HeadingLevel.TITLE }),
          new Paragraph(`Grade: ${pkg.confirmed_grade}`),
          new Paragraph(
            `Standards addressed: ${pkg.oregon_standards_addressed} / ${pkg.total_oregon_standards}`
          ),
          new Paragraph(`Revisions made: ${pkg.revisions_made}`),
          ...section("Unit Summary", pkg.unit_summary),
          ...section("Remaining Gaps", pkg.remaining_gaps.join("\n") || "None"),
          ...section("Overall Notes", pkg.overall_notes),
          ...section("Updated Scope and Sequence", pkg.updated_scope_sequence),
          ...section("Rationale Entries", JSON.stringify(pkg.rationale_entries, null, 2)),
          ...section("Final Alignment Matrix", JSON.stringify(pkg.final_alignment_matrix, null, 2)),
        ],
      },
    ],
  });
  return Packer.toBuffer(doc);
}
