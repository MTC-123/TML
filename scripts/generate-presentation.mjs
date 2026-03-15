/**
 * TML Hackathon Presentation Generator
 *
 * Generates docs/presentation/TML_Presentation.pptx for the Upanzi / ID4Africa Hackathon 2026.
 * Uses ACTUAL source code from the repository for technical slides.
 *
 * Usage:
 *   npm install pptxgenjs --no-save
 *   node scripts/generate-presentation.mjs
 *
 * Output: docs/presentation/TML_Presentation.pptx
 */

import PptxGenJS from 'pptxgenjs';
import { mkdirSync } from 'fs';

// Ensure output directory exists
mkdirSync('documents', { recursive: true });

// ─── Design System (CLAUDE.md) ───────────────────────────────────────────────
const C = {
  navy:    '1E3A5F',
  navyDk:  '0D2137',
  navyMd:  '162D4B',
  green:   '2D8A4E',
  greenLt: 'ECFDF5',
  amber:   'D97706',
  amberLt: 'FFFBEB',
  red:     'DC2626',
  redLt:   'FEF2F2',
  purple:  '7C3AED',
  purpleLt:'F5F3FF',
  white:   'FFFFFF',
  body:    '1F2937',
  muted:   '6B7280',
  light:   'F9FAFB',
  border:  'E5E7EB',
  code:    '1E293B',
  codeBg:  'F1F5F9',
};
const FONT    = 'Calibri';
const MONO    = 'Courier New';

// ─── Presentation ────────────────────────────────────────────────────────────
const prs = new PptxGenJS();
prs.layout  = 'LAYOUT_WIDE';
prs.author  = 'TML Team';
prs.company = 'TML — Transparency Middleware Layer';
prs.subject = 'Upanzi Africa Digital ID Hackathon 2026';
prs.title   = 'TML — Transparency Middleware Layer';

// ─── Shared helpers ──────────────────────────────────────────────────────────
function accentBar(slide, color = C.green, y = 0) {
  slide.addShape(prs.ShapeType.rect, { x:0, y, w:'100%', h:0.07,
    fill:{ color }, line:{ color } });
}
function bottomBar(slide) {
  slide.addShape(prs.ShapeType.rect, { x:0, y:7.1, w:'100%', h:0.4,
    fill:{ color: C.navy }, line:{ color: C.navy } });
}
function pgNum(slide, n) {
  slide.addText(`${n}  /  10`, {
    x:12.0, y:7.15, w:1.2, h:0.25,
    fontSize:8, color:'8BA0BB', fontFace:FONT, align:'right' });
}
function brand(slide) {
  slide.addText('TML  ·  Transparency Middleware Layer', {
    x:0.4, y:7.15, w:9, h:0.25,
    fontSize:8, color:'8BA0BB', fontFace:FONT });
}
function footer(slide, n) { bottomBar(slide); pgNum(slide,n); brand(slide); }

function sectionTitle(slide, text, y = 0.35) {
  slide.addShape(prs.ShapeType.rect, {
    x:0.45, y: y+0.02, w:0.055, h:0.38,
    fill:{ color: C.green }, line:{ color: C.green } });
  slide.addText(text, {
    x:0.58, y, w:12.4, h:0.5,
    fontSize:20, bold:true, color:C.navy, fontFace:FONT });
}

// Code block helper — renders a styled monospace snippet
function codeBlock(slide, code, opts = {}) {
  const { x=0.5, y, w=12.3, h=1.2, fontSize=8.5 } = opts;
  slide.addShape(prs.ShapeType.rect, { x, y, w, h,
    fill:{ color: C.code }, line:{ color: C.code }, rectRadius:0.06 });
  slide.addText(code, {
    x:x+0.15, y:y+0.1, w:w-0.3, h:h-0.2,
    fontSize, color:'A5F3FC', fontFace:MONO,
    align:'left', lineSpacingMultiple:1.35 });
}

// Stat card
function statCard(slide, val, label, x, y, w=2.7, color=C.navy) {
  slide.addShape(prs.ShapeType.rect, { x, y, w, h:1.15,
    fill:{ color }, line:{ color }, rectRadius:0.08 });
  slide.addShape(prs.ShapeType.rect, { x, y:y+1.07, w, h:0.08,
    fill:{ color: C.green }, line:{ color: C.green } });
  slide.addText(val, { x:x+0.1, y:y+0.08, w:w-0.2, h:0.55,
    fontSize:22, bold:true, color:C.white, fontFace:FONT, align:'center' });
  slide.addText(label, { x:x+0.1, y:y+0.62, w:w-0.2, h:0.4,
    fontSize:9.5, color:'B0C4DE', fontFace:FONT, align:'center',
    lineSpacingMultiple:1.25 });
}

// Flow node
function flowNode(slide, label, sublabel, x, y, color=C.navy, w=2.65, h=1.2) {
  slide.addShape(prs.ShapeType.rect, { x, y, w, h,
    fill:{ color }, line:{ color }, rectRadius:0.08 });
  slide.addText(label, { x:x+0.1, y:y+0.16, w:w-0.2, h:0.45,
    fontSize:12, bold:true, color:C.white, fontFace:FONT, align:'center' });
  slide.addText(sublabel, { x:x+0.1, y:y+0.62, w:w-0.2, h:0.52,
    fontSize:8.5, color:'B0C4DE', fontFace:FONT, align:'center',
    lineSpacingMultiple:1.2 });
}

function arrow(slide, x, y) {
  slide.addShape(prs.ShapeType.rect, { x, y:y+0.55, w:0.3, h:0.07,
    fill:{ color: C.muted }, line:{ color: C.muted } });
  slide.addText('▶', { x:x+0.22, y:y+0.44, w:0.15, h:0.27,
    fontSize:8, color:C.muted, fontFace:FONT });
}

