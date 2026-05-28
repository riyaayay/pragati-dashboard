import { PrismaClient, Role, MachineType, MachineStatus, ComplianceType } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding Pragati dashboard...')

  // ─── SITES (from Excel sheets) ──────────────────────────
  const siteData = [
    { name: 'Akkalkot Jeur',    code: 'A' },
    { name: 'Bidkin New',       code: 'B' },
    { name: 'Kolad-Roha',       code: 'C' },
    { name: 'Sarathi-Kolhapur', code: 'D' },
    { name: 'Walsang',          code: 'E' },
    { name: 'Others',           code: 'F' },
  ]

  const sites: Record<string, any> = {}
  for (const s of siteData) {
    const site = await prisma.site.upsert({
      where: { code: s.code },
      update: {},
      create: s,
    })
    sites[s.code] = site
  }

  // ─── MACHINES (exact from Excel) ───────────────────────
  const machineData = [
    // Akkalkot Jeur
    { assetCode: 'PC-DDR-0001', category: 'Diesel Dispensor-01', name: 'Diesel Dispensor',          regNo: 'MH12YB9977',   type: MachineType.VEHICLE, site: 'A' },
    { assetCode: 'PC-DGR-0004', category: 'Diesel Generator-05', name: 'Cummins 250KVA CPCBIV',     regNo: 'PCMH12-05777', type: MachineType.MACHINE, site: 'A' },
    { assetCode: 'PC-EXC-0001', category: 'Excavator-01',        name: 'Excavator PC210-01',         regNo: 'PCMH12-00177', type: MachineType.MACHINE, site: 'A' },
    { assetCode: 'PC-TIP-0001', category: 'Tipper-01',           name: 'Tata Tipper 2518',           regNo: 'MH12AB1234',   type: MachineType.VEHICLE, site: 'A' },
    // Bidkin New
    { assetCode: 'PC-DGR-0008', category: 'Diesel Generator-09', name: 'DG 10KVA',                  regNo: 'PCMH12-06677', type: MachineType.MACHINE, site: 'B' },
    { assetCode: 'PC-EXC-0003', category: 'Excavator-03',        name: 'Excavator PC210-03',         regNo: 'PCMH12-00377', type: MachineType.MACHINE, site: 'B' },
    { assetCode: 'PC-RLR-0001', category: 'Roller-01',           name: 'Vibratory Roller SD100',     regNo: 'PCMH12-01177', type: MachineType.MACHINE, site: 'B' },
    // Kolad-Roha
    { assetCode: 'PIPL-DDR-0002', category: 'Diesel Dispensor-02', name: '1112 LPT DCR39CBC',       regNo: 'PIPL-DDR-0002', type: MachineType.VEHICLE, site: 'C' },
    { assetCode: 'PIPL-DDR-0003', category: 'Diesel Dispensor-03', name: '1112 LPT DCR39CBC',       regNo: 'PIPL-DDR-0003', type: MachineType.VEHICLE, site: 'C' },
    { assetCode: 'PC-CPP-0003',   category: 'Concrete Pump-03',    name: 'Concrete Pump Aquarius',   regNo: 'PCMH12-05877', type: MachineType.MACHINE, site: 'C' },
    // Sarathi
    { assetCode: 'PC-CPP-0002', category: 'Concrete Pump-02', name: 'Concrete Pump SS SP1420',      regNo: 'PCMH12-05977', type: MachineType.MACHINE, site: 'D' },
    { assetCode: 'PC-JCB-0002', category: 'JCB-02',           name: 'JCB-02',                       regNo: 'MH12WP2748',   type: MachineType.MACHINE, site: 'D' },
    // Walsang
    { assetCode: 'PC-BRM-0001', category: 'Broomer-01',       name: 'Broomer (Vibrant)-01',         regNo: 'PCMH12-04977', type: MachineType.MACHINE, site: 'E' },
    { assetCode: 'PC-BRM-0002', category: 'Broomer-02',       name: 'Broomer (Vibrant)-02',         regNo: 'PCMH12-05077', type: MachineType.MACHINE, site: 'E' },
    { assetCode: 'PC-BSP-0001', category: 'Bitumen Sprayer-01', name: 'Bitumen Sprayer 12KL Bowser', regNo: 'MH10Z4236',   type: MachineType.VEHICLE, site: 'E' },
    // Others (compliance-only assets from Insurance sheet)
    { assetCode: 'PC-AMB-0001', category: 'Ambulance-01',     name: 'Ambulance BSVI 2.9+D+P',      regNo: 'MH12YB9677',   type: MachineType.VEHICLE, site: 'F' },
    { assetCode: 'PC-CPP-0001', category: 'Concrete Pump-01', name: 'Concrete Pump Aquarious 703D', regNo: 'PCMH12-04777', type: MachineType.MACHINE, site: 'F' },
  ]

  const machines: Record<string, any> = {}
  for (const m of machineData) {
    const machine = await prisma.machine.upsert({
      where: { assetCode: m.assetCode },
      update: {},
      create: {
        assetCode:   m.assetCode,
        category:    m.category,
        name:        m.name,
        regNo:       m.regNo,
        machineType: m.type,
        siteId:      sites[m.site].id,
      },
    })
    machines[m.assetCode] = machine
  }

  // ─── USERS ─────────────────────────────────────────────
  const hash = (pw: string) => bcrypt.hashSync(pw, 12)

  const userData = [
    { name: 'Admin User',         email: 'admin@pragati.in',    role: Role.ADMIN,            siteCode: null,  password: 'Admin@123' },
    { name: 'MD Sharma',          email: 'md@pragati.in',       role: Role.MD,               siteCode: null,  password: 'MD@123' },
    { name: 'DGM Patil',          email: 'dgm@pragati.in',      role: Role.DGM,              siteCode: null,  password: 'DGM@123' },
    { name: 'Manager Akkalkot',   email: 'mgr.a@pragati.in',    role: Role.SITE_MANAGER,     siteCode: 'A',   password: 'Mgr@123' },
    { name: 'Manager Bidkin',     email: 'mgr.b@pragati.in',    role: Role.SITE_MANAGER,     siteCode: 'B',   password: 'Mgr@123' },
    { name: 'Manager Kolad',      email: 'mgr.c@pragati.in',    role: Role.SITE_MANAGER,     siteCode: 'C',   password: 'Mgr@123' },
    { name: 'Supervisor Akkalkot',email: 'sup.a@pragati.in',    role: Role.SUPERVISOR,       siteCode: 'A',   password: 'Sup@123' },
    { name: 'Supervisor Bidkin',  email: 'sup.b@pragati.in',    role: Role.SUPERVISOR,       siteCode: 'B',   password: 'Sup@123' },
    { name: 'DI Ravi Akkalkot',   email: 'di.a@pragati.in',     role: Role.DATA_INTERPRETER, siteCode: 'A',   password: 'DI@1234' },
    { name: 'DI Suresh Bidkin',   email: 'di.b@pragati.in',     role: Role.DATA_INTERPRETER, siteCode: 'B',   password: 'DI@1234' },
  ]

  for (const u of userData) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        name:         u.name,
        email:        u.email,
        passwordHash: hash(u.password),
        role:         u.role,
        siteId:       u.siteCode ? sites[u.siteCode].id : null,
      },
    })
  }

  // ─── SEED DPR ENTRIES (last 7 days dummy data) ──────────
  const diUser = await prisma.user.findUnique({ where: { email: 'di.a@pragati.in' } })
  const today  = new Date()

  for (let daysAgo = 1; daysAgo <= 7; daysAgo++) {
    const date = new Date(today)
    date.setDate(date.getDate() - daysAgo)
    date.setHours(0, 0, 0, 0)

    const siteAMachines = Object.values(machines).filter((m: any) => m.siteId === sites['A'].id)

    for (const machine of siteAMachines.slice(0, 4)) {
      const m = machine as any
      const isVehicle = m.machineType === MachineType.VEHICLE
      const startReading = isVehicle ? 45000 + (daysAgo * 120) : 1200 + (daysAgo * 8)
      const totalHrKm    = isVehicle ? Math.round(80 + Math.random() * 60) : Math.round(6 + Math.random() * 4)

      try {
        await prisma.dprEntry.create({
          data: {
            date:             date,
            siteId:           sites['A'].id,
            machineId:        m.id,
            operatorName:     'Raju Patil',
            startingReading:  startReading,
            closingReading:   startReading + totalHrKm,
            totalHrKm:        totalHrKm,
            dieselOpBal:      Math.round(50 + Math.random() * 30),
            dieselIssued:     Math.round(40 + Math.random() * 20),
            totalDiesel:      90,
            dieselConsumption:Math.round(55 + Math.random() * 25),
            closingDieselBal: 35,
            actualAverage:    isVehicle ? parseFloat((4 + Math.random() * 2).toFixed(2)) : parseFloat((1.5 + Math.random()).toFixed(2)),
            stdAverage:       isVehicle ? 5.0 : 2.0,
            workdoneUnit:     'm³',
            workdoneQty:      Math.round(200 + Math.random() * 150),
            workdoneDetails:  'Earthwork excavation',
            approvalStatus:   daysAgo > 2 ? 'APPROVED' : 'PENDING_SUPERVISOR',
            submittedBy:      diUser!.id,
          },
        })
      } catch {}
    }
  }

  // ─── SEED COMPLIANCE DOCS (from Insurance/RTO/Fitness/Permit/PUC sheets) ──
  const ambulance = machines['PC-AMB-0001']
  if (ambulance) {
    const complianceSeed = [
      { type: ComplianceType.INSURANCE, renewedDate: new Date('2025-04-01'), expiryDate: new Date('2026-03-31'), amount: 45000 },
      { type: ComplianceType.RTO_TAX,   renewedDate: new Date('2025-01-15'), expiryDate: new Date('2026-01-14'), amount: 12000 },
      { type: ComplianceType.FITNESS,   renewedDate: new Date('2024-08-10'), expiryDate: new Date('2026-08-09'), amount: 5000  },
      { type: ComplianceType.PERMIT,    renewedDate: new Date('2025-06-01'), expiryDate: new Date('2026-05-31'), amount: 8000  },
      { type: ComplianceType.PUC,       renewedDate: new Date('2026-03-01'), expiryDate: new Date('2026-06-15'), amount: 800   },
    ]
    for (const [i, c] of complianceSeed.entries()) {
      const daysToExpiry = Math.floor((c.expiryDate.getTime() - Date.now()) / 86400000)
      const status = daysToExpiry < 0 ? 'EXPIRED' : daysToExpiry < 30 ? 'EXPIRING_SOON' : 'VALID'
      await prisma.complianceDoc.upsert({
        where: { id: `seed-${ambulance.id}-${c.type}` },
        update: {},
        create: { id: `seed-${ambulance.id}-${c.type}`, machineId: ambulance.id, ...c, status: status as any, entryNumber: i + 1 },
      })
    }
  }

  // ─── SEED MAINTENANCE (from Periodical Maintenance sheet) ──
  if (ambulance) {
    await prisma.maintenanceLog.createMany({
      skipDuplicates: true,
      data: [
        { machineId: ambulance.id, serviceNumber: 1, task: '500 Hrs Service: Oil, Hyd oil, Tx Oil Filter and oil change', totalCost: 12000, standardHrKm: 30000, serviceCarriedHrKm: 31000, servicedAt: new Date('2026-01-20'), nextServiceHrKm: 60000 },
        { machineId: ambulance.id, serviceNumber: 2, task: '500 Hrs Service: Oil, Hyd oil, Tx Oil Filter and oil change', totalCost: 13500, standardHrKm: 60000, serviceCarriedHrKm: 59000, servicedAt: new Date('2026-05-20'), nextServiceHrKm: 90000 },
      ],
    })
  }

  // ─── SEED BREAKDOWN LOGS ────────────────────────────────
  const excavator = machines['PC-EXC-0001']
  if (excavator) {
    await prisma.breakdownLog.create({
      data: {
        machineId:     excavator.id,
        status:        MachineStatus.BREAKDOWN,
        defectNature:  'Hydraulic hose burst — bucket arm not responding',
        actionTaken:   'Hose replacement ordered, ETA 2 days',
        defectFromDate:new Date(Date.now() - 2 * 86400000),
        targetRunDate: new Date(Date.now() + 1 * 86400000),
      },
    })
  }

  console.log('✅ Seeding complete')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
