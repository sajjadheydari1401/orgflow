export enum PermissionActionEnum {
  READ = 'READ',
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  PATCH = 'PATCH',
}

export type PermissionAction = `${PermissionActionEnum}`;

export interface PermissionData {
  id: string;
  resourceId: string;
  action: PermissionAction;
  createdAt: string;
  updatedAt: string;
}
