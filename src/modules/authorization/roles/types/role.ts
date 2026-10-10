export enum RoleScopeEnum {
  SELF = 'SELF',
  DESCENDANTS = 'DESCENDANTS',
}

export type RoleScope = `${RoleScopeEnum}`;

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