function layerBox(slide, label, items, y, bgColor, accentColor) {
  slide.addShape(prs.ShapeType.rect, { x:0.45, y, w:12.3, h:0.75,
    fill:{ color: bgColor }, line:{ color: accentColor, pt:1.5 }, rectRadius:0.06 });
  slide.addShape(prs.ShapeType.rect, { x:0.45, y, w:0.055, h:0.75,
    fill:{ color: accentColor }, line:{ color: accentColor } });
  slide.addText(label, { x:0.6, y:y+0.07, w:3.2, h:0.3,
    fontSize:9.5, bold:true, color:C.navy, fontFace:FONT });
  slide.addText(items, { x:3.85, y:y+0.07, w:8.8, h:0.6,
    fontSize:9, color:C.body, fontFace:FONT, lineSpacingMultiple:1.2 });
}

// ════════════════════════════════════════════════════════════════════════════
// SLIDE 1 — Cover
// ════════════════════════════════════════════════════════════════════════════
{
  const s = prs.addSlide();

  // Full navy background
  s.addShape(prs.ShapeType.rect, { x:0, y:0, w:'100%', h:'100%',
    fill:{ color: C.navy }, line:{ color: C.navy } });

  // Decorative corner squares (top-left, bottom-right)
  s.addShape(prs.ShapeType.rect, { x:0, y:0, w:2.2, h:1.1,
    fill:{ color: C.navyDk }, line:{ color: C.navyDk } });
  s.addShape(prs.ShapeType.rect, { x:11.1, y:6.5, w:2.2, h:1.0,
    fill:{ color: C.navyDk }, line:{ color: C.navyDk } });

  // Green left accent bar (vertical)
  s.addShape(prs.ShapeType.rect, { x:0, y:0, w:0.12, h:'100%',
    fill:{ color: C.green }, line:{ color: C.green } });

  // TML large wordmark
  s.addText('TML', {
    x:1.5, y:1.4, w:10.2, h:2.0,
    fontSize:110, bold:true, color:C.white, fontFace:FONT, align:'center' });

  // Green rule under wordmark
  s.addShape(prs.ShapeType.rect, { x:3.5, y:3.3, w:6.3, h:0.07,
    fill:{ color: C.green }, line:{ color: C.green } });

  // Tagline
  s.addText('Transparency Middleware Layer', {
    x:1.5, y:3.45, w:10.2, h:0.5,
    fontSize:18, color: C.green, fontFace:FONT, align:'center' });

  s.addText('Digital Identity as an Accountability Engine\nfor African Public Infrastructure', {
    x:2.0, y:4.05, w:9.3, h:0.72,
    fontSize:13, color:'90AEC4', fontFace:FONT, align:'center',
    lineSpacingMultiple:1.4 });

  // Event card
  s.addShape(prs.ShapeType.rect, { x:3.3, y:4.95, w:6.7, h:1.35,
    fill:{ color: C.navyMd }, line:{ color: C.green, pt:1 }, rectRadius:0.08 });
  s.addText(
    'Upanzi / ID4Africa Digital ID Hackathon 2026\n' +
    'CMU-Africa  ·  Abidjan, Cote d\'Ivoire  ·  May 12–15, 2026\n' +
    'Submission Deadline: April 5, 2026',
    { x:3.5, y:5.1, w:6.3, h:1.05,
      fontSize:10.5, color:'B0C4DE', fontFace:FONT, align:'center',
      lineSpacingMultiple:1.55 });

  // Closing quote
  s.addText(
    '"No certificate. No funds. That is the rule TML enforces — cryptographically."',
    { x:1.5, y:6.5, w:10.2, h:0.4,
      fontSize:9.5, color:'547091', fontFace:FONT, align:'center', italic:true });
}

// ════════════════════════════════════════════════════════════════════════════
// SLIDE 2 — The Problem
// ════════════════════════════════════════════════════════════════════════════
{
  const s = prs.addSlide();
  accentBar(s);
  footer(s, 2);
  sectionTitle(s, 'The Problem: Infrastructure Corruption in Africa');

  // Hook callout
  s.addShape(prs.ShapeType.rect, { x:0.45, y:0.95, w:12.3, h:0.68,
    fill:{ color: C.amberLt }, line:{ color: C.amber, pt:2 }, rectRadius:0.06 });
  s.addText(
    '"$41 billion is about to be spent on FIFA 2030 infrastructure in Morocco.  ' +
    'Across Africa, 10–30% of infrastructure funds are lost to corruption — ' +
    'enough to build 2,000 schools every year.  No cryptographic proof is required before funds move."',
    { x:0.6, y:1.0, w:12.0, h:0.58,
      fontSize:10.5, color:'92400E', fontFace:FONT, italic:true });

  // Stats grid — 6 cards in 2 rows
  const stats = [
    { val:'$88.6B',  lbl:'Annual illicit financial\nflows from Africa (UNCTAD / AU)' },
    { val:'56,000+', lbl:'Abandoned infrastructure\nprojects — Nigeria alone (BPP)' },
    { val:'10–30%',  lbl:'Infrastructure funds lost\nto corruption (World Bank avg.)' },
    { val:'$41B',    lbl:'Morocco FIFA 2030\ninfrastructure investment' },
    { val:'$108B',   lbl:"Africa's annual\ninfrastructure funding gap (AfDB)" },
    { val:'800M',    lbl:'Citizens globally without\ngovernment-recognised ID' },
  ];
  stats.forEach((st, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    statCard(s, st.val, st.lbl,
      0.45 + col * 4.1,
      1.78 + row * 1.3,
      3.85,
      i < 3 ? C.navy : C.navyMd
    );
  });

  // Root cause box
  s.addShape(prs.ShapeType.rect, { x:0.45, y:4.5, w:12.3, h:1.2,
    fill:{ color: C.redLt }, line:{ color: C.red, pt:1.5 }, rectRadius:0.06 });
  s.addShape(prs.ShapeType.rect, { x:0.45, y:4.5, w:0.055, h:1.2,
    fill:{ color: C.red }, line:{ color: C.red } });
  s.addText('ROOT CAUSE', { x:0.6, y:4.58, w:3, h:0.32,
    fontSize:10, bold:true, color:C.red, fontFace:FONT });
  s.addText(
    'Infrastructure fraud is an identity-binding problem.  When contracts are signed by abstract legal entities ' +
    'and approved by a single bureaucrat — with no multi-party verification, no cryptographic signature, and no ' +
    'citizen oversight — liability evaporates.  Digital ID systems across Africa are strong, but they are almost ' +
    'never used as enforcement mechanisms.  TML closes that gap.',
    { x:0.6, y:4.92, w:12.0, h:0.72,
      fontSize:10, color:'7F1D1D', fontFace:FONT, lineSpacingMultiple:1.3 });
}

