import type { Models } from '../../../../prisma/contract.d.js';

export type RoleScope = Models.public_Role['scope'];

export const ROLE_SCOPES: RoleScope[] = ['SELF', 'DESCENDANTS'];

export interface RoleData {
  id: string;
  unitId: string;
  name: string;
  description: string | null;
  scope: RoleScope;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
