import type { Models } from '../../../../prisma/contract.d.js';

export type PermissionAction = Models.public_Permission['action'];

export const PERMISSION_ACTIONS: PermissionAction[] = [
  'READ',
  'CREATE',
  'UPDATE',
  'DELETE',
  'PATCH',
];

export interface PermissionData {
  id: string;
  resourceId: string;
  action: PermissionAction;
  createdAt: string;
  updatedAt: string;
}