// ════════════════════════════════════════════════════════════════════════════
// SLIDE 3 — The Solution
// ════════════════════════════════════════════════════════════════════════════
{
  const s = prs.addSlide();
  accentBar(s);
  footer(s, 3);
  sectionTitle(s, 'The Solution: TML — Transparency Middleware Layer');

  s.addText(
    'TML makes cryptographic proof a mandatory pre-condition for government fund disbursement.',
    { x:0.45, y:0.95, w:12.3, h:0.38,
      fontSize:13.5, bold:true, color:C.navy, fontFace:FONT });

  // Three pillars
  const pillars = [
    {
      num:'01',
      title:'Identity Binding',
      color: C.navy,
      lines: [
        'Every actor is bound to their CNIE national ID via MOSIP eSignet (OIDC).',
        '',
        'TML generates a did:key decentralized identifier controlled by the actor.',
        '',
        'Ed25519 key pair derived from verified CNIE identity claims.',
        '',
        'Private key stays with actor — never stored server-side.',
      ],
    },
    {
      num:'02',
      title:'Multi-Party Attestation',
      color: C.green,
      lines: [
        'Inspector — must be physically on-site (GPS geofence enforced).',
        '',
        'Auditor — independent review with cryptographic rotation algorithm.',
        '',
        'Citizens — community vote via web app or USSD *384# on any phone.',
        '',
        'Quorum thresholds configurable per Assurance Tier.',
      ],
    },
    {
      num:'03',
      title:'Payment Clearance Certificate',
      color: C.amber,
      lines: [
        'Issued only when all quorum thresholds are met simultaneously.',
        '',
        'W3C Verifiable Credential — Ed25519 signed, SHA-256 hashed.',
        '',
        'Submitted to TGR integration endpoint.',
        '',
        'No valid PCC = funds do not move.  Zero exceptions.',
      ],
    },
  ];

  pillars.forEach((p, i) => {
    const x = 0.45 + i * 4.15;
    s.addShape(prs.ShapeType.rect, { x, y:1.45, w:3.95, h:4.85,
      fill:{ color: C.light }, line:{ color: C.border, pt:1 }, rectRadius:0.1 });
    // Colored top bar
    s.addShape(prs.ShapeType.rect, { x, y:1.45, w:3.95, h:0.6,
      fill:{ color: p.color }, line:{ color: p.color }, rectRadius:0.1 });
    s.addText(p.num, { x:x+0.12, y:1.47, w:0.5, h:0.55,
      fontSize:11, bold:true, color:C.white, fontFace:FONT });
    s.addText(p.title, { x:x+0.58, y:1.47, w:3.25, h:0.55,
      fontSize:14, bold:true, color:C.white, fontFace:FONT });
    s.addText(p.lines.join('\n'), {
      x:x+0.18, y:2.12, w:3.6, h:4.05,
      fontSize:10, color:C.body, fontFace:FONT, lineSpacingMultiple:1.3 });
  });

  // Quote
  s.addShape(prs.ShapeType.rect, { x:0.45, y:6.42, w:12.3, h:0.45,
    fill:{ color: C.light }, line:{ color: C.border, pt:0.5 }, rectRadius:0.06 });
  s.addText(
    '"Digital identity should not only help citizens prove who they are — ' +
    'it should help societies prove that promises are kept."',
    { x:0.6, y:6.46, w:12.0, h:0.35,
      fontSize:10, color:C.muted, fontFace:FONT, italic:true, align:'center' });
}

