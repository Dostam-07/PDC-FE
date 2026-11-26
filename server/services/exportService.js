// Document Exporter Engine (PDF, DOCX, CSV)
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, HeadingLevel, AlignmentType, WidthType, BorderStyle } from 'docx';

export const exportToCSV = (lfaData) => {
  const rows = [];
  rows.push(["Section", "Content / Statement", "Indicators / Metrics", "Means of Verification"]);

  rows.push(["Challenge", lfaData.challengeStatement || lfaData.goal || "N/A", "", ""]);
  rows.push(["Goal", lfaData.goal || "N/A", "", ""]);
  rows.push(["Impact", lfaData.impact?.statement || "N/A", lfaData.impact?.indicators || "N/A", "Endline Evaluation"]);

  if (lfaData.outcomes) {
    lfaData.outcomes.forEach(out => {
      rows.push(["Outcome", out.statement, out.indicator || "N/A", out.meansOfVerification || "Observation logs"]);
    });
  }

  if (lfaData.outputs) {
    lfaData.outputs.forEach(op => {
      rows.push(["Output", op.statement, "", ""]);
    });
  }

  if (lfaData.activities) {
    lfaData.activities.forEach(act => {
      rows.push(["Activity", act.description, act.metric || "N/A", "Activity logs"]);
    });
  }

  if (lfaData.personas) {
    lfaData.personas.forEach(p => {
      rows.push(["Persona", `${p.role}: ${p.responsibilities}`, "", ""]);
    });
  }

  // Repository resource links
  rows.push([]);
  rows.push(["Referenced Repository Resources"]);
  rows.push(["Document Name", "Resource Link"]);
  rows.push(["Logical Framework Approach Handbook", "https://repository.education.gov/docs/lfa_handbook.pdf"]);
  rows.push(["FLN Implementation Manual Punjab", "https://repository.education.gov/docs/fln_punjab.pdf"]);

  return rows.map(r => r.map(cell => `"${(cell || '').toString().replace(/"/g, '""')}"`).join(",")).join("\n");
};

export const exportToDOCX = async (lfaData) => {
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            text: "Programme Design Companion — Logical Framework Output",
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({ text: "" }),
          new Paragraph({
            children: [
              new TextRun({ text: "Programme Goal: ", bold: true }),
              new TextRun(lfaData.goal || lfaData.title || "Programme Plan"),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Challenge Statement: ", bold: true }),
              new TextRun(lfaData.challengeStatement || "N/A"),
            ],
          }),
          new Paragraph({ text: "" }),
          new Paragraph({
            text: "1. Impact",
            heading: HeadingLevel.HEADING_2,
          }),
          new Paragraph({
            text: lfaData.impact?.statement || "Long term improvement in learning outcomes.",
          }),
          new Paragraph({ text: "" }),
          new Paragraph({
            text: "2. Outcomes",
            heading: HeadingLevel.HEADING_2,
          }),
          ...(lfaData.outcomes || []).map(
            (o) =>
              new Paragraph({
                children: [
                  new TextRun({ text: `• ${o.statement}\n`, bold: true }),
                  new TextRun({ text: `   Indicator: ${o.indicator}\n`, italic: true }),
                ],
              })
          ),
          new Paragraph({ text: "" }),
          new Paragraph({
            text: "3. Activities & Process Metrics",
            heading: HeadingLevel.HEADING_2,
          }),
          ...(lfaData.activities || []).map(
            (a) =>
              new Paragraph({
                children: [
                  new TextRun({ text: `• ${a.description}\n` }),
                  new TextRun({ text: `   Metric: ${a.metric}\n`, italic: true }),
                ],
              })
          ),
          new Paragraph({ text: "" }),
          new Paragraph({
            text: "4. Referenced Repository Resources",
            heading: HeadingLevel.HEADING_2,
          }),
          new Paragraph({ text: "• Logical Framework Approach Handbook (https://repository.education.gov/docs/lfa_handbook.pdf)" }),
          new Paragraph({ text: "• FLN Implementation Manual Punjab (https://repository.education.gov/docs/fln_punjab.pdf)" }),
        ],
      },
    ],
  });

  return await Packer.toBuffer(doc);
};
