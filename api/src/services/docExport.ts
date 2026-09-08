import ExcelJS from "exceljs";
import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  Packer,
  PageBreak,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableLayoutType,
  TableRow,
  TextRun,
  VerticalAlignTable,
  WidthType,
} from "docx";
import type { FinalPackage, Scenario1FinalPackage, Scenario3FinalPackage } from "../types";

type DocxBlock = Paragraph | Table;

function section(title: string, body: string): DocxBlock[] {
  return [
    new Paragraph({
      text: title,
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 240, after: 120 },
      thematicBreak: true,
    }),
    ...body
      .split("\n")
      .filter((line) => line.trim().length > 0)
      .map((line) => new Paragraph({ text: line, spacing: { after: 100, line: 276 } })),
  ];
}

function reportTitle(title: string, subtitle: string): Paragraph[] {
  return [
    new Paragraph({
      text: "DISCOVERY EDUCATION",
      spacing: { after: 80 },
      children: [new TextRun({ text: "DISCOVERY EDUCATION", bold: true, color: "C2410C", size: 20 })],
    }),
    new Paragraph({
      text: title,
      heading: HeadingLevel.TITLE,
      spacing: { after: 120 },
      children: [new TextRun({ text: title, bold: true, color: "7C2D12", size: 34 })],
    }),
    new Paragraph({
      text: subtitle,
      spacing: { after: 280 },
      children: [new TextRun({ text: subtitle, color: "57534E", italics: true, size: 20 })],
    }),
  ];
}

function displayValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function readableHeader(value: string): string {
  return value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function sortDocxRows(rows: string[][]): string[][] {
  return rows.slice().sort((left, right) =>
    (left[0] || "").localeCompare(right[0] || "", undefined, { numeric: true, sensitivity: "base" })
  );
}

function tableColumnWidths(columnCount: number): number[] {
  if (columnCount <= 1) return [9000];
  const firstColumn = columnCount === 2 ? 2200 : 1700;
  const remaining = Math.floor((9000 - firstColumn) / (columnCount - 1));
  return [firstColumn, ...Array.from({ length: columnCount - 1 }, () => remaining)];
}

function valueTable(title: string, entries: Array<[string, unknown]>): DocxBlock[] {
  return jsonTableSection(title, Object.fromEntries(entries));
}

function jsonTableSection(title: string, value: unknown): DocxBlock[] {
  let headers: string[];
  let rows: string[][];
  if (Array.isArray(value) && value.length > 0 && value.every((item) => item && typeof item === "object" && !Array.isArray(item))) {
    headers = Array.from(new Set(value.flatMap((item) => Object.keys(item as Record<string, unknown>))));
    rows = value.map((item) => headers.map((key) => displayValue((item as Record<string, unknown>)[key])));
  } else if (Array.isArray(value)) {
    headers = ["Value"];
    rows = value.map((item) => [displayValue(item)]);
  } else if (value && typeof value === "object") {
    headers = ["Field", "Value"];
    rows = Object.entries(value as Record<string, unknown>).map(([key, item]) => [key, displayValue(item)]);
  } else {
    headers = ["Value"];
    rows = [[displayValue(value)]];
  }

  const sortedRows = sortDocxRows(rows);
  const columnWidths = tableColumnWidths(headers.length);
  const tableBorders = {
    top: { style: BorderStyle.SINGLE, size: 4, color: "D6D3D1" },
    bottom: { style: BorderStyle.SINGLE, size: 4, color: "D6D3D1" },
    left: { style: BorderStyle.SINGLE, size: 4, color: "D6D3D1" },
    right: { style: BorderStyle.SINGLE, size: 4, color: "D6D3D1" },
    insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: "D6D3D1" },
    insideVertical: { style: BorderStyle.SINGLE, size: 4, color: "D6D3D1" },
  };
  const tableRows = [
    new TableRow({
      tableHeader: true,
      cantSplit: true,
      children: headers.map(
        (header, index) =>
          new TableCell({
            width: { size: columnWidths[index], type: WidthType.DXA },
            shading: { type: ShadingType.CLEAR, fill: "F97316" },
            verticalAlign: VerticalAlignTable.CENTER,
            margins: { top: 100, bottom: 100, left: 120, right: 120 },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: readableHeader(header), bold: true, color: "FFFFFF", size: 18 })],
              }),
            ],
          })
      ),
    }),
    ...sortedRows.map(
      (row) =>
        new TableRow({
          cantSplit: true,
          children: row.map(
            (cell, index) =>
              new TableCell({
                width: { size: columnWidths[index], type: WidthType.DXA },
                verticalAlign: VerticalAlignTable.TOP,
                margins: { top: 100, bottom: 100, left: 120, right: 120 },
                children: [
                  new Paragraph({
                    alignment: index === 0 && headers.length > 1 ? AlignmentType.LEFT : AlignmentType.LEFT,
                    spacing: { after: 0 },
                    children: [new TextRun({ text: displayValue(cell), size: 18 })],
                  }),
                ],
              })
          ),
        })
    ),
  ];

  return [
    new Paragraph({ text: title, heading: HeadingLevel.HEADING_1 }),
    new Table({
      rows: tableRows,
      width: { size: 9000, type: WidthType.DXA },
      columnWidths,
      layout: TableLayoutType.FIXED,
      borders: tableBorders,
      margins: { top: 80, bottom: 80, left: 100, right: 100 },
    }),
  ];
}