// ════════════════════════════════════════════════════════════════════════════
// SLIDE 4 — How It Works (Visual Flow)
// ════════════════════════════════════════════════════════════════════════════
{
  const s = prs.addSlide();
  accentBar(s);
  footer(s, 4);
  sectionTitle(s, 'How It Works: From CNIE to Fund Disbursement');

  // ── 4-step flow ─────────────────────────────────────────────────────────
  const steps = [
    { n:'01', label:'IDENTITY\nBINDING', color:C.navy,
      detail:'CNIE card\n↓ MOSIP eSignet OIDC\n↓ did:key generated\n↓ JWT issued' },
    { n:'02', label:'ATTESTATION\nCOLLECTION', color:C.green,
      detail:'Inspector (GPS fence)\nAuditor (rotation)\nCitizens (USSD *384#)\nQuorum check' },
    { n:'03', label:'CERTIFICATE\nGENERATION', color:C.amber,
      detail:'Ed25519 sign\nSHA-256 hash\nW3C VC created\nQR code embedded' },
    { n:'04', label:'FUND\nRELEASE', color:C.red,
      detail:'PCC → TGR endpoint\nCryptographic verify\nDisburse ✓\nNo PCC → Block ✗' },
  ];

  steps.forEach((st, i) => {
    const x = 0.5 + i * 3.15;
    flowNode(s, `${st.n}  ${st.label}`, st.detail, x, 1.05, st.color, 2.9, 2.2);
    if (i < 3) arrow(s, x + 2.9, 1.05);
  });

  // ── USSD flow diagram ────────────────────────────────────────────────────
  s.addText('USSD Citizen Attestation Flow  (*384#)', {
    x:0.45, y:3.5, w:8, h:0.38,
    fontSize:12, bold:true, color:C.navy, fontFace:FONT });
  s.addText('FR / AR / AMZ multilingual', {
    x:7.0, y:3.5, w:3, h:0.38,
    fontSize:10, color:C.green, fontFace:FONT, bold:true });

  const ussdFlow = [
    { step:'Dial *384#',         sub:'Any GSM phone\nno internet needed' },
    { step:'Language select',    sub:'FR / العربية / ⵜⴰⵎⴰⵣⵉⵖⵜ' },
    { step:'Enter project code', sub:'6-digit code\nfrom project site sign' },
    { step:'Review milestone',   sub:'Project name + stage\ndisplayed in chosen language' },
    { step:'Vote 1/2/3',         sub:'Yes / No / Unsure\n+ OTP identity verify' },
    { step:'Attestation stored', sub:'Ed25519 signed\nvia CNIE-linked DID' },
  ];

  ussdFlow.forEach((u, i) => {
    const x = 0.45 + i * 2.1;
    s.addShape(prs.ShapeType.rect, { x, y:3.98, w:1.95, h:1.35,
      fill:{ color: i % 2 === 0 ? C.navy : C.navyMd },
      line:{ color: i % 2 === 0 ? C.navy : C.navyMd }, rectRadius:0.07 });
    s.addText(u.step, { x:x+0.08, y:4.04, w:1.8, h:0.4,
      fontSize:9, bold:true, color:C.white, fontFace:FONT, align:'center' });
    s.addText(u.sub, { x:x+0.08, y:4.48, w:1.8, h:0.78,
      fontSize:8, color:'B0C4DE', fontFace:FONT, align:'center',
      lineSpacingMultiple:1.25 });
    if (i < 5) {
      s.addText('›', { x:x+1.95, y:4.5, w:0.15, h:0.3,
        fontSize:12, color:C.muted, fontFace:FONT, align:'center' });
    }
  });

  // ── Anti-collusion enforcement callout ───────────────────────────────────
  s.addShape(prs.ShapeType.rect, { x:0.45, y:5.5, w:12.3, h:1.35,
    fill:{ color: C.navy }, line:{ color: C.green, pt:1.5 }, rectRadius:0.07 });
  s.addText('ANTI-COLLUSION ENFORCEMENT', {
    x:0.6, y:5.57, w:5, h:0.32,
    fontSize:9.5, bold:true, color:C.green, fontFace:FONT });
  s.addText(
    'Inspector geofence  ·  Auditor rotation (excludes same-org + recent rounds)  ·  ' +
    'Weighted citizen quorum (biometric 1.0 / USSD 0.6 / CSO 0.4)  ·  ' +
    'Auto-revocation on dispute  ·  Immutable audit log  ·  ' +
    'Cost of collusion scales with number of independent parties — making systematic fraud structurally impossible.',
    { x:0.6, y:5.91, w:12.0, h:0.87,
      fontSize:9.5, color:'B0C4DE', fontFace:FONT, lineSpacingMultiple:1.35 });
}

