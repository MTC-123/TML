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

  console.log(`  Created ${10} actors`);

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