function jsonBlocks(title: string, value: unknown): DocxBlock[] {
  return jsonTableSection(title, value);
}

function sheetName(name: string, usedNames: Set<string>): string {
  const base = name.replace(/[\\/?*:[\]]/g, " ").trim().slice(0, 31) || "Section";
  let result = base;
  let suffix = 2;
  while (usedNames.has(result)) {
    result = `${base.slice(0, 31 - String(suffix).length - 1)}_${suffix}`;
    suffix += 1;
  }
  usedNames.add(result);
  return result;
}

const headerFill = "F97316";
const headerFont = { bold: true, color: { argb: "FFFFFFFF" } };
const cellBorder = {
  top: { style: "thin", color: { argb: "FFD6D3D1" } },
  left: { style: "thin", color: { argb: "FFD6D3D1" } },
  bottom: { style: "thin", color: { argb: "FFD6D3D1" } },
  right: { style: "thin", color: { argb: "FFD6D3D1" } },
} as const;

function sortRows(rows: string[][]): string[][] {
  return rows.slice().sort((left, right) =>
    (left[0] || "").localeCompare(right[0] || "", undefined, { numeric: true, sensitivity: "base" })
  );
}

function formatWorksheet(worksheet: ExcelJS.Worksheet, rows: string[][]): void {
  worksheet.addRows(rows);
  worksheet.views = [{ state: "frozen", ySplit: 1 }];
  worksheet.autoFilter = {
    from: "A1",
    to: { row: Math.max(rows.length, 1), column: Math.max(rows[0]?.length || 1, 1) },
  };

  const headerRow = worksheet.getRow(1);
  headerRow.height = 24;
  headerRow.font = headerFont;
  headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: headerFill } };
  headerRow.alignment = { vertical: "middle", horizontal: "center", wrapText: true };

  worksheet.eachRow((row, rowNumber) => {
    row.height = rowNumber === 1 ? 24 : 42;
    row.eachCell({ includeEmpty: true }, (cell) => {
      cell.border = cellBorder;
      cell.alignment = { vertical: "top", wrapText: true };
      if (rowNumber > 1 && rowNumber % 2 === 0) {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFF7ED" } };
      }
    });
  });

  worksheet.columns.forEach((column) => {
    const values = (column.values || []).slice(1).map((value) => displayValue(value));
    const longest = Math.max(column.header ? String(column.header).length : 0, ...values.map((value) => value.length));
    column.width = Math.min(Math.max(longest + 2, 14), 42);
  });
}

function addJsonWorksheet(workbook: ExcelJS.Workbook, title: string, value: unknown, usedNames: Set<string>): void {
  const worksheet = workbook.addWorksheet(sheetName(title, usedNames));
  let headers: string[];
  let dataRows: string[][];
  if (Array.isArray(value) && value.length > 0 && value.every((item) => item && typeof item === "object" && !Array.isArray(item))) {
    headers = Array.from(new Set(value.flatMap((item) => Object.keys(item as Record<string, unknown>))));
    dataRows = value.map((item) => headers.map((key) => displayValue((item as Record<string, unknown>)[key])));
  } else if (Array.isArray(value)) {
    headers = ["Value"];
    dataRows = value.map((item) => [displayValue(item)]);
  } else if (value && typeof value === "object") {
    headers = ["Field", "Value"];
    dataRows = Object.entries(value as Record<string, unknown>).map(([key, item]) => [key, displayValue(item)]);
  } else {
    headers = ["Value"];
    dataRows = [[displayValue(value)]];
  }

  formatWorksheet(worksheet, [headers, ...sortRows(dataRows)]);
}

export async function buildFinalPackageXlsx(pkg: FinalPackage | Scenario1FinalPackage | Scenario3FinalPackage): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Discovery Education";
  workbook.created = new Date();
  const usedNames = new Set<string>();
  const rawJson = workbook.addWorksheet(sheetName("JSON", usedNames));
  rawJson.getCell("A1").value = "Complete JSON Output";
  rawJson.getCell("A2").value = JSON.stringify(pkg, null, 2);
  rawJson.getColumn(1).width = 120;
  rawJson.getRow(1).height = 24;
  rawJson.getRow(1).font = headerFont;
  rawJson.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: headerFill } };
  rawJson.getCell("A1").alignment = { vertical: "middle", horizontal: "left" };
  rawJson.getCell("A2").alignment = { wrapText: true, vertical: "top" };
  rawJson.getCell("A2").border = cellBorder;
  rawJson.getRow(2).height = 420;
  rawJson.views = [{ state: "frozen", ySplit: 1 }];

  for (const [key, value] of Object.entries(pkg)) {
    if (value && typeof value === "object") addJsonWorksheet(workbook, key, value, usedNames);
  }

  return Buffer.from(await workbook.xlsx.writeBuffer());
}