// ════════════════════════════════════════════════════════════════════════════
// SLIDE 5 — Digital ID Integration (Real Code)
// ════════════════════════════════════════════════════════════════════════════
{
  const s = prs.addSlide();
  accentBar(s);
  footer(s, 5);
  sectionTitle(s, 'Digital ID Integration — CNIE → eSignet → DID:key → W3C VC');

  // Identity chain boxes
  const chain = [
    { label:'CNIE',         color:C.navy,  detail:'Morocco national ID\nbiometric + crypto cert' },
    { label:'MOSIP\neSignet', color:C.green, detail:'OIDC provider\nprivate_key_jwt (RFC 7523)' },
    { label:'DID:key',      color:C.amber, detail:'did:key:z6Mk...\nEd25519 multicodec' },
    { label:'W3C VC',       color:C.red,   detail:'Verifiable Credential\nEd25519Signature2020' },
  ];
  chain.forEach((c, i) => {
    const x = 0.45 + i * 3.15;
    s.addShape(prs.ShapeType.rect, { x, y:0.98, w:2.9, h:1.35,
      fill:{ color: c.color }, line:{ color: c.color }, rectRadius:0.08 });
    s.addText(c.label, { x:x+0.08, y:1.06, w:2.75, h:0.52,
      fontSize:15, bold:true, color:C.white, fontFace:FONT, align:'center' });
    s.addText(c.detail, { x:x+0.08, y:1.6, w:2.75, h:0.65,
      fontSize:9.5, color: i===2 ? C.body : C.white, fontFace:FONT,
      align:'center', lineSpacingMultiple:1.25 });
    if (i < 3) {
      s.addText('→', { x:x+2.9, y:1.44, w:0.25, h:0.35,
        fontSize:18, color:C.muted, fontFace:FONT, align:'center' });
    }
  });

  // Real code from credentials.ts
  s.addText('From packages/crypto/src/credentials.ts  (actual implementation)', {
    x:0.45, y:2.48, w:9, h:0.28,
    fontSize:9, color:C.muted, fontFace:FONT, italic:true });

  codeBlock(s,
`export function issueCredential(input: IssueCredentialInput): VerifiableCredential {
  const { type, issuerDid, issuerPrivateKey, subject, expirationDate } = input;
  extractPublicKey(issuerDid);                              // validate DID
  const verificationMethodId = resolveDID(issuerDid).assertionMethod[0]!;
  const serialized = deterministicSerialize(credentialWithoutProof);
  const hash       = sha256Hex(serialized);                 // SHA-256 integrity
  const proofValue = signPayload(new TextEncoder().encode(hash), issuerPrivateKey); // Ed25519
  return { ...credentialWithoutProof, proof: { type: "Ed25519Signature2020",
    created: now, verificationMethod: verificationMethodId,
    proofPurpose: "assertionMethod", proofValue } };
}`,
    { x:0.45, y:2.8, w:12.3, h:1.95, fontSize:8 });

  // 4 Credential types from actual code
  s.addText('4 Credential Types issued from @tml/crypto', {
    x:0.45, y:4.85, w:5, h:0.32,
    fontSize:11, bold:true, color:C.navy, fontFace:FONT });

  const credTypes = [
    ['ProfessionalEngineerCredential',   'Inspectors — licenseNumber, specialization, issuingAuthority'],
    ['AuditorAccreditationCredential',   'Auditors — accreditationBody, validRegions'],
    ['CNIEIdentityCredential',           'Citizens — cnieHash, verificationLevel (in_person | remote)'],
    ['DelegatedAuthorityCredential',     'Contractors — delegatedBy, scope, projectId'],
  ];
  credTypes.forEach(([type, detail], i) => {
    const y = 5.22 + i * 0.44;
    s.addShape(prs.ShapeType.rect, { x:0.45, y, w:12.3, h:0.38,
      fill:{ color: i%2===0 ? C.light : C.white }, line:{ color: C.border, pt:0.5 } });
    s.addShape(prs.ShapeType.rect, { x:0.45, y, w:0.055, h:0.38,
      fill:{ color: C.green }, line:{ color: C.green } });
    s.addText(type, { x:0.6, y:y+0.04, w:4.2, h:0.3,
      fontSize:9, bold:true, color:C.navy, fontFace:MONO });
    s.addText(detail, { x:4.85, y:y+0.04, w:7.8, h:0.3,
      fontSize:9, color:C.body, fontFace:FONT });
  });
}

// ════════════════════════════════════════════════════════════════════════════
// SLIDE 6 — System Architecture (from actual app.ts)
// ════════════════════════════════════════════════════════════════════════════
{
  const s = prs.addSlide();
  accentBar(s);
  footer(s, 6);
  sectionTitle(s, 'System Architecture — 19 Routes · 5 New Route Groups Added');

  // Layer stack — from actual app.ts
  const layers = [
    { label:'CLIENTS',
      items:'Web Browser (Desktop/Mobile)   ·   Basic Phone (USSD *384#)   ·   TGR System (Treasury)',
      bg:'EBF5FB', ac:'3498DB' },
    { label:'FRONTEND — Next.js 15 (App Router)',
      items:'shadcn/ui + Tailwind CSS 4  ·  next-intl: FR / AR / AMZ / EN (RTL support)  ·  React Query v5 + Zustand  ·  Pages: /login /dashboard /projects /verify /attest',
      bg:C.greenLt, ac:C.green },
    { label:'API — Fastify 5 / Node.js 22 TypeScript 5.5',
      items:'/auth  /projects  /milestones  /certificates  /attestations  /auditor-assignments  /citizen-pools\n/disputes  /ussd  /webhooks  /audit-logs  ✦NEW: /credentials  /trusted-issuers  /agent  /verify  /consent',
      bg:'EAF2FF', ac:C.navy },
    { label:'SERVICE LAYER  (Result<T,E> pattern — no thrown exceptions)',
      items:'Auth · Attestation · Certificate · Credentials · Consent · Verification · Agent · USSD\nAll services are framework-agnostic · Zod validation at every boundary',
      bg:C.amberLt, ac:C.amber },
    { label:'@tml/crypto — Crypto Package',
      items:'Ed25519 sign/verify  ·  SHA-256 hashing  ·  DID:key gen/resolve  ·  W3C VC issue/verify  ·  OpenID4VP  ·  Selective disclosure  ·  QR payload encode/decode',
      bg:C.redLt, ac:C.red },
    { label:'DATA LAYER',
      items:'PostgreSQL 16 via Prisma 6  ·  14 models  ·  Redis 7 (sessions, USSD state, OIDC discovery cache, rate limits)',
      bg:'F5F0FF', ac:C.purple },
  ];
  layers.forEach((l, i) => layerBox(s, l.label, l.items, 0.98 + i * 0.95, l.bg, l.ac));

  // External integrations
  s.addShape(prs.ShapeType.rect, { x:0.45, y:6.72, w:12.3, h:0.25,
    fill:{ color: C.navyDk }, line:{ color: C.navyDk }, rectRadius:0.04 });
  s.addText(
    'EXTERNAL  ·  MOSIP eSignet (OIDC identity)   ·   Africa\'s Talking (USSD gateway)   ·   TGR (certificate submission & fund release)',
    { x:0.6, y:6.73, w:12.0, h:0.22,
      fontSize:8.5, color:'8BA0BB', fontFace:FONT, align:'center', italic:true });
}

