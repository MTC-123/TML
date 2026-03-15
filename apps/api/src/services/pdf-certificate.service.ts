import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';

type PDFDoc = InstanceType<typeof PDFDocument>;

// ─── Types ──────────────────────────────────────────────────────────────────

export interface CertificatePdfData {
  certificateId: string;
  certificateHash: string;
  digitalSignature: string;
  status: string;
  issuedAt: Date;
  tgrReference: string | null;
  milestone: {
    sequenceNumber: number;
    description: string;
    deadline: Date;
  };
  project: {
    name: string;
    region: string;
    budget: number;
    donor: string | null;
  };
  attestations: Array<{
    type: string;
    actorDid: string;
    status: string;
    createdAt: Date;
  }>;
}

// ─── Constants ──────────────────────────────────────────────────────────────

const NAVY = '#1e3a5f';
const GREEN = '#2d8a4e';
const GOLD = '#c5972c';
const LIGHT_GRAY = '#f5f5f5';
const MEDIUM_GRAY = '#999999';
const DARK_GRAY = '#333333';
const VERIFICATION_BASE_URL = 'https://tml.gov.ma/verify';

const PAGE_MARGIN = 50;
const CONTENT_WIDTH = 595.28 - PAGE_MARGIN * 2; // A4 width minus margins

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatDate(date: Date): string {
  return date.toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-MA', {
    style: 'currency',
    currency: 'MAD',
    maximumFractionDigits: 0,
  }).format(amount);
}

function truncateDid(did: string, maxLength = 40): string {
  if (did.length <= maxLength) return did;
  return `${did.slice(0, 20)}...${did.slice(-16)}`;
}

function attestationTypeLabel(type: string): string {
  switch (type) {
    case 'inspector_verification':
      return 'Inspector';
    case 'auditor_review':
      return 'Auditor';
    case 'citizen_approval':
      return 'Citizen';
    default:
      return type;
  }
}

function statusLabel(status: string): string {
  switch (status) {
    case 'verified':
      return 'VERIFIED';
    case 'submitted':
      return 'SUBMITTED';
    case 'rejected':
      return 'REJECTED';
    case 'revoked':
      return 'REVOKED';
    default:
      return status.toUpperCase();
  }
}

// ─── Border Drawing ─────────────────────────────────────────────────────────

function drawZelligeBorder(doc: PDFDoc): void {
  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const borderOffset = 20;
  const borderWidth = 2;

  // Outer border in gold
  doc
    .rect(borderOffset, borderOffset, pageWidth - borderOffset * 2, pageHeight - borderOffset * 2)
    .lineWidth(borderWidth)
    .strokeColor(GOLD)
    .stroke();

  // Inner border in navy
  const innerOffset = borderOffset + 6;
  doc
    .rect(innerOffset, innerOffset, pageWidth - innerOffset * 2, pageHeight - innerOffset * 2)
    .lineWidth(1)
    .strokeColor(NAVY)
    .stroke();

  // Corner accents — small geometric squares at each corner (zellige-inspired)
  const cornerSize = 12;
  const corners = [
    { x: borderOffset, y: borderOffset },
    { x: pageWidth - borderOffset - cornerSize, y: borderOffset },
    { x: borderOffset, y: pageHeight - borderOffset - cornerSize },
    { x: pageWidth - borderOffset - cornerSize, y: pageHeight - borderOffset - cornerSize },
  ];

  for (const corner of corners) {
    doc
      .rect(corner.x, corner.y, cornerSize, cornerSize)
      .fillColor(GOLD)
      .fill();
    doc
      .rect(corner.x + 3, corner.y + 3, cornerSize - 6, cornerSize - 6)
      .fillColor(NAVY)
      .fill();
  }

  // Top and bottom decorative line segments
  const segmentWidth = 8;
  const segmentGap = 16;
  const lineY_top = borderOffset + 3;
  const lineY_bottom = pageHeight - borderOffset - 3 - 4;

  for (let x = borderOffset + cornerSize + 10; x < pageWidth - borderOffset - cornerSize - 10; x += segmentGap) {
    doc.rect(x, lineY_top, segmentWidth, 4).fillColor(GOLD).fill();
    doc.rect(x, lineY_bottom, segmentWidth, 4).fillColor(GOLD).fill();
  }
}

// ─── Section Drawing Helpers ────────────────────────────────────────────────

function drawSectionHeader(doc: PDFDoc, title: string, y: number): number {
  doc
    .fillColor(NAVY)
    .font('Helvetica-Bold')
    .fontSize(11)
    .text(title, PAGE_MARGIN, y, { width: CONTENT_WIDTH });

  const lineY = y + 16;
  doc
    .moveTo(PAGE_MARGIN, lineY)
    .lineTo(PAGE_MARGIN + CONTENT_WIDTH, lineY)
    .lineWidth(1)
    .strokeColor(NAVY)
    .stroke();

  return lineY + 8;
}