export async function buildFinalPackageDocx(pkg: FinalPackage): Promise<Buffer> {
  const doc = new Document({
    sections: [
      {
        children: [
          ...reportTitle("Scenario 2 — Final Revision Package", "Literacy Strategy Integration | Final Report"),
          ...valueTable("Executive Summary", [
            ["Lesson", pkg.lesson_id],
            ["Selected Literacy Strategy", pkg.selected_literacy_strategy],
            ["Original Location", pkg.original_location],
            ["Reason for Change", pkg.reason_for_change],
            ["Literacy Benefit", pkg.literacy_benefit],
            ["Science-Learning Benefit", pkg.science_learning_benefit],
            ["Timing / Instructional Impact", pkg.timing_or_instructional_impact],
          ]),
          new Paragraph({ children: [new PageBreak()] }),
          ...section("Student-Facing Content", pkg.student_content),
          ...section("Teacher-Facing Content", pkg.teacher_content),
          ...section("Rationale", pkg.rationale_doc),
          ...jsonTableSection("Connected Updates", pkg.connected_updates),
          ...jsonTableSection("Quality Assurance Findings", pkg.qa_findings),
          ...jsonTableSection("Final Validation Status", pkg.final_validation_status),
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
          ...reportTitle("Scenario 1 — NGSS-to-State Standards Crosswalk", "Standards Alignment | Final Report"),
          ...valueTable("Executive Summary", [
            ["Strong Alignments", pkg.sc_codes_strong],
            ["Partial Alignments", pkg.sc_codes_partial],
            ["Gaps", pkg.sc_codes_gap],
            ["Standards Reviewed", pkg.sc_codes_total],
            ["Classification Coverage", `${pkg.sc_codes_total} standards classified as Strong, Partial, or Gap`],
          ]),
          ...section("Summary", pkg.summary),
          ...section("Overall Notes", pkg.overall_notes),
          ...section("Out of Scope", pkg.out_of_scope_note),
          new Paragraph({ children: [new PageBreak()] }),
          ...jsonBlocks("Final QA Review", pkg.final_qa_review),
          ...jsonBlocks("NGSS-to-SC Crosswalk", pkg.crosswalk),
          ...jsonBlocks("SC Standards Deltas", pkg.sc_deltas),
          ...jsonBlocks("Performance Target Map", pkg.performance_target_map),
          ...jsonBlocks("Grade-Level Depth Validation", pkg.grade_level_depth_validation),
          ...jsonBlocks("Alignment/Evidence Criteria", pkg.alignment_criteria),
          ...jsonBlocks("Evidence Review", pkg.evidence_review),
          ...jsonBlocks("Classification (Strong/Partial/Gap)", pkg.classification),
          ...jsonBlocks("Gap Analysis & Remediation", pkg.gap_analysis),
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
          ...reportTitle("Scenario 3 — Standards Alignment Package", "State Standards Alignment | Final Report"),
          ...valueTable("Executive Summary", [
            ["Confirmed Grade", pkg.confirmed_grade],
            ["Standards Addressed", `${pkg.oregon_standards_addressed} / ${pkg.total_oregon_standards}`],
            ["Revisions Made", pkg.revisions_made],
            ["Remaining Gaps", pkg.remaining_gaps.length],
          ]),
          ...section("Unit Summary", pkg.unit_summary),
          ...section("Remaining Gaps", pkg.remaining_gaps.join("\n") || "None"),
          ...section("Overall Notes", pkg.overall_notes),
          new Paragraph({ children: [new PageBreak()] }),
          ...section("Updated Scope and Sequence", pkg.updated_scope_sequence),
          ...jsonBlocks("Crosswalk", pkg.crosswalk),
          ...jsonBlocks("Alignment Map", pkg.alignment_map),
          ...jsonBlocks("Gap List", pkg.gap_list),
          ...jsonBlocks("Surplus Inventory", pkg.surplus_inventory),
          ...jsonBlocks("Revision Plan", pkg.revision_plan),
          ...jsonBlocks("Drafted Content", pkg.drafted_content),
          ...jsonBlocks("Rationale Entries", pkg.rationale_entries),
          ...jsonBlocks("Final Alignment Matrix", pkg.final_alignment_matrix),
          ...jsonBlocks("Coherence Findings", pkg.coherence_findings),
          ...jsonBlocks("Editorial Findings", pkg.editorial_findings),
        ],
      },
    ],
  });
  return Packer.toBuffer(doc);
}
