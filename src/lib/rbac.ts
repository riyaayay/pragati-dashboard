import { Role } from '@prisma/client'

// Who can VIEW dashboards and reports
export const CAN_VIEW_ALL_SITES:  Role[] = [Role.ADMIN, Role.MD, Role.DGM]
export const CAN_VIEW_REPORTS:    Role[] = [Role.ADMIN, Role.MD, Role.DGM, Role.SITE_MANAGER]
export const CAN_REVIEW_DPR:      Role[] = [Role.SUPERVISOR, Role.SITE_MANAGER]
export const CAN_SUBMIT_DPR:      Role[] = [Role.DATA_INTERPRETER]
export const CAN_MANAGE_SYSTEM:   Role[] = [Role.ADMIN]

export function canViewAllSites(role: Role): boolean {
  return CAN_VIEW_ALL_SITES.includes(role)
}

export function canSubmitDPR(role: Role): boolean {
  return role === Role.DATA_INTERPRETER
}

export function canReview(role: Role): boolean {
  return role === Role.SUPERVISOR || role === Role.SITE_MANAGER
}

export function canAdmin(role: Role): boolean {
  return role === Role.ADMIN
}

// What to show in the sidebar for each role
export function getNavItems(role: Role) {
  const base = [{ href: '/dashboard', label: 'Dashboard', icon: 'grid' }]

  if (role === Role.DATA_INTERPRETER) {
    return [...base, { href: '/submit', label: 'Submit DPR', icon: 'upload' }]
  }

  if (role === Role.SUPERVISOR) {
    return [...base,
      { href: '/review',     label: 'Review Queue', icon: 'check-circle' },
      { href: '/dpr',        label: 'DPR Report',   icon: 'file-text' },
    ]
  }

  const managerItems = [
    ...base,
    { href: '/dpr',         label: 'DPR Report',       icon: 'file-text' },
    { href: '/breakdown',   label: 'Breakdown & Idle',  icon: 'alert-triangle' },
    { href: '/maintenance', label: 'Maintenance',       icon: 'tool' },
    { href: '/compliance',  label: 'Compliance Docs',   icon: 'shield' },
  ]

  if (role === Role.ADMIN) {
    return [...managerItems, { href: '/admin', label: 'Admin Panel', icon: 'settings' }]
  }

  return managerItems
}