// ════════════════════════════════════════════════════════════════════════════
// SLIDE 7 — Technical Innovation (Real Code from 5 Plans)
// ════════════════════════════════════════════════════════════════════════════
{
  const s = prs.addSlide();
  accentBar(s);
  footer(s, 7);
  sectionTitle(s, 'Technical Innovation — 5 New Systems Built This Hackathon');

  // Left column: 5 new systems table
  const systems = [
    { tag:'Plan 1', title:'eSignet OIDC Hardening',       detail:'private_key_jwt (RFC 7523) · OIDC discovery caching in Redis · ACR assurance tracking on Actor model' },
    { tag:'Plan 2', title:'VC Issuance Pipeline',         detail:'Plugin-based CredentialsService · 4 credential types · IssuedCredential model · TrustedIssuerRegistry' },
    { tag:'Plan 3', title:'SSI Agent Integration',        detail:'W3C Verifiable Presentations · DIDComm-style connections · Connectionless credential offers · Proof requests' },
    { tag:'Plan 4', title:'OpenID4VP Verification',       detail:'QR payload encode/decode · Dual-mode verify (QR + OpenID4VP) · PresentationDefinition builder · Camera scanner' },
    { tag:'Plan 5', title:'Privacy, Consent & Access.',   detail:'ConsentRecord (Loi 09-08) · Selective disclosure (SD-JWT style) · USSD FR/AR/AMZ · RTL Arabic · A11y toggle' },
  ];
  systems.forEach((sys, i) => {
    const y = 0.98 + i * 1.1;
    s.addShape(prs.ShapeType.rect, { x:0.45, y, w:7.3, h:0.98,
      fill:{ color: i%2===0 ? C.light : C.white }, line:{ color: C.border, pt:0.5 }, rectRadius:0.06 });
    s.addShape(prs.ShapeType.rect, { x:0.45, y, w:0.055, h:0.98,
      fill:{ color: C.green }, line:{ color: C.green } });
    s.addShape(prs.ShapeType.rect, { x:0.6, y:y+0.07, w:0.72, h:0.26,
      fill:{ color: C.navy }, line:{ color: C.navy }, rectRadius:0.04 });
    s.addText(sys.tag, { x:0.6, y:y+0.07, w:0.72, h:0.26,
      fontSize:8, bold:true, color:C.white, fontFace:FONT, align:'center' });
    s.addText(sys.title, { x:1.4, y:y+0.06, w:6.25, h:0.3,
      fontSize:10.5, bold:true, color:C.navy, fontFace:FONT });
    s.addText(sys.detail, { x:0.6, y:y+0.4, w:7.1, h:0.53,
      fontSize:9, color:C.body, fontFace:FONT, lineSpacingMultiple:1.25 });
  });

  // Right column: real code from consent.service.ts + selective-disclosure.ts
  s.addText('From apps/api/src/services/consent.service.ts', {
    x:8.0, y:0.98, w:5.2, h:0.26,
    fontSize:8.5, color:C.muted, fontFace:FONT, italic:true });

  codeBlock(s,
`async grantConsent(params: {
  actorId: string;  purpose: ConsentPurpose;
  legalBasis: string; ttlDays?: number;
}): Promise<Result<ConsentRecord>> {
  const existing = await this.repo
    .findByActorAndPurpose(params.actorId, params.purpose);
  if (existing?.status === 'granted') return ok(existing);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + (params.ttlDays ?? 365));
  return ok(await this.repo.create({ ...params, status:'granted', expiresAt }));
}`,
    { x:8.0, y:1.27, w:5.2, h:1.9, fontSize:7.5 });

  s.addText('From packages/crypto/src/selective-disclosure.ts', {
    x:8.0, y:3.25, w:5.2, h:0.26,
    fontSize:8.5, color:C.muted, fontFace:FONT, italic:true });

  codeBlock(s,
`export function deriveSelectiveCredential(
  input: SelectiveDisclosureInput
): DerivedCredential {
  for (const [key, value] of Object.entries(subject)) {
    if (key === "id") { disclosed[key] = value; }
    else if (disclosedFields.includes(key)) { disclosed[key] = value; }
    else {
      // redact — store H(salt + key + value)
      redactedHashes[key] = sha256Hex(
        \`\${salt}:\${key}:\${JSON.stringify(value)}\`);
    }
  }
  const disclosureProof = sha256Hex(
    \`\${originalHash}:\${disclosedFields.sort().join(",")}\`);
}`,
    { x:8.0, y:3.54, w:5.2, h:2.5, fontSize:7.5 });

  // Stats badges
  const badges = [
    { val:'57', lbl:'API\nendpoints' },
    { val:'19', lbl:'Route\nregistrations' },
    { val:'14', lbl:'Database\nmodels' },
    { val:'433+', lbl:'Tests\npassing' },
  ];
  badges.forEach((b, i) => {
    statCard(s, b.val, b.lbl, 0.45 + i*1.87, 6.2, 1.72, C.navy);
  });
}

