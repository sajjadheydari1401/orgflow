import { ConflictException, NotFoundException } from '@nestjs/common';
import { jest } from '@jest/globals';
import type { PrismaService } from '../../prisma/prisma.service.js';
import { AuthorizationService } from './authorization.service.js';
import type { PermissionAction, PermissionData } from './types/permission.js';
import type { ResourceData } from './types/resource.js';

const resource: ResourceData = {
  id: 'resource-1',
  route: '/users',
  createdAt: '2026-10-09T00:00:00.000Z',
  updatedAt: '2026-10-09T00:00:00.000Z',
};
const permission: PermissionData = {
  id: 'permission-1',
  resourceId: resource.id,
  action: 'READ',
  createdAt: '2026-10-09T00:00:00.000Z',
  updatedAt: '2026-10-09T00:00:00.000Z',
};

const resourceFirst = jest.fn(async () => null as ResourceData | null);
const resourceUpdate = jest.fn(async (_data: { route: string }) => resource);
const resourceDelete = jest.fn(async () => resource);
const resourceCreate = jest.fn(async ({ route }: { route: string }) => ({
  ...resource,
  route,
}));
const resourceAll = jest.fn(async () => [] as ResourceData[]);
const resourceWhere = jest.fn(() => ({
  first: resourceFirst,
  update: resourceUpdate,
  delete: resourceDelete,
}));
const resourceOrderBy = jest.fn(() => ({ all: resourceAll }));
const permissionFirst = jest.fn(async () => null as PermissionData | null);
const permissionUpdate = jest.fn(
  async (_data: { resourceId: string; action: PermissionAction }) => permission,
);
const permissionDelete = jest.fn(async () => permission);
const permissionCreate = jest.fn(
  async (data: { resourceId: string; action: PermissionAction }) => ({
    ...permission,
    ...data,
  }),
);
const permissionAll = jest.fn(async () => [] as PermissionData[]);
const permissionWhere = jest.fn(() => ({
  first: permissionFirst,
  update: permissionUpdate,
  delete: permissionDelete,
}));
const permissionOrderBy = jest.fn(() => ({ all: permissionAll }));
const rolePermissionFirst = jest.fn(async () => null as { id: string } | null);
const rolePermissionWhere = jest.fn(() => ({ first: rolePermissionFirst }));

const prisma = {
  public: {
    Resource: {
      where: resourceWhere,
      create: resourceCreate,
      orderBy: resourceOrderBy,
    },
    Permission: {
      where: permissionWhere,
      create: permissionCreate,
      orderBy: permissionOrderBy,
    },
    RolePermission: { where: rolePermissionWhere },
  },
};

