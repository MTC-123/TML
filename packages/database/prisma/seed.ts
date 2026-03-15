import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.log("Seeding TML database...");

  // ─── Actors (10 across all roles) ──────────────────────────────────────────

  const actorAdmin = await prisma.actor.create({
    data: {
      did: "did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK",
      cnieHash: "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2",
      roles: ["admin"],
    },
  });

  const actorContractor1 = await prisma.actor.create({
    data: {
      did: "did:key:z6MknGc3ocHs3zdPiJbnaaqDi58NGb4pk1Sp7eTafHQBTGhj",
      cnieHash: "b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3",
      roles: ["contractor_engineer"],
    },
  });

  const actorContractor2 = await prisma.actor.create({
    data: {
      did: "did:key:z6MkpTHR8VNs5zPBGhLm7Fjwka7eU1prUYnsMt3YQZ3Fz7io",
      cnieHash: "c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4",
      roles: ["contractor_engineer"],
    },
  });

  const actorAuditor1 = await prisma.actor.create({
    data: {
      did: "did:key:z6MkrHKzgsahxBLyNAbLQyB1pcWNYC9GmywiWPgkrvntAZcj",
      cnieHash: "d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5",
      roles: ["independent_auditor"],
    },
  });

  const actorAuditor2 = await prisma.actor.create({
    data: {
      did: "did:key:z6MksU6tMfbaDzvaRe5oFE4eZTVTV4HJM4fmQWWGsDGQVsEr",
      cnieHash: "e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6",
      roles: ["independent_auditor"],
    },
  });

  const actorCitizen1 = await prisma.actor.create({
    data: {
      did: "did:key:z6Mkw6BZWh2yCJW8pQ7a5j4Y3GfRMxCn9RLaF2FNdXvPz1vS",
      cnieHash: "f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1",
      roles: ["citizen"],
    },
  });

  const actorCitizen2 = await prisma.actor.create({
    data: {
      did: "did:key:z6MkjchhfUsD6mmvni8mCdXHw216Xrm9bQe2xDmBKEbz3dqS",
      cnieHash: "a2b3c4d5e6f7a2b3c4d5e6f7a2b3c4d5e6f7a2b3c4d5e6f7a2b3c4d5e6f7a2b3",
      roles: ["citizen"],
    },
  });

  const actorCitizen3 = await prisma.actor.create({
    data: {
      did: "did:key:z6MknSLrJoTcukLrE435hVNQT4JUhbvWLX4kUzqkEStBU8Vi",
      cnieHash: "b3c4d5e6f7a2b3c4d5e6f7a2b3c4d5e6f7a2b3c4d5e6f7a2b3c4d5e6f7a2b3c4",
      roles: ["citizen"],
    },
  });

  const actorCitizen4 = await prisma.actor.create({
    data: {
      did: "did:key:z6MkoTHsgNNrby8JzCNQ1iRLyW5QQ6R8Xuu6AA8igGrMVPUM",
      cnieHash: "c4d5e6f7a2b3c4d5e6f7a2b3c4d5e6f7a2b3c4d5e6f7a2b3c4d5e6f7a2b3c4d5",
      roles: ["citizen"],
    },
  });

  const actorCso = await prisma.actor.create({
    data: {
      did: "did:key:z6MkiTBz1ymuepAQ4HEHYSF1H8quG5GLVVQR3djdX3mDooWp",
      cnieHash: "d5e6f7a2b3c4d5e6f7a2b3c4d5e6f7a2b3c4d5e6f7a2b3c4d5e6f7a2b3c4d5e6",
      roles: ["cso_aggregator"],
    },
  });

  console.log("  Created 10 actors");

  // ─── Organizations ─────────────────────────────────────────────────────────

  const orgEngineering = await prisma.organization.create({
    data: {
      name: "Atlas BTP Solutions",
      registrationHash: "1111111111111111111111111111111111111111111111111111111111111111",
      type: "engineering_firm",
    },
  });

  const orgConstruction = await prisma.organization.create({
    data: {
      name: "Sahara Construction Group",
      registrationHash: "2222222222222222222222222222222222222222222222222222222222222222",
      type: "construction_company",
    },
  });

  const orgCso = await prisma.organization.create({
    data: {
      name: "Transparency Maroc",
      registrationHash: "3333333333333333333333333333333333333333333333333333333333333333",
      type: "cso",
    },
  });

  const orgGov = await prisma.organization.create({
    data: {
      name: "Ministere de l'Equipement et de l'Eau",
      registrationHash: "4444444444444444444444444444444444444444444444444444444444444444",
      type: "government_body",
    },
  });

  console.log("  Created 4 organizations");

  // ─── Actor-Organization links ──────────────────────────────────────────────

  const orgLinkStart = new Date("2025-01-01");

  await prisma.actorOrganization.createMany({
    data: [
      { actorId: actorContractor1.id, organizationId: orgEngineering.id, role: "Lead Engineer", validFrom: orgLinkStart },
      { actorId: actorContractor2.id, organizationId: orgConstruction.id, role: "Site Manager", validFrom: orgLinkStart },
      { actorId: actorAuditor1.id, organizationId: orgGov.id, role: "Senior Inspector", validFrom: orgLinkStart },
      { actorId: actorAuditor2.id, organizationId: orgGov.id, role: "Inspector", validFrom: orgLinkStart },
      { actorId: actorCso.id, organizationId: orgCso.id, role: "Director", validFrom: orgLinkStart },
    ],
  });

  console.log("  Created 5 actor-organization links");

  // ─── Projects ──────────────────────────────────────────────────────────────

  // Ifrane road boundary (approximate polygon around N8 road section)
  const ifraneBoundary = [
    { lat: 33.5228, lng: -5.1100 },
    { lat: 33.5350, lng: -5.1100 },
    { lat: 33.5350, lng: -5.0950 },
    { lat: 33.5228, lng: -5.0950 },
  ];

  const projectRoad = await prisma.project.create({
    data: {
      name: "Route Nationale N8 — Segment Ifrane-Azrou",
      region: "Fes-Meknes",
      budget: 45000000.00,
      donor: "Banque Africaine de Developpement",
      status: "active",
      boundary: ifraneBoundary,
    },
  });

  // Casablanca stadium boundary (approximate polygon)
  const casaBoundary = [
    { lat: 33.5900, lng: -7.6200 },
    { lat: 33.5950, lng: -7.6200 },
    { lat: 33.5950, lng: -7.6150 },
    { lat: 33.5900, lng: -7.6150 },
  ];

  const projectStadium = await prisma.project.create({
    data: {
      name: "Renovation Stade Mohammed V — Casablanca",
      region: "Casablanca-Settat",
      budget: 120000000.00,
      status: "active",
      boundary: casaBoundary,
    },
  });

  console.log("  Created 2 projects");

  // ─── Milestones (5 per project) ────────────────────────────────────────────

  const roadMilestones = await Promise.all([
    prisma.milestone.create({
      data: {
        projectId: projectRoad.id,
        sequenceNumber: 1,
        description: "Terrain clearing and earthworks for 12km road segment",
        deadline: new Date("2025-06-30"),
        status: "completed",
      },
    }),
    prisma.milestone.create({
      data: {
        projectId: projectRoad.id,
        sequenceNumber: 2,
        description: "Sub-base and base course installation",
        deadline: new Date("2025-09-30"),
        status: "attestation_in_progress",
      },
    }),
    prisma.milestone.create({
      data: {
        projectId: projectRoad.id,
        sequenceNumber: 3,
        description: "Asphalt paving and surface treatment",
        deadline: new Date("2025-12-31"),
        status: "pending",
      },
    }),
    prisma.milestone.create({
      data: {
        projectId: projectRoad.id,
        sequenceNumber: 4,
        description: "Road marking, signage, and safety barriers",
        deadline: new Date("2026-03-31"),
        status: "pending",
      },
    }),
    prisma.milestone.create({
      data: {
        projectId: projectRoad.id,
        sequenceNumber: 5,
        description: "Final inspection and handover to regional authority",
        deadline: new Date("2026-06-30"),
        status: "pending",
      },
    }),
  ]);

  const stadiumMilestones = await Promise.all([
    prisma.milestone.create({
      data: {
        projectId: projectStadium.id,
        sequenceNumber: 1,
        description: "Demolition of damaged seating sections and structural assessment",
        deadline: new Date("2025-05-31"),
        status: "completed",
      },
    }),
    prisma.milestone.create({
      data: {
        projectId: projectStadium.id,
        sequenceNumber: 2,
        description: "Reinforced concrete framework for east and west stands",
        deadline: new Date("2025-08-31"),
        status: "completed",
      },
    }),
    prisma.milestone.create({
      data: {
        projectId: projectStadium.id,
        sequenceNumber: 3,
        description: "Roofing structure and waterproof membrane installation",
        deadline: new Date("2025-11-30"),
        status: "attestation_in_progress",
      },
    }),
    prisma.milestone.create({
      data: {
        projectId: projectStadium.id,
        sequenceNumber: 4,
        description: "Electrical systems, floodlights, and emergency exits",
        deadline: new Date("2026-02-28"),
        status: "pending",
      },
    }),
    prisma.milestone.create({
      data: {
        projectId: projectStadium.id,
        sequenceNumber: 5,
        description: "Seating installation and final safety certification",
        deadline: new Date("2026-05-31"),
        status: "pending",
      },
    }),
  ]);

  console.log("  Created 10 milestones (5 per project)");

  // ─── Auditor Assignments ───────────────────────────────────────────────────

  // Road milestone 1 (completed) — auditor1 completed
  await prisma.auditorAssignment.create({
    data: {
      milestoneId: roadMilestones[0]!.id,
      auditorId: actorAuditor1.id,
      rotationRound: 1,
      status: "completed",
    },
  });

  // Road milestone 2 (attestation in progress) — auditor2 accepted
  await prisma.auditorAssignment.create({
    data: {
      milestoneId: roadMilestones[1]!.id,
      auditorId: actorAuditor2.id,
      rotationRound: 1,
      status: "accepted",
    },
  });

  // Stadium milestone 1 (completed) — auditor2 completed
  await prisma.auditorAssignment.create({
    data: {
      milestoneId: stadiumMilestones[0]!.id,
      auditorId: actorAuditor2.id,
      rotationRound: 1,
      status: "completed",
    },
  });

  // Stadium milestone 2 (completed) — auditor1 completed
  await prisma.auditorAssignment.create({
    data: {
      milestoneId: stadiumMilestones[1]!.id,
      auditorId: actorAuditor1.id,
      rotationRound: 1,
      status: "completed",
    },
  });

  // Stadium milestone 3 (attestation in progress) — auditor1 accepted
  await prisma.auditorAssignment.create({
    data: {
      milestoneId: stadiumMilestones[2]!.id,
      auditorId: actorAuditor1.id,
      rotationRound: 1,
      status: "accepted",
    },
  });

  console.log("  Created 5 auditor assignments");

  // ─── Citizen Pools ─────────────────────────────────────────────────────────

  // Road milestone 1 — 3 citizens attested (quorum met)
  for (const [citizen, tier] of [
    [actorCitizen1, "biometric"],
    [actorCitizen2, "ussd"],
    [actorCitizen3, "cso_mediated"],
  ] as const) {
    await prisma.citizenPool.create({
      data: {
        milestoneId: roadMilestones[0]!.id,
        citizenId: citizen.id,
        proximityProofHash: `aa${citizen.cnieHash.slice(2)}`,
        assuranceTier: tier,
        status: "attested",
      },
    });
  }

  // Road milestone 2 — 2 citizens enrolled (quorum not yet met)
  for (const [citizen, tier] of [
    [actorCitizen1, "biometric"],
    [actorCitizen4, "ussd"],
  ] as const) {
    await prisma.citizenPool.create({
      data: {
        milestoneId: roadMilestones[1]!.id,
        citizenId: citizen.id,
        proximityProofHash: `bb${citizen.cnieHash.slice(2)}`,
        assuranceTier: tier,
        status: "enrolled",
      },
    });
  }

  // Stadium milestone 1 — 3 citizens attested (quorum met)
  for (const [citizen, tier] of [
    [actorCitizen2, "biometric"],
    [actorCitizen3, "biometric"],
    [actorCitizen4, "ussd"],
  ] as const) {
    await prisma.citizenPool.create({
      data: {
        milestoneId: stadiumMilestones[0]!.id,
        citizenId: citizen.id,
        proximityProofHash: `cc${citizen.cnieHash.slice(2)}`,
        assuranceTier: tier,
        status: "attested",
      },
    });
  }

  // Stadium milestone 2 — 3 citizens attested (quorum met)
  for (const [citizen, tier] of [
    [actorCitizen1, "biometric"],
    [actorCitizen2, "ussd"],
    [actorCitizen3, "biometric"],
  ] as const) {
    await prisma.citizenPool.create({
      data: {
        milestoneId: stadiumMilestones[1]!.id,
        citizenId: citizen.id,
        proximityProofHash: `dd${citizen.cnieHash.slice(2)}`,
        assuranceTier: tier,
        status: "attested",
      },
    });
  }

  console.log("  Created 11 citizen pool entries");

  // ─── Attestations ──────────────────────────────────────────────────────────

  const fakeSig = "MEUCIQDxN2Rkz8eS1bvFnk8AJ3P9t3CrklcjKp5y1g0TQv6a7gIgVP8sx";

  // Road milestone 1 — FULLY ATTESTED (inspector + auditor + 3 citizens)
  await prisma.attestation.createMany({
    data: [
      {
        milestoneId: roadMilestones[0]!.id,
        actorId: actorAuditor1.id,
        type: "inspector_verification",
        evidenceHash: "aaaa000000000000000000000000000000000000000000000000000000000001",
        gpsLatitude: 33.5289,
        gpsLongitude: -5.1025,
        deviceAttestationToken: "android-key-att-v3-road-m1-insp",
        digitalSignature: fakeSig,
        status: "verified",
      },
      {
        milestoneId: roadMilestones[0]!.id,
        actorId: actorAuditor1.id,
        type: "auditor_review",
        evidenceHash: "aaaa000000000000000000000000000000000000000000000000000000000002",
        gpsLatitude: 33.5289,
        gpsLongitude: -5.1025,
        deviceAttestationToken: "android-key-att-v3-road-m1-audit",
        digitalSignature: fakeSig,
        status: "verified",
      },
      {
        milestoneId: roadMilestones[0]!.id,
        actorId: actorCitizen1.id,
        type: "citizen_approval",
        evidenceHash: "aaaa000000000000000000000000000000000000000000000000000000000003",
        gpsLatitude: 33.5300,
        gpsLongitude: -5.1010,
        deviceAttestationToken: "android-key-att-v3-road-m1-cit1",
        digitalSignature: fakeSig,
        status: "verified",
      },
      {
        milestoneId: roadMilestones[0]!.id,
        actorId: actorCitizen2.id,
        type: "citizen_approval",
        evidenceHash: "aaaa000000000000000000000000000000000000000000000000000000000004",
        gpsLatitude: 33.5295,
        gpsLongitude: -5.1015,
        deviceAttestationToken: "ussd-att-road-m1-cit2",
        digitalSignature: fakeSig,
        status: "verified",
      },
      {
        milestoneId: roadMilestones[0]!.id,
        actorId: actorCitizen3.id,
        type: "citizen_approval",
        evidenceHash: "aaaa000000000000000000000000000000000000000000000000000000000005",
        gpsLatitude: 33.5310,
        gpsLongitude: -5.1020,
        deviceAttestationToken: "cso-mediated-att-road-m1-cit3",
        digitalSignature: fakeSig,
        status: "verified",
      },
    ],
  });

  // Road milestone 2 — PARTIAL (inspector only, attestation in progress)
  await prisma.attestation.create({
    data: {
      milestoneId: roadMilestones[1]!.id,
      actorId: actorAuditor2.id,
      type: "inspector_verification",
      evidenceHash: "bbbb000000000000000000000000000000000000000000000000000000000001",
      gpsLatitude: 33.5310,
      gpsLongitude: -5.0990,
      deviceAttestationToken: "android-key-att-v3-road-m2-insp",
      digitalSignature: fakeSig,
      status: "submitted",
    },
  });

  // Stadium milestone 1 — FULLY ATTESTED
  await prisma.attestation.createMany({
    data: [
      {
        milestoneId: stadiumMilestones[0]!.id,
        actorId: actorAuditor2.id,
        type: "inspector_verification",
        evidenceHash: "cccc000000000000000000000000000000000000000000000000000000000001",
        gpsLatitude: 33.5925,
        gpsLongitude: -7.6175,
        deviceAttestationToken: "android-key-att-v3-stad-m1-insp",
        digitalSignature: fakeSig,
        status: "verified",
      },
      {
        milestoneId: stadiumMilestones[0]!.id,
        actorId: actorAuditor2.id,
        type: "auditor_review",
        evidenceHash: "cccc000000000000000000000000000000000000000000000000000000000002",
        gpsLatitude: 33.5925,
        gpsLongitude: -7.6175,
        deviceAttestationToken: "android-key-att-v3-stad-m1-audit",
        digitalSignature: fakeSig,
        status: "verified",
      },
      {
        milestoneId: stadiumMilestones[0]!.id,
        actorId: actorCitizen2.id,
        type: "citizen_approval",
        evidenceHash: "cccc000000000000000000000000000000000000000000000000000000000003",
        gpsLatitude: 33.5930,
        gpsLongitude: -7.6170,
        deviceAttestationToken: "android-key-att-v3-stad-m1-cit2",
        digitalSignature: fakeSig,
        status: "verified",
      },
      {
        milestoneId: stadiumMilestones[0]!.id,
        actorId: actorCitizen3.id,
        type: "citizen_approval",
        evidenceHash: "cccc000000000000000000000000000000000000000000000000000000000004",
        gpsLatitude: 33.5928,
        gpsLongitude: -7.6172,
        deviceAttestationToken: "android-key-att-v3-stad-m1-cit3",
        digitalSignature: fakeSig,
        status: "verified",
      },
      {
        milestoneId: stadiumMilestones[0]!.id,
        actorId: actorCitizen4.id,
        type: "citizen_approval",
        evidenceHash: "cccc000000000000000000000000000000000000000000000000000000000005",
        gpsLatitude: 33.5932,
        gpsLongitude: -7.6168,
        deviceAttestationToken: "ussd-att-stad-m1-cit4",
        digitalSignature: fakeSig,
        status: "verified",
      },
    ],
  });

  // Stadium milestone 2 — FULLY ATTESTED
  await prisma.attestation.createMany({
    data: [
      {
        milestoneId: stadiumMilestones[1]!.id,
        actorId: actorAuditor1.id,
        type: "inspector_verification",
        evidenceHash: "dddd000000000000000000000000000000000000000000000000000000000001",
        gpsLatitude: 33.5926,
        gpsLongitude: -7.6176,
        deviceAttestationToken: "android-key-att-v3-stad-m2-insp",
        digitalSignature: fakeSig,
        status: "verified",
      },
      {
        milestoneId: stadiumMilestones[1]!.id,
        actorId: actorAuditor1.id,
        type: "auditor_review",
        evidenceHash: "dddd000000000000000000000000000000000000000000000000000000000002",
        gpsLatitude: 33.5926,
        gpsLongitude: -7.6176,
        deviceAttestationToken: "android-key-att-v3-stad-m2-audit",
        digitalSignature: fakeSig,
        status: "verified",
      },
      {
        milestoneId: stadiumMilestones[1]!.id,
        actorId: actorCitizen1.id,
        type: "citizen_approval",
        evidenceHash: "dddd000000000000000000000000000000000000000000000000000000000003",
        gpsLatitude: 33.5930,
        gpsLongitude: -7.6170,
        deviceAttestationToken: "android-key-att-v3-stad-m2-cit1",
        digitalSignature: fakeSig,
        status: "verified",
      },
      {
        milestoneId: stadiumMilestones[1]!.id,
        actorId: actorCitizen2.id,
        type: "citizen_approval",
        evidenceHash: "dddd000000000000000000000000000000000000000000000000000000000004",
        gpsLatitude: 33.5931,
        gpsLongitude: -7.6171,
        deviceAttestationToken: "ussd-att-stad-m2-cit2",
        digitalSignature: fakeSig,
        status: "verified",
      },
      {
        milestoneId: stadiumMilestones[1]!.id,
        actorId: actorCitizen3.id,
        type: "citizen_approval",
        evidenceHash: "dddd000000000000000000000000000000000000000000000000000000000005",
        gpsLatitude: 33.5929,
        gpsLongitude: -7.6174,
        deviceAttestationToken: "android-key-att-v3-stad-m2-cit3",
        digitalSignature: fakeSig,
        status: "verified",
      },
    ],
  });

  console.log("  Created 16 attestations");

  // ─── Compliance Certificates ───────────────────────────────────────────────

  // Road milestone 1 — fully certified, delivered to TGR
  await prisma.complianceCertificate.create({
    data: {
      milestoneId: roadMilestones[0]!.id,
      certificateHash: "cert0001aabbccdd0001aabbccdd0001aabbccdd0001aabbccdd0001aabbccdd",
      digitalSignature: fakeSig,
      status: "delivered_to_tgr",
      tgrReference: "TGR-2025-FMK-00147",
    },
  });

  // Stadium milestone 1 — issued, not yet delivered
  await prisma.complianceCertificate.create({
    data: {
      milestoneId: stadiumMilestones[0]!.id,
      certificateHash: "cert0002aabbccdd0002aabbccdd0002aabbccdd0002aabbccdd0002aabbccdd",
      digitalSignature: fakeSig,
      status: "issued",
    },
  });

  // Stadium milestone 2 — issued, delivered
  await prisma.complianceCertificate.create({
    data: {
      milestoneId: stadiumMilestones[1]!.id,
      certificateHash: "cert0003aabbccdd0003aabbccdd0003aabbccdd0003aabbccdd0003aabbccdd",
      digitalSignature: fakeSig,
      status: "delivered_to_tgr",
      tgrReference: "TGR-2025-CST-00289",
    },
  });

  console.log("  Created 3 compliance certificates");

  // ─── Dispute Resolution ────────────────────────────────────────────────────

  // Stadium milestone 3 — disputed by citizen (roofing quality concerns)
  await prisma.disputeResolution.create({
    data: {
      milestoneId: stadiumMilestones[2]!.id,
      raisedById: actorCitizen1.id,
      reason: "Visible water infiltration observed under newly installed roofing membrane in section E3. Photographic evidence submitted. Requesting independent re-inspection before attestation proceeds.",
      status: "open",
    },
  });

  console.log("  Created 1 dispute resolution");

  // ─── Trusted Issuer Registry ───────────────────────────────────────────────

  await prisma.trustedIssuerRegistry.createMany({
    data: [
      {
        issuerDid: "did:key:z6MkqRYqQiSgvZQdnBytw86Qbs2ZWUkGv22od935YF4s8M7V",
        issuerName: "MOSIP Morocco Instance",
        credentialTypes: ["IdentityCredential", "CNIEVerification"],
        active: true,
      },
      {
        issuerDid: "did:key:z6MksHh7qHWvybLg5QTPPdG2DgEjjduBDArV9EF9mRiRzMBN",
        issuerName: "Ordre National des Ingenieurs",
        credentialTypes: ["ProfessionalLicense", "InspectorCertification"],
        active: true,
      },
    ],
  });

  console.log("  Created 2 trusted issuers");

  // ─── Webhook Subscriptions ─────────────────────────────────────────────────

  await prisma.webhookSubscription.create({
    data: {
      url: "https://tgr.gov.ma/api/v1/webhooks/tml-certificates",
      eventTypes: ["certificate_issued", "certificate_revoked"],
      secretHash: "5555555555555555555555555555555555555555555555555555555555555555",
      subscriberName: "TGR Integration Gateway",
      active: true,
    },
  });

  console.log("  Created 1 webhook subscription");

  // ─── Audit Logs ────────────────────────────────────────────────────────────

  await prisma.auditLog.createMany({
    data: [
      {
        entityType: "Project",
        entityId: projectRoad.id,
        action: "create",
        actorDid: actorAdmin.did,
        payloadHash: "audit000100000000000000000000000000000000000000000000000000000001",
        metadata: { source: "admin-dashboard" },
      },
      {
        entityType: "Project",
        entityId: projectStadium.id,
        action: "create",
        actorDid: actorAdmin.did,
        payloadHash: "audit000200000000000000000000000000000000000000000000000000000002",
        metadata: { source: "admin-dashboard" },
      },
      {
        entityType: "ComplianceCertificate",
        entityId: roadMilestones[0]!.id,
        action: "approve",
        actorDid: "did:key:z6MkSystemAutomation",
        payloadHash: "audit000300000000000000000000000000000000000000000000000000000003",
        metadata: { certificateRef: "TGR-2025-FMK-00147", automated: true },
      },
      {
        entityType: "DisputeResolution",
        entityId: stadiumMilestones[2]!.id,
        action: "create",
        actorDid: actorCitizen1.did,
        payloadHash: "audit000400000000000000000000000000000000000000000000000000000004",
        metadata: { reason: "roofing quality concern" },
      },
    ],
  });

  console.log("  Created 4 audit log entries");

  // ═══════════════════════════════════════════════════════════════════════════
  // ENHANCED HACKATHON DEMO DATA
  // ═══════════════════════════════════════════════════════════════════════════

  // ─── Additional Actors (5 more) ──────────────────────────────────────────

  const actorInspectorKhalid = await prisma.actor.create({
    data: {
      did: "did:key:z6MkvWkza1fMBWhKnYE3CgMgxHem62YkEw4JbdmEZeFTEZ7A",
      cnieHash: "e6f7a2b3c4d5e6f7a2b3c4d5e6f7a2b3c4d5e6f7a2b3c4d5e6f7a2b3c4d5e6f7",
      roles: ["independent_auditor"],
      assuranceLevel: "high",
    },
  });

  const actorContractorNadia = await prisma.actor.create({
    data: {
      did: "did:key:z6MkwTREjTygaftEeSbXLpKtp8gQbJZ3Y1D9QRSZ6tMN1VfS",
      cnieHash: "f7a2b3c4d5e6f7a2b3c4d5e6f7a2b3c4d5e6f7a2b3c4d5e6f7a2b3c4d5e6f7a2",
      roles: ["contractor_engineer"],
      assuranceLevel: "high",
    },
  });

  const actorCitizenYoussef = await prisma.actor.create({
    data: {
      did: "did:key:z6MkhaQgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta3epL",
      cnieHash: "a8b9c0d1e2f3a8b9c0d1e2f3a8b9c0d1e2f3a8b9c0d1e2f3a8b9c0d1e2f3a8b9",
      roles: ["citizen"],
    },
  });

  const actorCitizenRachida = await prisma.actor.create({
    data: {
      did: "did:key:z6MknGc3ocHs4zdPiJbnaaqDi58NGb4pk1Sp7eTafHQBTHik",
      cnieHash: "b9c0d1e2f3a8b9c0d1e2f3a8b9c0d1e2f3a8b9c0d1e2f3a8b9c0d1e2f3a8b9c0",
      roles: ["citizen"],
    },
  });

  const actorCitizenMohammed = await prisma.actor.create({
    data: {
      did: "did:key:z6MkpTHR9VNs5zPBGhLm7Fjwka7eU1prUYnsMt3YQZ3Gz8jp",
      cnieHash: "c0d1e2f3a8b9c0d1e2f3a8b9c0d1e2f3a8b9c0d1e2f3a8b9c0d1e2f3a8b9c0d1",
      roles: ["citizen"],
    },
  });

  console.log("  Created 5 additional actors");

  // ─── Additional Organizations ────────────────────────────────────────────

  const orgHealthMinistry = await prisma.organization.create({
    data: {
      name: "Ministere de la Sante et de la Protection Sociale",
      registrationHash: "5555555555555555555555555555555555555555555555555555555555555556",
      type: "government_body",
    },
  });

  const orgTransport = await prisma.organization.create({
    data: {
      name: "Casa Transport SA",
      registrationHash: "6666666666666666666666666666666666666666666666666666666666666666",
      type: "construction_company",
    },
  });

  console.log("  Created 2 additional organizations");

  // ─── Additional Actor-Organization Links ─────────────────────────────────

  await prisma.actorOrganization.createMany({
    data: [
      { actorId: actorInspectorKhalid.id, organizationId: orgGov.id, role: "Field Inspector", validFrom: orgLinkStart },
      { actorId: actorContractorNadia.id, organizationId: orgTransport.id, role: "Project Director", validFrom: orgLinkStart },
    ],
  });

  console.log("  Created 2 additional actor-organization links");

  // ─── Additional Projects (3 more) ───────────────────────────────────────

  // CHU Ibn Rochd Extension — Casablanca hospital
  const hospitalBoundary = [
    { lat: 33.5735, lng: -7.6090 },
    { lat: 33.5760, lng: -7.6090 },
    { lat: 33.5760, lng: -7.6050 },
    { lat: 33.5735, lng: -7.6050 },
  ];

  const projectHospital = await prisma.project.create({
    data: {
      name: "Extension CHU Ibn Rochd — Casablanca",
      region: "Casablanca-Settat",
      budget: 85000000.00,
      donor: "Banque Mondiale",
      status: "active",
      boundary: hospitalBoundary,
    },
  });

  // Ecole Primaire Ouarzazate
  const schoolBoundary = [
    { lat: 30.9180, lng: -6.8930 },
    { lat: 30.9200, lng: -6.8930 },
    { lat: 30.9200, lng: -6.8900 },
    { lat: 30.9180, lng: -6.8900 },
  ];

  const projectSchool = await prisma.project.create({
    data: {
      name: "Ecole Primaire Hay Al Wahda — Ouarzazate",
      region: "Draa-Tafilalet",
      budget: 12000000.00,
      donor: "Fonds d'Equipement Communal",
      status: "active",
      boundary: schoolBoundary,
    },
  });

  // Tramway Casablanca Ligne T4
  const tramwayBoundary = [
    { lat: 33.5700, lng: -7.6500 },
    { lat: 33.6100, lng: -7.6500 },
    { lat: 33.6100, lng: -7.5800 },
    { lat: 33.5700, lng: -7.5800 },
  ];

  const projectTramway = await prisma.project.create({
    data: {
      name: "Tramway Casablanca — Ligne T4 Extension Ain Sebaa",
      region: "Casablanca-Settat",
      budget: 250000000.00,
      donor: "Banque Europeenne d'Investissement",
      status: "active",
      boundary: tramwayBoundary,
    },
  });

  console.log("  Created 3 additional projects");

  // ─── Additional Milestones ───────────────────────────────────────────────

  // Hospital milestones (4)
  const hospitalMilestones = await Promise.all([
    prisma.milestone.create({
      data: {
        projectId: projectHospital.id,
        sequenceNumber: 1,
        description: "Demolition of annexe building and site preparation for new wing",
        deadline: new Date("2025-07-31"),
        status: "completed",
      },
    }),
    prisma.milestone.create({
      data: {
        projectId: projectHospital.id,
        sequenceNumber: 2,
        description: "Foundation piles and reinforced concrete ground floor slab",
        deadline: new Date("2025-11-30"),
        status: "completed",
      },
    }),
    prisma.milestone.create({
      data: {
        projectId: projectHospital.id,
        sequenceNumber: 3,
        description: "Structural framework for floors 1-4 including seismic reinforcement",
        deadline: new Date("2026-04-30"),
        status: "attestation_in_progress",
      },
    }),
    prisma.milestone.create({
      data: {
        projectId: projectHospital.id,
        sequenceNumber: 4,
        description: "Medical gas piping, HVAC, and electrical systems installation",
        deadline: new Date("2026-09-30"),
        status: "pending",
      },
    }),
  ]);

  // School milestones (3)
  const schoolMilestones = await Promise.all([
    prisma.milestone.create({
      data: {
        projectId: projectSchool.id,
        sequenceNumber: 1,
        description: "Land leveling, perimeter wall, and foundation for 8-classroom block",
        deadline: new Date("2025-08-31"),
        status: "completed",
      },
    }),
    prisma.milestone.create({
      data: {
        projectId: projectSchool.id,
        sequenceNumber: 2,
        description: "Masonry walls, roofing, and exterior plastering",
        deadline: new Date("2025-12-31"),
        status: "attestation_in_progress",
      },
    }),
    prisma.milestone.create({
      data: {
        projectId: projectSchool.id,
        sequenceNumber: 3,
        description: "Interior finishing, sanitary facilities, and playground equipment",
        deadline: new Date("2026-04-30"),
        status: "pending",
      },
    }),
  ]);

  // Tramway milestones (4)
  const tramwayMilestones = await Promise.all([
    prisma.milestone.create({
      data: {
        projectId: projectTramway.id,
        sequenceNumber: 1,
        description: "Utility relocation and track bed excavation along Boulevard Mohammed VI",
        deadline: new Date("2025-09-30"),
        status: "completed",
      },
    }),
    prisma.milestone.create({
      data: {
        projectId: projectTramway.id,
        sequenceNumber: 2,
        description: "Rail track laying and overhead catenary wire installation (5.2km)",
        deadline: new Date("2026-02-28"),
        status: "in_progress",
      },
    }),
    prisma.milestone.create({
      data: {
        projectId: projectTramway.id,
        sequenceNumber: 3,
        description: "Station platform construction and passenger shelter installation (6 stations)",
        deadline: new Date("2026-07-31"),
        status: "pending",
      },
    }),
    prisma.milestone.create({
      data: {
        projectId: projectTramway.id,
        sequenceNumber: 4,
        description: "Signaling system, traffic light integration, and test runs",
        deadline: new Date("2026-11-30"),
        status: "pending",
      },
    }),
  ]);

  console.log("  Created 11 additional milestones");

  // ─── Additional Auditor Assignments ──────────────────────────────────────

  // Hospital milestone 1 — Khalid completed
  await prisma.auditorAssignment.create({
    data: {
      milestoneId: hospitalMilestones[0]!.id,
      auditorId: actorInspectorKhalid.id,
      rotationRound: 1,
      status: "completed",
    },
  });

  // Hospital milestone 2 — Auditor1 completed
  await prisma.auditorAssignment.create({
    data: {
      milestoneId: hospitalMilestones[1]!.id,
      auditorId: actorAuditor1.id,
      rotationRound: 1,
      status: "completed",
    },
  });

  // Hospital milestone 3 — Khalid accepted (attestation in progress)
  await prisma.auditorAssignment.create({
    data: {
      milestoneId: hospitalMilestones[2]!.id,
      auditorId: actorInspectorKhalid.id,
      rotationRound: 1,
      status: "accepted",
    },
  });

  // School milestone 1 — Auditor2 completed
  await prisma.auditorAssignment.create({
    data: {
      milestoneId: schoolMilestones[0]!.id,
      auditorId: actorAuditor2.id,
      rotationRound: 1,
      status: "completed",
    },
  });

  // School milestone 2 — Khalid accepted
  await prisma.auditorAssignment.create({
    data: {
      milestoneId: schoolMilestones[1]!.id,
      auditorId: actorInspectorKhalid.id,
      rotationRound: 1,
      status: "accepted",
    },
  });

  // Tramway milestone 1 — Auditor1 completed
  await prisma.auditorAssignment.create({
    data: {
      milestoneId: tramwayMilestones[0]!.id,
      auditorId: actorAuditor1.id,
      rotationRound: 1,
      status: "completed",
    },
  });

  console.log("  Created 6 additional auditor assignments");

  // ─── Additional Citizen Pools ────────────────────────────────────────────

  // Hospital milestone 1 — 3 citizens attested (quorum met)
  for (const [citizen, tier] of [
    [actorCitizenYoussef, "biometric"],
    [actorCitizenRachida, "biometric"],
    [actorCitizenMohammed, "ussd"],
  ] as const) {
    await prisma.citizenPool.create({
      data: {
        milestoneId: hospitalMilestones[0]!.id,
        citizenId: citizen.id,
        proximityProofHash: `ee${citizen.cnieHash.slice(2)}`,
        assuranceTier: tier,
        status: "attested",
      },
    });
  }

  // Hospital milestone 2 — 3 citizens attested (quorum met)
  for (const [citizen, tier] of [
    [actorCitizen1, "biometric"],
    [actorCitizenYoussef, "ussd"],
    [actorCitizenRachida, "biometric"],
  ] as const) {
    await prisma.citizenPool.create({
      data: {
        milestoneId: hospitalMilestones[1]!.id,
        citizenId: citizen.id,
        proximityProofHash: `ff${citizen.cnieHash.slice(2)}`,
        assuranceTier: tier,
        status: "attested",
      },
    });
  }

  // Hospital milestone 3 — 2 citizens enrolled (quorum not yet met)
  for (const [citizen, tier] of [
    [actorCitizenMohammed, "biometric"],
    [actorCitizen4, "cso_mediated"],
  ] as const) {
    await prisma.citizenPool.create({
      data: {
        milestoneId: hospitalMilestones[2]!.id,
        citizenId: citizen.id,
        proximityProofHash: `g1${citizen.cnieHash.slice(2)}`,
        assuranceTier: tier,
        status: "enrolled",
      },
    });
  }

  // School milestone 1 — 3 citizens attested (quorum met)
  for (const [citizen, tier] of [
    [actorCitizenYoussef, "cso_mediated"],
    [actorCitizenMohammed, "ussd"],
    [actorCitizenRachida, "ussd"],
  ] as const) {
    await prisma.citizenPool.create({
      data: {
        milestoneId: schoolMilestones[0]!.id,
        citizenId: citizen.id,
        proximityProofHash: `h1${citizen.cnieHash.slice(2)}`,
        assuranceTier: tier,
        status: "attested",
      },
    });
  }

  // School milestone 2 — 1 citizen enrolled
  await prisma.citizenPool.create({
    data: {
      milestoneId: schoolMilestones[1]!.id,
      citizenId: actorCitizenRachida.id,
      proximityProofHash: `i1${actorCitizenRachida.cnieHash.slice(2)}`,
      assuranceTier: "biometric",
      status: "enrolled",
    },
  });

  // Tramway milestone 1 — 3 citizens attested (quorum met)
  for (const [citizen, tier] of [
    [actorCitizen2, "biometric"],
    [actorCitizen3, "biometric"],
    [actorCitizenYoussef, "biometric"],
  ] as const) {
    await prisma.citizenPool.create({
      data: {
        milestoneId: tramwayMilestones[0]!.id,
        citizenId: citizen.id,
        proximityProofHash: `j1${citizen.cnieHash.slice(2)}`,
        assuranceTier: tier,
        status: "attested",
      },
    });
  }

  console.log("  Created 16 additional citizen pool entries");

  // ─── Additional Attestations ─────────────────────────────────────────────

  // Hospital milestone 1 — FULLY ATTESTED (inspector + auditor + 3 citizens)
  await prisma.attestation.createMany({
    data: [
      {
        milestoneId: hospitalMilestones[0]!.id,
        actorId: actorInspectorKhalid.id,
        type: "inspector_verification",
        evidenceHash: "eeee000000000000000000000000000000000000000000000000000000000001",
        gpsLatitude: 33.5748,
        gpsLongitude: -7.6070,
        deviceAttestationToken: "android-key-att-v3-hosp-m1-insp",
        digitalSignature: fakeSig,
        status: "verified",
      },
      {
        milestoneId: hospitalMilestones[0]!.id,
        actorId: actorInspectorKhalid.id,
        type: "auditor_review",
        evidenceHash: "eeee000000000000000000000000000000000000000000000000000000000002",
        gpsLatitude: 33.5748,
        gpsLongitude: -7.6070,
        deviceAttestationToken: "android-key-att-v3-hosp-m1-audit",
        digitalSignature: fakeSig,
        status: "verified",
      },
      {
        milestoneId: hospitalMilestones[0]!.id,
        actorId: actorCitizenYoussef.id,
        type: "citizen_approval",
        evidenceHash: "eeee000000000000000000000000000000000000000000000000000000000003",
        gpsLatitude: 33.5750,
        gpsLongitude: -7.6065,
        deviceAttestationToken: "android-key-att-v3-hosp-m1-cit1",
        digitalSignature: fakeSig,
        status: "verified",
      },
      {
        milestoneId: hospitalMilestones[0]!.id,
        actorId: actorCitizenRachida.id,
        type: "citizen_approval",
        evidenceHash: "eeee000000000000000000000000000000000000000000000000000000000004",
        gpsLatitude: 33.5745,
        gpsLongitude: -7.6068,
        deviceAttestationToken: "android-key-att-v3-hosp-m1-cit2",
        digitalSignature: fakeSig,
        status: "verified",
      },
      {
        milestoneId: hospitalMilestones[0]!.id,
        actorId: actorCitizenMohammed.id,
        type: "citizen_approval",
        evidenceHash: "eeee000000000000000000000000000000000000000000000000000000000005",
        gpsLatitude: 33.5752,
        gpsLongitude: -7.6072,
        deviceAttestationToken: "ussd-att-hosp-m1-cit3",
        digitalSignature: fakeSig,
        status: "verified",
      },
    ],
  });

  // Hospital milestone 2 — FULLY ATTESTED (inspector + auditor + 3 citizens)
  await prisma.attestation.createMany({
    data: [
      {
        milestoneId: hospitalMilestones[1]!.id,
        actorId: actorAuditor1.id,
        type: "inspector_verification",
        evidenceHash: "ffff000000000000000000000000000000000000000000000000000000000001",
        gpsLatitude: 33.5746,
        gpsLongitude: -7.6068,
        deviceAttestationToken: "android-key-att-v3-hosp-m2-insp",
        digitalSignature: fakeSig,
        status: "verified",
      },
      {
        milestoneId: hospitalMilestones[1]!.id,
        actorId: actorAuditor1.id,
        type: "auditor_review",
        evidenceHash: "ffff000000000000000000000000000000000000000000000000000000000002",
        gpsLatitude: 33.5746,
        gpsLongitude: -7.6068,
        deviceAttestationToken: "android-key-att-v3-hosp-m2-audit",
        digitalSignature: fakeSig,
        status: "verified",
      },
      {
        milestoneId: hospitalMilestones[1]!.id,
        actorId: actorCitizen1.id,
        type: "citizen_approval",
        evidenceHash: "ffff000000000000000000000000000000000000000000000000000000000003",
        gpsLatitude: 33.5749,
        gpsLongitude: -7.6065,
        deviceAttestationToken: "android-key-att-v3-hosp-m2-cit1",
        digitalSignature: fakeSig,
        status: "verified",
      },
      {
        milestoneId: hospitalMilestones[1]!.id,
        actorId: actorCitizenYoussef.id,
        type: "citizen_approval",
        evidenceHash: "ffff000000000000000000000000000000000000000000000000000000000004",
        gpsLatitude: 33.5751,
        gpsLongitude: -7.6063,
        deviceAttestationToken: "ussd-att-hosp-m2-cit2",
        digitalSignature: fakeSig,
        status: "verified",
      },
      {
        milestoneId: hospitalMilestones[1]!.id,
        actorId: actorCitizenRachida.id,
        type: "citizen_approval",
        evidenceHash: "ffff000000000000000000000000000000000000000000000000000000000005",
        gpsLatitude: 33.5747,
        gpsLongitude: -7.6071,
        deviceAttestationToken: "android-key-att-v3-hosp-m2-cit3",
        digitalSignature: fakeSig,
        status: "verified",
      },
    ],
  });

  // Hospital milestone 3 — PARTIAL (inspector only, attestation in progress)
  await prisma.attestation.create({
    data: {
      milestoneId: hospitalMilestones[2]!.id,
      actorId: actorInspectorKhalid.id,
      type: "inspector_verification",
      evidenceHash: "gggg000000000000000000000000000000000000000000000000000000000001",
      gpsLatitude: 33.5750,
      gpsLongitude: -7.6069,
      deviceAttestationToken: "android-key-att-v3-hosp-m3-insp",
      digitalSignature: fakeSig,
      status: "submitted",
    },
  });

  // School milestone 1 — FULLY ATTESTED (inspector + auditor + 3 citizens)
  await prisma.attestation.createMany({
    data: [
      {
        milestoneId: schoolMilestones[0]!.id,
        actorId: actorAuditor2.id,
        type: "inspector_verification",
        evidenceHash: "hhhh000000000000000000000000000000000000000000000000000000000001",
        gpsLatitude: 30.9190,
        gpsLongitude: -6.8915,
        deviceAttestationToken: "android-key-att-v3-school-m1-insp",
        digitalSignature: fakeSig,
        status: "verified",
      },
      {
        milestoneId: schoolMilestones[0]!.id,
        actorId: actorAuditor2.id,
        type: "auditor_review",
        evidenceHash: "hhhh000000000000000000000000000000000000000000000000000000000002",
        gpsLatitude: 30.9190,
        gpsLongitude: -6.8915,
        deviceAttestationToken: "android-key-att-v3-school-m1-audit",
        digitalSignature: fakeSig,
        status: "verified",
      },
      {
        milestoneId: schoolMilestones[0]!.id,
        actorId: actorCitizenYoussef.id,
        type: "citizen_approval",
        evidenceHash: "hhhh000000000000000000000000000000000000000000000000000000000003",
        gpsLatitude: 30.9192,
        gpsLongitude: -6.8912,
        deviceAttestationToken: "cso-mediated-att-school-m1-cit1",
        digitalSignature: fakeSig,
        status: "verified",
      },
      {
        milestoneId: schoolMilestones[0]!.id,
        actorId: actorCitizenMohammed.id,
        type: "citizen_approval",
        evidenceHash: "hhhh000000000000000000000000000000000000000000000000000000000004",
        gpsLatitude: 30.9188,
        gpsLongitude: -6.8918,
        deviceAttestationToken: "ussd-att-school-m1-cit2",
        digitalSignature: fakeSig,
        status: "verified",
      },
      {
        milestoneId: schoolMilestones[0]!.id,
        actorId: actorCitizenRachida.id,
        type: "citizen_approval",
        evidenceHash: "hhhh000000000000000000000000000000000000000000000000000000000005",
        gpsLatitude: 30.9191,
        gpsLongitude: -6.8910,
        deviceAttestationToken: "ussd-att-school-m1-cit3",
        digitalSignature: fakeSig,
        status: "verified",
      },
    ],
  });

  // Tramway milestone 1 — FULLY ATTESTED (inspector + auditor + 3 citizens)
  await prisma.attestation.createMany({
    data: [
      {
        milestoneId: tramwayMilestones[0]!.id,
        actorId: actorAuditor1.id,
        type: "inspector_verification",
        evidenceHash: "iiii000000000000000000000000000000000000000000000000000000000001",
        gpsLatitude: 33.5850,
        gpsLongitude: -7.6200,
        deviceAttestationToken: "android-key-att-v3-tram-m1-insp",
        digitalSignature: fakeSig,
        status: "verified",
      },
      {
        milestoneId: tramwayMilestones[0]!.id,
        actorId: actorAuditor1.id,
        type: "auditor_review",
        evidenceHash: "iiii000000000000000000000000000000000000000000000000000000000002",
        gpsLatitude: 33.5850,
        gpsLongitude: -7.6200,
        deviceAttestationToken: "android-key-att-v3-tram-m1-audit",
        digitalSignature: fakeSig,
        status: "verified",
      },
      {
        milestoneId: tramwayMilestones[0]!.id,
        actorId: actorCitizen2.id,
        type: "citizen_approval",
        evidenceHash: "iiii000000000000000000000000000000000000000000000000000000000003",
        gpsLatitude: 33.5852,
        gpsLongitude: -7.6198,
        deviceAttestationToken: "android-key-att-v3-tram-m1-cit1",
        digitalSignature: fakeSig,
        status: "verified",
      },
      {
        milestoneId: tramwayMilestones[0]!.id,
        actorId: actorCitizen3.id,
        type: "citizen_approval",
        evidenceHash: "iiii000000000000000000000000000000000000000000000000000000000004",
        gpsLatitude: 33.5848,
        gpsLongitude: -7.6202,
        deviceAttestationToken: "android-key-att-v3-tram-m1-cit2",
        digitalSignature: fakeSig,
        status: "verified",
      },
      {
        milestoneId: tramwayMilestones[0]!.id,
        actorId: actorCitizenYoussef.id,
        type: "citizen_approval",
        evidenceHash: "iiii000000000000000000000000000000000000000000000000000000000005",
        gpsLatitude: 33.5855,
        gpsLongitude: -7.6195,
        deviceAttestationToken: "android-key-att-v3-tram-m1-cit3",
        digitalSignature: fakeSig,
        status: "verified",
      },
    ],
  });

  console.log("  Created 21 additional attestations");

  // ─── Additional Compliance Certificates ──────────────────────────────────

  // Hospital milestone 1 — issued, delivered to TGR
  await prisma.complianceCertificate.create({
    data: {
      milestoneId: hospitalMilestones[0]!.id,
      certificateHash: "cert0004aabbccdd0004aabbccdd0004aabbccdd0004aabbccdd0004aabbccdd",
      digitalSignature: fakeSig,
      status: "delivered_to_tgr",
      tgrReference: "TGR-2025-CST-00412",
    },
  });

  // Hospital milestone 2 — issued, not yet delivered
  await prisma.complianceCertificate.create({
    data: {
      milestoneId: hospitalMilestones[1]!.id,
      certificateHash: "cert0005aabbccdd0005aabbccdd0005aabbccdd0005aabbccdd0005aabbccdd",
      digitalSignature: fakeSig,
      status: "issued",
    },
  });

  // School milestone 1 — issued, delivered to TGR
  await prisma.complianceCertificate.create({
    data: {
      milestoneId: schoolMilestones[0]!.id,
      certificateHash: "cert0006aabbccdd0006aabbccdd0006aabbccdd0006aabbccdd0006aabbccdd",
      digitalSignature: fakeSig,
      status: "delivered_to_tgr",
      tgrReference: "TGR-2025-DRT-00078",
    },
  });

  // Tramway milestone 1 — issued, acknowledged by TGR
  await prisma.complianceCertificate.create({
    data: {
      milestoneId: tramwayMilestones[0]!.id,
      certificateHash: "cert0007aabbccdd0007aabbccdd0007aabbccdd0007aabbccdd0007aabbccdd",
      digitalSignature: fakeSig,
      status: "acknowledged",
      tgrReference: "TGR-2026-CST-00015",
    },
  });

  console.log("  Created 4 additional compliance certificates");

  // ─── Additional Disputes ─────────────────────────────────────────────────

  // School milestone 2 — under_review dispute about construction materials
  await prisma.disputeResolution.create({
    data: {
      milestoneId: schoolMilestones[1]!.id,
      raisedById: actorCitizenRachida.id,
      reason: "Concern raised about cement quality used for roofing. Local residents report visible cracks in freshly poured concrete beams after only 2 weeks. Lab testing of material samples requested before attestation can proceed.",
      status: "under_review",
    },
  });

  // Tramway milestone 2 — open dispute about environmental impact
  await prisma.disputeResolution.create({
    data: {
      milestoneId: tramwayMilestones[1]!.id,
      raisedById: actorCitizenMohammed.id,
      reason: "Track excavation has damaged underground water pipes serving Hay Mohammadi neighborhood. Over 200 households affected for 3 days. Requesting assessment of contractor's compliance with utility relocation plan before milestone progresses.",
      status: "open",
    },
  });

  console.log("  Created 2 additional disputes");

  // ─── Consent Records ─────────────────────────────────────────────────────

  const consentActors = [
    { actor: actorContractor1, purposes: ["identity_verification", "data_sharing"] as const },
    { actor: actorAuditor1, purposes: ["identity_verification", "attestation_submission"] as const },
    { actor: actorCitizen1, purposes: ["identity_verification", "attestation_submission", "analytics"] as const },
    { actor: actorCitizenYoussef, purposes: ["identity_verification", "attestation_submission"] as const },
    { actor: actorCitizenRachida, purposes: ["identity_verification", "attestation_submission", "data_sharing"] as const },
    { actor: actorCitizenMohammed, purposes: ["identity_verification", "attestation_submission"] as const },
    { actor: actorInspectorKhalid, purposes: ["identity_verification", "attestation_submission", "credential_issuance"] as const },
    { actor: actorContractorNadia, purposes: ["identity_verification", "data_sharing"] as const },
  ];

  for (const { actor, purposes } of consentActors) {
    for (const purpose of purposes) {
      await prisma.consentRecord.create({
        data: {
          actorId: actor.id,
          actorDid: actor.did,
          purpose,
          scope: purpose === "analytics" ? "anonymized-usage-statistics" : `tml-${purpose.replace(/_/g, "-")}`,
          legalBasis: purpose === "analytics" ? "legitimate_interest" : "consent",
          status: "granted",
          expiresAt: new Date("2027-01-01"),
          ipAddress: "196.200.131." + Math.floor(Math.random() * 255),
          userAgent: "Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36",
        },
      });
    }
  }

  console.log("  Created 18 consent records");

  // ─── Issued Credentials ──────────────────────────────────────────────────

  await prisma.issuedCredential.createMany({
    data: [
      {
        holderDid: actorAuditor1.did,
        holderActorId: actorAuditor1.id,
        credentialType: "InspectorCertification",
        credentialJson: {
          "@context": ["https://www.w3.org/2018/credentials/v1"],
          type: ["VerifiableCredential", "InspectorCertification"],
          issuer: "did:key:z6MksHh7qHWvybLg5QTPPdG2DgEjjduBDArV9EF9mRiRzMBN",
          issuanceDate: "2025-01-15T00:00:00Z",
          credentialSubject: {
            id: actorAuditor1.did,
            name: "Auditor 1",
            licenseNumber: "INS-MA-2025-00142",
            specialization: "Civil Engineering Infrastructure",
          },
        },
        credentialHash: "cred0001aabbccdd0001aabbccdd0001aabbccdd0001aabbccdd0001aabbccdd",
        status: "active",
        expiresAt: new Date("2027-01-15"),
      },
      {
        holderDid: actorAuditor2.did,
        holderActorId: actorAuditor2.id,
        credentialType: "InspectorCertification",
        credentialJson: {
          "@context": ["https://www.w3.org/2018/credentials/v1"],
          type: ["VerifiableCredential", "InspectorCertification"],
          issuer: "did:key:z6MksHh7qHWvybLg5QTPPdG2DgEjjduBDArV9EF9mRiRzMBN",
          issuanceDate: "2025-02-01T00:00:00Z",
          credentialSubject: {
            id: actorAuditor2.did,
            name: "Auditor 2",
            licenseNumber: "INS-MA-2025-00156",
            specialization: "Structural Engineering",
          },
        },
        credentialHash: "cred0002aabbccdd0002aabbccdd0002aabbccdd0002aabbccdd0002aabbccdd",
        status: "active",
        expiresAt: new Date("2027-02-01"),
      },
      {
        holderDid: actorInspectorKhalid.did,
        holderActorId: actorInspectorKhalid.id,
        credentialType: "InspectorCertification",
        credentialJson: {
          "@context": ["https://www.w3.org/2018/credentials/v1"],
          type: ["VerifiableCredential", "InspectorCertification"],
          issuer: "did:key:z6MksHh7qHWvybLg5QTPPdG2DgEjjduBDArV9EF9mRiRzMBN",
          issuanceDate: "2025-03-10T00:00:00Z",
          credentialSubject: {
            id: actorInspectorKhalid.did,
            name: "Khalid Benani",
            licenseNumber: "INS-MA-2025-00198",
            specialization: "Hospital and Healthcare Infrastructure",
          },
        },
        credentialHash: "cred0003aabbccdd0003aabbccdd0003aabbccdd0003aabbccdd0003aabbccdd",
        status: "active",
        expiresAt: new Date("2027-03-10"),
      },
      {
        holderDid: actorContractor1.did,
        holderActorId: actorContractor1.id,
        credentialType: "ProfessionalLicense",
        credentialJson: {
          "@context": ["https://www.w3.org/2018/credentials/v1"],
          type: ["VerifiableCredential", "ProfessionalLicense"],
          issuer: "did:key:z6MksHh7qHWvybLg5QTPPdG2DgEjjduBDArV9EF9mRiRzMBN",
          issuanceDate: "2024-11-20T00:00:00Z",
          credentialSubject: {
            id: actorContractor1.did,
            name: "Contractor 1",
            licenseNumber: "ENG-MA-2024-01204",
            specialization: "Road and Highway Construction",
          },
        },
        credentialHash: "cred0004aabbccdd0004aabbccdd0004aabbccdd0004aabbccdd0004aabbccdd",
        status: "active",
        expiresAt: new Date("2026-11-20"),
      },
      {
        holderDid: actorContractorNadia.did,
        holderActorId: actorContractorNadia.id,
        credentialType: "ProfessionalLicense",
        credentialJson: {
          "@context": ["https://www.w3.org/2018/credentials/v1"],
          type: ["VerifiableCredential", "ProfessionalLicense"],
          issuer: "did:key:z6MksHh7qHWvybLg5QTPPdG2DgEjjduBDArV9EF9mRiRzMBN",
          issuanceDate: "2025-04-01T00:00:00Z",
          credentialSubject: {
            id: actorContractorNadia.did,
            name: "Nadia Amrani",
            licenseNumber: "ENG-MA-2025-00312",
            specialization: "Urban Transport Infrastructure",
          },
        },
        credentialHash: "cred0005aabbccdd0005aabbccdd0005aabbccdd0005aabbccdd0005aabbccdd",
        status: "active",
        expiresAt: new Date("2027-04-01"),
      },
      {
        holderDid: actorCitizen1.did,
        holderActorId: actorCitizen1.id,
        credentialType: "IdentityCredential",
        credentialJson: {
          "@context": ["https://www.w3.org/2018/credentials/v1"],
          type: ["VerifiableCredential", "IdentityCredential"],
          issuer: "did:key:z6MkqRYqQiSgvZQdnBytw86Qbs2ZWUkGv22od935YF4s8M7V",
          issuanceDate: "2025-01-05T00:00:00Z",
          credentialSubject: {
            id: actorCitizen1.did,
            identityVerified: true,
            verificationMethod: "CNIE-eSignet",
          },
        },
        credentialHash: "cred0006aabbccdd0006aabbccdd0006aabbccdd0006aabbccdd0006aabbccdd",
        status: "active",
        expiresAt: new Date("2030-01-05"),
      },
    ],
  });

  console.log("  Created 6 issued credentials");

  // ─── Additional Webhook Subscription ─────────────────────────────────────

  await prisma.webhookSubscription.create({
    data: {
      url: "https://equipement.gov.ma/api/webhooks/tml-disputes",
      eventTypes: ["dispute_opened", "dispute_resolved", "milestone_completed"],
      secretHash: "7777777777777777777777777777777777777777777777777777777777777777",
      subscriberName: "Ministere de l'Equipement — Dispute Monitoring",
      active: true,
    },
  });

  console.log("  Created 1 additional webhook subscription");

  // ─── Additional Audit Logs ───────────────────────────────────────────────

  await prisma.auditLog.createMany({
    data: [
      {
        entityType: "Project",
        entityId: projectHospital.id,
        action: "create",
        actorDid: actorAdmin.did,
        payloadHash: "audit000500000000000000000000000000000000000000000000000000000005",
        metadata: { source: "admin-dashboard", projectName: "Extension CHU Ibn Rochd" },
      },
      {
        entityType: "Project",
        entityId: projectSchool.id,
        action: "create",
        actorDid: actorAdmin.did,
        payloadHash: "audit000600000000000000000000000000000000000000000000000000000006",
        metadata: { source: "admin-dashboard", projectName: "Ecole Primaire Ouarzazate" },
      },
      {
        entityType: "Project",
        entityId: projectTramway.id,
        action: "create",
        actorDid: actorAdmin.did,
        payloadHash: "audit000700000000000000000000000000000000000000000000000000000007",
        metadata: { source: "admin-dashboard", projectName: "Tramway Ligne T4" },
      },
      {
        entityType: "ComplianceCertificate",
        entityId: hospitalMilestones[0]!.id,
        action: "approve",
        actorDid: "did:key:z6MkSystemAutomation",
        payloadHash: "audit000800000000000000000000000000000000000000000000000000000008",
        metadata: { certificateRef: "TGR-2025-CST-00412", automated: true },
      },
      {
        entityType: "ComplianceCertificate",
        entityId: schoolMilestones[0]!.id,
        action: "approve",
        actorDid: "did:key:z6MkSystemAutomation",
        payloadHash: "audit000900000000000000000000000000000000000000000000000000000009",
        metadata: { certificateRef: "TGR-2025-DRT-00078", automated: true },
      },
      {
        entityType: "DisputeResolution",
        entityId: schoolMilestones[1]!.id,
        action: "create",
        actorDid: actorCitizenRachida.did,
        payloadHash: "audit001000000000000000000000000000000000000000000000000000000010",
        metadata: { reason: "cement quality concern", status: "under_review" },
      },
      {
        entityType: "DisputeResolution",
        entityId: tramwayMilestones[1]!.id,
        action: "create",
        actorDid: actorCitizenMohammed.did,
        payloadHash: "audit001100000000000000000000000000000000000000000000000000000011",
        metadata: { reason: "utility damage during excavation", status: "open" },
      },
    ],
  });

  console.log("  Created 7 additional audit log entries");

  // ─── Trusted Issuer — Additional ─────────────────────────────────────────

  await prisma.trustedIssuerRegistry.create({
    data: {
      issuerDid: "did:key:z6MkwMN3SgrALimRz9Q8pXreKfTMLedwGi4nRBsfMF4aXm5V",
      issuerName: "Ministere de la Sante — Direction des Hopitaux",
      credentialTypes: ["HealthFacilityCompliance", "MedicalInfrastructureCertification"],
      active: true,
    },
  });

  console.log("  Created 1 additional trusted issuer");

  console.log("\nSeed complete.");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("Seed failed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