function drawKeyValue(
  doc: PDFDoc,
  label: string,
  value: string,
  x: number,
  y: number,
  maxWidth: number,
): number {
  doc
    .fillColor(MEDIUM_GRAY)
    .font('Helvetica')
    .fontSize(8)
    .text(label, x, y, { width: maxWidth });

  doc
    .fillColor(DARK_GRAY)
    .font('Helvetica-Bold')
    .fontSize(9)
    .text(value, x, y + 11, { width: maxWidth });

  return y + 28;
}

// ─── Main PDF Generation ────────────────────────────────────────────────────

export async function generateCertificatePdf(data: CertificatePdfData): Promise<Buffer> {
  // Generate QR code as PNG buffer
  const verificationUrl = `${VERIFICATION_BASE_URL}/${data.certificateHash}`;
  const qrPngBuffer = await QRCode.toBuffer(verificationUrl, {
    width: 120,
    margin: 1,
    color: { dark: NAVY, light: '#ffffff' },
    errorCorrectionLevel: 'M',
  });

  return new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: PAGE_MARGIN, bottom: PAGE_MARGIN, left: PAGE_MARGIN, right: PAGE_MARGIN },
      info: {
        Title: `TML Payment Clearance Certificate - ${data.certificateId}`,
        Author: 'TML - Transparency Middleware Layer',
        Subject: 'Payment Clearance Certificate',
        Creator: 'TML',
      },
    });

    const chunks: Uint8Array[] = [];
    doc.on('data', (chunk: Uint8Array) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // ─── Decorative Border ────────────────────────────────────────────
    drawZelligeBorder(doc);

    // ─── Header ──────────────────────────────────────────────────────
    let cursorY = 45;

    // TML Logo text
    doc
      .fillColor(NAVY)
      .font('Helvetica-Bold')
      .fontSize(28)
      .text('TML', PAGE_MARGIN, cursorY, { width: CONTENT_WIDTH, align: 'center' });
    cursorY += 32;

    // Kingdom header
    doc
      .fillColor(DARK_GRAY)
      .font('Helvetica')
      .fontSize(10)
      .text('ROYAUME DU MAROC', PAGE_MARGIN, cursorY, { width: CONTENT_WIDTH, align: 'center' });
    cursorY += 14;

    doc
      .fillColor(NAVY)
      .font('Helvetica-Bold')
      .fontSize(14)
      .text('PAYMENT CLEARANCE CERTIFICATE', PAGE_MARGIN, cursorY, { width: CONTENT_WIDTH, align: 'center' });
    cursorY += 18;

    doc
      .fillColor(DARK_GRAY)
      .font('Helvetica')
      .fontSize(10)
      .text('CERTIFICAT DE QUITTANCE DE PAIEMENT', PAGE_MARGIN, cursorY, { width: CONTENT_WIDTH, align: 'center' });
    cursorY += 20;

    // Decorative line under header
    doc
      .moveTo(PAGE_MARGIN + 100, cursorY)
      .lineTo(PAGE_MARGIN + CONTENT_WIDTH - 100, cursorY)
      .lineWidth(2)
      .strokeColor(GOLD)
      .stroke();
    cursorY += 6;

    // Certificate number and date
    doc
      .fillColor(MEDIUM_GRAY)
      .font('Helvetica')
      .fontSize(8)
      .text(`Certificate No: ${data.certificateId}`, PAGE_MARGIN, cursorY, { width: CONTENT_WIDTH, align: 'center' });
    cursorY += 11;
    doc.text(`Issued: ${formatDate(data.issuedAt)}`, PAGE_MARGIN, cursorY, { width: CONTENT_WIDTH, align: 'center' });
    cursorY += 11;

    if (data.tgrReference) {
      doc.text(`TGR Reference: ${data.tgrReference}`, PAGE_MARGIN, cursorY, { width: CONTENT_WIDTH, align: 'center' });
      cursorY += 11;
    }

    // Status badge
    cursorY += 4;
    const statusText = data.status.toUpperCase();
    const statusColor = data.status === 'issued' || data.status === 'acknowledged' ? GREEN : data.status === 'revoked' ? '#dc2626' : NAVY;
    doc.font('Helvetica-Bold').fontSize(10);
    const statusWidth = doc.widthOfString(statusText);
    const statusX = PAGE_MARGIN + (CONTENT_WIDTH - statusWidth - 20) / 2;

    doc
      .roundedRect(statusX, cursorY - 2, statusWidth + 20, 18, 3)
      .fillColor(statusColor)
      .fill();

    doc
      .fillColor('#ffffff')
      .font('Helvetica-Bold')
      .fontSize(10)
      .text(statusText, statusX + 10, cursorY + 1);

    cursorY += 26;

    // ─── Project Details ─────────────────────────────────────────────
    cursorY = drawSectionHeader(doc, 'PROJECT DETAILS', cursorY);

    const halfWidth = CONTENT_WIDTH / 2 - 5;
    const leftX = PAGE_MARGIN;
    const rightX = PAGE_MARGIN + halfWidth + 10;

    drawKeyValue(doc, 'Project Name', data.project.name, leftX, cursorY, halfWidth);
    drawKeyValue(doc, 'Region', data.project.region, rightX, cursorY, halfWidth);
    cursorY += 28;

    drawKeyValue(doc, 'Budget', formatCurrency(data.project.budget), leftX, cursorY, halfWidth);
    drawKeyValue(doc, 'Donor', data.project.donor ?? 'N/A', rightX, cursorY, halfWidth);
    cursorY += 28;

    // ─── Milestone Details ───────────────────────────────────────────
    cursorY = drawSectionHeader(doc, 'MILESTONE DETAILS', cursorY);

    drawKeyValue(doc, 'Milestone #', String(data.milestone.sequenceNumber), leftX, cursorY, halfWidth);
    drawKeyValue(doc, 'Deadline', formatDate(data.milestone.deadline), rightX, cursorY, halfWidth);
    cursorY += 28;

    doc
      .fillColor(MEDIUM_GRAY)
      .font('Helvetica')
      .fontSize(8)
      .text('Description', leftX, cursorY);
    cursorY += 11;
    doc
      .fillColor(DARK_GRAY)
      .font('Helvetica')
      .fontSize(9)
      .text(data.milestone.description, leftX, cursorY, { width: CONTENT_WIDTH });
    cursorY += doc.heightOfString(data.milestone.description, { width: CONTENT_WIDTH }) + 10;

    // ─── Attestation Summary Table ───────────────────────────────────
    cursorY = drawSectionHeader(doc, 'ATTESTATION SUMMARY', cursorY);

    // Table header
    const colWidths = [80, 160, 80, 80, 95] as const;
    const colX = [
      leftX,
      leftX + 80,
      leftX + 80 + 160,
      leftX + 80 + 160 + 80,
      leftX + 80 + 160 + 80 + 80,
    ] as const;

    // Table header background
    doc.rect(leftX, cursorY, CONTENT_WIDTH, 16).fillColor(NAVY).fill();

    const headers = ['Role', 'DID', 'Date', 'Status', ''];
    doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(7);
    for (let i = 0; i < headers.length; i++) {
      doc.text(headers[i]!, colX[i]! + 4, cursorY + 4, { width: colWidths[i]! - 8 });
    }
    cursorY += 16;

    // Table rows
    for (let rowIdx = 0; rowIdx < data.attestations.length; rowIdx++) {
      const att = data.attestations[rowIdx]!;
      const rowY = cursorY;

      // Alternate row background
      if (rowIdx % 2 === 0) {
        doc.rect(leftX, rowY, CONTENT_WIDTH, 16).fillColor(LIGHT_GRAY).fill();
      }

      doc.font('Helvetica').fontSize(7).fillColor(DARK_GRAY);
      doc.text(attestationTypeLabel(att.type), colX[0] + 4, rowY + 4, { width: 72 });
      doc.font('Courier').fontSize(6);
      doc.text(truncateDid(att.actorDid, 30), colX[1] + 4, rowY + 5, { width: 152 });
      doc.font('Helvetica').fontSize(7);
      doc.text(formatDate(att.createdAt), colX[2] + 4, rowY + 4, { width: 72 });

      // Status with color
      const attStatusColor = att.status === 'verified' ? GREEN : att.status === 'submitted' ? NAVY : '#dc2626';
      doc.fillColor(attStatusColor).font('Helvetica-Bold').fontSize(7);
      doc.text(statusLabel(att.status), colX[3] + 4, rowY + 4, { width: 72 });

      cursorY += 16;
    }

    if (data.attestations.length === 0) {
      doc.fillColor(MEDIUM_GRAY).font('Helvetica').fontSize(8);
      doc.text('No attestations recorded.', leftX + 4, cursorY + 4, { width: CONTENT_WIDTH - 8 });
      cursorY += 20;
    }

    cursorY += 8;

    // ─── Quorum Status ───────────────────────────────────────────────
    const inspectors = data.attestations.filter((a) => a.type === 'inspector_verification' && (a.status === 'verified' || a.status === 'submitted'));
    const auditors = data.attestations.filter((a) => a.type === 'auditor_review' && (a.status === 'verified' || a.status === 'submitted'));
    const citizens = data.attestations.filter((a) => a.type === 'citizen_approval' && (a.status === 'verified' || a.status === 'submitted'));

    cursorY = drawSectionHeader(doc, 'QUORUM STATUS', cursorY);

    const quorumItems = [
      { label: 'Inspector', count: inspectors.length, met: inspectors.length >= 1 },
      { label: 'Auditor', count: auditors.length, met: auditors.length >= 1 },
      { label: 'Citizens', count: citizens.length, met: citizens.length >= 3 },
    ];

    const quorumWidth = CONTENT_WIDTH / 3;
    for (let i = 0; i < quorumItems.length; i++) {
      const item = quorumItems[i]!;
      const qx = leftX + i * quorumWidth;
      const qColor = item.met ? GREEN : '#d97706';
      const qText = item.met ? 'QUORUM MET' : 'PENDING';

      doc.fillColor(DARK_GRAY).font('Helvetica-Bold').fontSize(9);
      doc.text(`${item.label}: ${item.count}`, qx, cursorY, { width: quorumWidth });
      doc.fillColor(qColor).font('Helvetica-Bold').fontSize(8);
      doc.text(qText, qx, cursorY + 12, { width: quorumWidth });
    }
    cursorY += 30;

    // ─── Digital Signature Section ──────────────────────────────────
    cursorY = drawSectionHeader(doc, 'DIGITAL SIGNATURE', cursorY);

    doc
      .fillColor(MEDIUM_GRAY)
      .font('Helvetica')
      .fontSize(7)
      .text('Ed25519 Signature (Base64)', leftX, cursorY);
    cursorY += 10;

    // Signature in a bordered box
    doc
      .rect(leftX, cursorY, CONTENT_WIDTH, 24)
      .fillColor(LIGHT_GRAY)
      .fill();
    doc
      .rect(leftX, cursorY, CONTENT_WIDTH, 24)
      .lineWidth(0.5)
      .strokeColor(NAVY)
      .stroke();

    doc
      .fillColor(DARK_GRAY)
      .font('Courier')
      .fontSize(5.5)
      .text(data.digitalSignature, leftX + 6, cursorY + 4, {
        width: CONTENT_WIDTH - 12,
        lineGap: 2,
      });
    cursorY += 30;

    doc
      .fillColor(MEDIUM_GRAY)
      .font('Helvetica')
      .fontSize(7)
      .text('SHA-256 Certificate Hash', leftX, cursorY);
    cursorY += 10;

    doc
      .rect(leftX, cursorY, CONTENT_WIDTH, 18)
      .fillColor(LIGHT_GRAY)
      .fill();
    doc
      .rect(leftX, cursorY, CONTENT_WIDTH, 18)
      .lineWidth(0.5)
      .strokeColor(NAVY)
      .stroke();

    doc
      .fillColor(DARK_GRAY)
      .font('Courier')
      .fontSize(6.5)
      .text(data.certificateHash, leftX + 6, cursorY + 5, { width: CONTENT_WIDTH - 12 });
    cursorY += 26;

    // ─── QR Code ─────────────────────────────────────────────────────
    const qrSize = 100;
    const qrX = leftX + (CONTENT_WIDTH - qrSize) / 2;

    doc.image(qrPngBuffer, qrX, cursorY, { width: qrSize, height: qrSize });

    doc
      .fillColor(MEDIUM_GRAY)
      .font('Helvetica')
      .fontSize(7)
      .text('Scan to verify', PAGE_MARGIN, cursorY + qrSize + 4, { width: CONTENT_WIDTH, align: 'center' });
    cursorY += qrSize + 18;

    // ─── Footer ──────────────────────────────────────────────────────
    const footerY = 841.89 - PAGE_MARGIN - 30;

    doc
      .moveTo(PAGE_MARGIN + 40, footerY)
      .lineTo(PAGE_MARGIN + CONTENT_WIDTH - 40, footerY)
      .lineWidth(0.5)
      .strokeColor(GOLD)
      .stroke();

    doc
      .fillColor(MEDIUM_GRAY)
      .font('Helvetica')
      .fontSize(7)
      .text(
        'This certificate is cryptographically signed and can be verified at tml.gov.ma/verify',
        PAGE_MARGIN,
        footerY + 6,
        { width: CONTENT_WIDTH, align: 'center' },
      );

    doc
      .fillColor(MEDIUM_GRAY)
      .font('Helvetica')
      .fontSize(6)
      .text(
        'TML - Transparency Middleware Layer | Powered by Ed25519 Digital Signatures',
        PAGE_MARGIN,
        footerY + 18,
        { width: CONTENT_WIDTH, align: 'center' },
      );

    doc.end();
  });
}