describe('AuthorizationService resources', () => {
  let service: AuthorizationService;

  beforeEach(() => {
    resourceFirst.mockReset().mockResolvedValue(null);
    resourceUpdate.mockReset().mockResolvedValue(resource);
    resourceDelete.mockReset().mockResolvedValue(resource);
    resourceCreate.mockReset().mockImplementation(async ({ route }) => ({
      ...resource,
      route,
    }));
    resourceAll.mockReset().mockResolvedValue([]);
    resourceWhere.mockClear();
    resourceOrderBy.mockClear();
    permissionFirst.mockReset().mockResolvedValue(null);
    permissionUpdate.mockReset().mockResolvedValue(permission);
    permissionDelete.mockReset().mockResolvedValue(permission);
    permissionCreate.mockReset().mockImplementation(async (data) => ({
      ...permission,
      ...data,
    }));
    permissionAll.mockReset().mockResolvedValue([]);
    permissionWhere.mockClear();
    permissionOrderBy.mockClear();
    rolePermissionFirst.mockReset().mockResolvedValue(null);
    rolePermissionWhere.mockClear();

    service = new AuthorizationService(prisma as unknown as PrismaService);
  });

  it('creates a resource with a trimmed route', async () => {
    await expect(
      service.createResource({ route: ' /users ' }),
    ).resolves.toEqual(resource);

    expect(resourceWhere).toHaveBeenCalledWith({ route: '/users' });
    expect(resourceCreate).toHaveBeenCalledWith({ route: '/users' });
  });

  it('rejects a duplicate route', async () => {
    resourceFirst.mockResolvedValueOnce(resource);

    await expect(
      service.createResource({ route: '/users' }),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(resourceCreate).not.toHaveBeenCalled();
  });

  it('lists resources in route order', async () => {
    resourceAll.mockResolvedValueOnce([resource]);

    await expect(service.listResources()).resolves.toEqual([resource]);
    expect(resourceOrderBy).toHaveBeenCalledTimes(1);
    expect(resourceAll).toHaveBeenCalledTimes(1);
  });

  it('gets a resource by id', async () => {
    resourceFirst.mockResolvedValueOnce(resource);

    await expect(service.getResource(resource.id)).resolves.toEqual(resource);
    expect(resourceWhere).toHaveBeenCalledWith({ id: resource.id });
  });

  it('throws when a resource does not exist', async () => {
    await expect(service.getResource('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('updates a resource route', async () => {
    const updated = { ...resource, route: '/members' };
    resourceFirst.mockResolvedValueOnce(resource).mockResolvedValueOnce(null);
    resourceUpdate.mockResolvedValueOnce(updated);

    await expect(
      service.updateResource(resource.id, { route: ' /members ' }),
    ).resolves.toEqual(updated);

    expect(resourceUpdate).toHaveBeenCalledWith({ route: '/members' });
  });

  it('rejects an update that conflicts with another resource route', async () => {
    resourceFirst
      .mockResolvedValueOnce(resource)
      .mockResolvedValueOnce({ ...resource, id: 'resource-2' });

    await expect(
      service.updateResource(resource.id, { route: '/other' }),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(resourceUpdate).not.toHaveBeenCalled();
  });

  it('deletes a resource when it has no permissions', async () => {
    resourceFirst.mockResolvedValueOnce(resource);

    await expect(service.deleteResource(resource.id)).resolves.toEqual({
      deleted: true,
    });
    expect(resourceDelete).toHaveBeenCalledTimes(1);
  });

  it('prevents deleting a resource that has permissions', async () => {
    resourceFirst.mockResolvedValueOnce(resource);
    permissionFirst.mockResolvedValueOnce(permission);

    await expect(service.deleteResource(resource.id)).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(resourceDelete).not.toHaveBeenCalled();
  });

  it('creates a permission for an existing resource', async () => {
    resourceFirst.mockResolvedValueOnce(resource);

    await expect(
      service.createPermission({ resourceId: resource.id, action: 'READ' }),
    ).resolves.toEqual(permission);

    expect(permissionCreate).toHaveBeenCalledWith({
      resourceId: resource.id,
      action: 'READ',
    });
  });

  it('rejects creating a permission for a missing resource', async () => {
    await expect(
      service.createPermission({ resourceId: resource.id, action: 'READ' }),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(permissionCreate).not.toHaveBeenCalled();
  });

  it('rejects a duplicate action on the same resource', async () => {
    resourceFirst.mockResolvedValueOnce(resource);
    permissionFirst.mockResolvedValueOnce(permission);

    await expect(
      service.createPermission({ resourceId: resource.id, action: 'READ' }),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(permissionCreate).not.toHaveBeenCalled();
  });

  it('lists permissions ordered by action', async () => {
    permissionAll.mockResolvedValueOnce([permission]);

    await expect(service.listPermissions()).resolves.toEqual([permission]);
    expect(permissionOrderBy).toHaveBeenCalledTimes(1);
  });

  it('gets a permission by id', async () => {
    permissionFirst.mockResolvedValueOnce(permission);

    await expect(service.getPermission(permission.id)).resolves.toEqual(
      permission,
    );
  });

  it('rejects getting a missing permission', async () => {
    await expect(service.getPermission('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('updates a permission', async () => {
    const updated = { ...permission, action: 'UPDATE' as const };
    permissionFirst
      .mockResolvedValueOnce(permission)
      .mockResolvedValueOnce(null);
    permissionUpdate.mockResolvedValueOnce(updated);
    resourceFirst.mockResolvedValueOnce(resource);

    await expect(
      service.updatePermission(permission.id, {
        resourceId: resource.id,
        action: 'UPDATE',
      }),
    ).resolves.toEqual(updated);

    expect(permissionUpdate).toHaveBeenCalledWith({
      resourceId: resource.id,
      action: 'UPDATE',
    });
  });

  it('rejects updating a permission to a duplicate resource/action pair', async () => {
    permissionFirst
      .mockResolvedValueOnce(permission)
      .mockResolvedValueOnce({ ...permission, id: 'permission-2' });
    resourceFirst.mockResolvedValueOnce(resource);

    await expect(
      service.updatePermission(permission.id, {
        resourceId: resource.id,
        action: 'READ',
      }),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(permissionUpdate).not.toHaveBeenCalled();
  });

  it('deletes a permission that is not assigned to a role', async () => {
    permissionFirst.mockResolvedValueOnce(permission);

    await expect(service.deletePermission(permission.id)).resolves.toEqual({
      deleted: true,
    });
    expect(permissionDelete).toHaveBeenCalledTimes(1);
  });

  it('prevents deleting a permission assigned to a role', async () => {
    permissionFirst.mockResolvedValueOnce(permission);
    rolePermissionFirst.mockResolvedValueOnce({ id: 'role-permission-1' });

    await expect(
      service.deletePermission(permission.id),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(permissionDelete).not.toHaveBeenCalled();
  });
});