// ════════════════════════════════════════════════════════════════════════════
// SLIDE 8 — African Context (Database Schema Evidence)
// ════════════════════════════════════════════════════════════════════════════
{
  const s = prs.addSlide();
  accentBar(s);
  footer(s, 8);
  sectionTitle(s, 'African Context: Built Local-First');

  // Left: Morocco
  s.addText('Morocco Alignment', {
    x:0.45, y:0.98, w:6.0, h:0.38,
    fontSize:13, bold:true, color:C.navy, fontFace:FONT });

  const morocco = [
    ['Digital Morocco 2030',   'TML digitizes a critical government process end-to-end (e-Gov pillar).'],
    ['CNIE Integration',       "Morocco's CNIE is TML's root-of-trust via MOSIP eSignet OIDC."],
    ['TGR Integration',        'PCC is designed as a mandatory pre-condition for TGR disbursement.'],
    ['FIFA 2030',              '$41B infrastructure at risk — TML provides the accountability layer.'],
    ['Law 09-08 Compliance',   'ConsentRecord model (Loi 09-08 Art. 4) + data-minimization middleware.'],
    ['Multilingual',           'USSD + web UI in French, Arabic (full RTL), Amazigh (Tifinagh), English.'],
  ];
  morocco.forEach(([title, body], i) => {
    const y = 1.4 + i * 0.84;
    s.addShape(prs.ShapeType.rect, { x:0.45, y, w:6.0, h:0.76,
      fill:{ color: i%2===0 ? C.light : C.white }, line:{ color: C.border, pt:0.5 } });
    s.addShape(prs.ShapeType.rect, { x:0.45, y, w:0.055, h:0.76,
      fill:{ color: C.green }, line:{ color: C.green } });
    s.addText(title, { x:0.6, y:y+0.06, w:5.75, h:0.26,
      fontSize:10, bold:true, color:C.navy, fontFace:FONT });
    s.addText(body, { x:0.6, y:y+0.34, w:5.75, h:0.36,
      fontSize:9, color:C.body, fontFace:FONT, lineSpacingMultiple:1.2 });
  });

  // Right: Database schema evidence from actual prisma schema
  s.addText('Actual Schema Models (packages/database/prisma/schema.prisma)', {
    x:6.7, y:0.98, w:6.1, h:0.28,
    fontSize:9, color:C.muted, fontFace:FONT, italic:true });

  codeBlock(s,
`// ✦ NEW models added this hackathon

model IssuedCredential {      // Plan 2 — VC issuance pipeline
  id, holderDid, holderActorId, credentialType,
  credentialJson, credentialHash, status
  expiresAt, revokedAt, revocationReason
}

model AgentConnection {       // Plan 3 — SSI agent integration
  id, initiatorDid, responderDid, state
  (invited → connected → active → closed)
}

model ConsentRecord {          // Plan 5 — Loi 09-08 consent
  actorId, purpose, scope, legalBasis, status
  (granted → revoked → expired)
  expiresAt, ipAddress, userAgent
}

model CredentialSchema {       // Plan 3 — schema definitions
  credentialType, attributes[], requiredFields[]
}`,
    { x:6.7, y:1.3, w:6.1, h:3.6, fontSize:8 });

  // USSD sample (Amazigh)
  s.addText('USSD Amazigh (ⵜⴰⵎⴰⵣⵉⵖⵜ) — ussd-locales.ts', {
    x:6.7, y:5.08, w:6.1, h:0.28,
    fontSize:9, color:C.muted, fontFace:FONT, italic:true });

  codeBlock(s,
`// Plan 5 — apps/api/src/modules/ussd/ussd-locales.ts
amz: {
  welcome:      'CON ⴰⵣⵓⵍ ⴳ TML\\n1. ⵙⵏⵊⵎ ⴰⵙⵏⴼⴰⵔ\\n2. ⵜⵉⵡⵉⵙⵉ',
  votePrompt:   (p, m) => \`CON \${p}, ⵜⴰⴼⵓⵍⵜ: \${m}
    1. ⵢⴰⵀ, ⵉⵅⴷⴷⵎⵏ (Yes)   2. ⵓⵀⵓ (No)   3. ⵓⵔ ⵙⵙⵉⵏⵖ\`,
  attestationSuccess: (ref) =>
    \`END ⵜⴰⵏⵎⵎⵉⵔⵜ! ⵉⵜⵜⵓⵙⴽⵜⴱ. ⴰⵎⴰⵜⴰⵔ: \${ref}\`,
}`,
    { x:6.7, y:5.38, w:6.1, h:1.42, fontSize:7.5 });
}

// ════════════════════════════════════════════════════════════════════════════
// SLIDE 9 — Impact Metrics
// ════════════════════════════════════════════════════════════════════════════
{
  const s = prs.addSlide();
  accentBar(s);
  footer(s, 9);
  sectionTitle(s, 'Impact Metrics: Before and After TML');

  // Before/After table
  const rows = [
    ['Milestone verification time',     '2–6 weeks (paper + travel)',       'Under 24 hours'],
    ['Cost per verification',           '~$500 (stamps, courier, travel)',   '~$5 (digital)'],
    ['Citizen participation',           '0%',                                '60–80% via USSD + web'],
    ['Fraud detection',                 'Post-hoc audit only',               'Real-time — missing attestation = blocked funds'],
    ['Forgery resistance',              'Low (paper + single party)',        'Cryptographic (Ed25519 + SHA-256)'],
    ['Rural accessibility',             'None',                              'Full — USSD on any GSM phone'],
    ['Irregularity detection lag',      'Months to years',                  'Immediate — funds blocked automatically'],
    ['Auditor capture resistance',      'Manual assignment (capture-prone)', 'Cryptographic rotation + conflict exclusions'],
  ];

  const tableData = [
    [
      { text:'Metric', options:{ bold:true, color:C.white, fill:{ color:C.navy }, fontSize:10, fontFace:FONT } },
      { text:'BEFORE  (current state)', options:{ bold:true, color:C.white, fill:{ color:C.red }, fontSize:10, fontFace:FONT } },
      { text:'AFTER  (with TML)', options:{ bold:true, color:C.white, fill:{ color:C.green }, fontSize:10, fontFace:FONT } },
    ],
    ...rows.map(([m, b, a], i) => [
      { text:m, options:{ bold:true, color:C.navy,  fontSize:9.5, fontFace:FONT, fill:{ color: i%2===0 ? C.light : C.white } } },
      { text:b, options:{ color:'991B1B',            fontSize:9.5, fontFace:FONT, fill:{ color: i%2===0 ? 'FEF2F2' : C.white } } },
      { text:a, options:{ color:'166534',            fontSize:9.5, fontFace:FONT, fill:{ color: i%2===0 ? 'ECFDF5' : C.white } } },
    ]),
  ];

  s.addTable(tableData, {
    x:0.45, y:0.98, w:12.3, h:5.2,
    colW:[4.0, 3.5, 4.8],
    border:{ type:'solid', pt:0.5, color:C.border },
    autoPage:false,
  });

  // SDG row
  s.addShape(prs.ShapeType.rect, { x:0.45, y:6.28, w:12.3, h:0.58,
    fill:{ color: C.navy }, line:{ color: C.navy }, rectRadius:0.06 });
  s.addText(
    'SDG 9 — Infrastructure  ·  SDG 11 — Sustainable Cities  ·  SDG 16 — Accountable Institutions  ' +
    '|  AU Agenda 2063: Aspirations 1, 3, 6, 7  |  ' +
    'Morocco Digital 2030  ·  Idarati X.0  ·  Law No. 31-13 (Transparency)',
    { x:0.6, y:6.31, w:12.0, h:0.52,
      fontSize:9, color:'B0C4DE', fontFace:FONT, align:'center' });
}

