import type { Models } from '../../../prisma/contract.d.js';

export type UnitType = Models.public_Unit['type'];

export const UNIT_TYPES: UnitType[] = ['TEAM', 'DEPARTMENT', 'MANAGEMENT'];

export interface UnitData {
  id: string;
  parentId: string | null;
  name: string;
  type: UnitType;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