// ════════════════════════════════════════════════════════════════════════════
// SLIDE 10 — The Ask
// ════════════════════════════════════════════════════════════════════════════
{
  const s = prs.addSlide();

  // Navy background
  s.addShape(prs.ShapeType.rect, { x:0, y:0, w:'100%', h:'100%',
    fill:{ color: C.navy }, line:{ color: C.navy } });

  // Green left stripe
  s.addShape(prs.ShapeType.rect, { x:0, y:0, w:0.12, h:'100%',
    fill:{ color: C.green }, line:{ color: C.green } });

  accentBar(s, C.green, 0);
  pgNum(s, 10);
  s.addText('TML  ·  Transparency Middleware Layer', {
    x:0.4, y:7.15, w:9, h:0.25,
    fontSize:8, color:'547091', fontFace:FONT });

  s.addText('What TML Needs to Go from Prototype to Production', {
    x:0.5, y:0.32, w:12.3, h:0.52,
    fontSize:17, bold:true, color:C.white, fontFace:FONT, align:'center' });

  const asks = [
    { n:'1', title:'Pilot Partnership with TGR',
      detail:'Access to a single prefecture\'s infrastructure project pipeline for a ' +
             '6-month controlled deployment. TML will prove that cryptographic milestone ' +
             'verification reduces fraud and accelerates disbursement timelines.',
      color:C.green },
    { n:'2', title:'MOSIP Sandbox Access',
      detail:'Full eSignet sandbox environment with CNIE test credentials for ' +
             'integration testing and live demo at ID4Africa AGM. Ongoing API access ' +
             'for the Inji Certify / Inji Verify stack.',
      color:C.amber },
    { n:'3', title:'CMU-Africa Research Partnership',
      detail:'Collaboration measuring TML\'s impact on public accountability metrics: ' +
             'citizen participation rates, verification time reduction, fraud deterrence, ' +
             'and replication across other MOSIP-adopting nations.',
      color:C.red },
    { n:'4', title:"Africa's Talking Partnership",
      detail:'Expanded USSD shortcode allocation for pilot regions and reduced-rate SMS ' +
             'for citizen notifications. Critical for rural inclusion — 70% of Moroccan ' +
             'rural residents use basic phones without internet.',
      color:C.purple },
  ];

  asks.forEach((a, i) => {
    const x = 0.35 + (i % 2) * 6.5;
    const y = 1.0 + Math.floor(i / 2) * 2.55;
    s.addShape(prs.ShapeType.rect, { x, y, w:6.1, h:2.3,
      fill:{ color: C.navyMd }, line:{ color: a.color, pt:2 }, rectRadius:0.1 });
    s.addShape(prs.ShapeType.rect, { x, y, w:0.55, h:2.3,
      fill:{ color: a.color }, line:{ color: a.color }, rectRadius:0.1 });
    s.addText(a.n, { x:x+0.07, y:y+0.85, w:0.42, h:0.55,
      fontSize:18, bold:true, color:C.white, fontFace:FONT, align:'center' });
    s.addText(a.title, { x:x+0.65, y:y+0.1, w:5.35, h:0.45,
      fontSize:12, bold:true, color:C.white, fontFace:FONT });
    s.addText(a.detail, { x:x+0.65, y:y+0.6, w:5.3, h:1.62,
      fontSize:9.5, color:'B0C4DE', fontFace:FONT, lineSpacingMultiple:1.3 });
  });

  // Final quote
  s.addShape(prs.ShapeType.rect, { x:0.35, y:6.2, w:12.5, h:0.8,
    fill:{ color: C.navyDk }, line:{ color: C.green, pt:1.5 }, rectRadius:0.07 });
  s.addText(
    '"We did not build another credential wallet.\n' +
    'We built the missing accountability layer between public money and public work."',
    { x:0.5, y:6.24, w:12.2, h:0.72,
      fontSize:11, color:C.white, fontFace:FONT, italic:true, align:'center',
      lineSpacingMultiple:1.5 });
}

// ─── Write output ─────────────────────────────────────────────────────────────
const outputPath = 'docs/presentation/TML_Presentation.pptx';
await prs.writeFile({ fileName: outputPath });
console.log(`\n✓  Saved: ${outputPath}`);
console.log('   10 slides — Upanzi / ID4Africa Digital ID Hackathon 2026');
console.log('   Design: Navy #1E3A5F · Green #2D8A4E · Flat solid colors (no gradients)\n');
