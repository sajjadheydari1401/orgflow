import { jest } from '@jest/globals';
import type { AuthorizationService } from './authorization.service.js';
import { AuthorizationController } from './authorization.controller.js';
import type { PermissionData } from './types/permission.js';
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

describe('AuthorizationController resources', () => {
  it('delegates resource creation', async () => {
    const createResource = jest.fn(async () => resource);
    const controller = new AuthorizationController({
      createResource,
    } as unknown as AuthorizationService);

    await expect(controller.createResource({ route: '/users' })).resolves.toBe(
      resource,
    );
    expect(createResource).toHaveBeenCalledWith({ route: '/users' });
  });

  it('delegates resource listing', async () => {
    const listResources = jest.fn(async () => [resource]);
    const controller = new AuthorizationController({
      listResources,
    } as unknown as AuthorizationService);

    await expect(controller.listResources()).resolves.toEqual([resource]);
  });

  it('delegates resource lookup', async () => {
    const getResource = jest.fn(async () => resource);
    const controller = new AuthorizationController({
      getResource,
    } as unknown as AuthorizationService);

    await expect(controller.getResource(resource.id)).resolves.toBe(resource);
    expect(getResource).toHaveBeenCalledWith(resource.id);
  });

  it('delegates resource updates', async () => {
    const updateResource = jest.fn(async () => resource);
    const controller = new AuthorizationController({
      updateResource,
    } as unknown as AuthorizationService);

    await expect(
      controller.updateResource(resource.id, { route: '/members' }),
    ).resolves.toBe(resource);
    expect(updateResource).toHaveBeenCalledWith(resource.id, {
      route: '/members',
    });
  });

  it('delegates resource deletion', async () => {
    const deleteResource = jest.fn(async () => ({ deleted: true as const }));
    const controller = new AuthorizationController({
      deleteResource,
    } as unknown as AuthorizationService);

    await expect(controller.deleteResource(resource.id)).resolves.toEqual({
      deleted: true,
    });
    expect(deleteResource).toHaveBeenCalledWith(resource.id);
  });

  it('delegates permission creation', async () => {
    const createPermission = jest.fn(async () => permission);
    const controller = new AuthorizationController({
      createPermission,
    } as unknown as AuthorizationService);

    await expect(
      controller.createPermission({ resourceId: resource.id, action: 'READ' }),
    ).resolves.toBe(permission);
    expect(createPermission).toHaveBeenCalledWith({
      resourceId: resource.id,
      action: 'READ',
    });
  });

  it('delegates permission listing', async () => {
    const listPermissions = jest.fn(async () => [permission]);
    const controller = new AuthorizationController({
      listPermissions,
    } as unknown as AuthorizationService);

    await expect(controller.listPermissions()).resolves.toEqual([permission]);
  });

  it('delegates permission lookup', async () => {
    const getPermission = jest.fn(async () => permission);
    const controller = new AuthorizationController({
      getPermission,
    } as unknown as AuthorizationService);

    await expect(controller.getPermission(permission.id)).resolves.toBe(
      permission,
    );
    expect(getPermission).toHaveBeenCalledWith(permission.id);
  });

  it('delegates permission updates', async () => {
    const updatePermission = jest.fn(async () => permission);
    const controller = new AuthorizationController({
      updatePermission,
    } as unknown as AuthorizationService);

    await expect(
      controller.updatePermission(permission.id, {
        resourceId: resource.id,
        action: 'UPDATE',
      }),
    ).resolves.toBe(permission);
    expect(updatePermission).toHaveBeenCalledWith(permission.id, {
      resourceId: resource.id,
      action: 'UPDATE',
    });
  });

  it('delegates permission deletion', async () => {
    const deletePermission = jest.fn(async () => ({ deleted: true as const }));
    const controller = new AuthorizationController({
      deletePermission,
    } as unknown as AuthorizationService);

    await expect(controller.deletePermission(permission.id)).resolves.toEqual({
      deleted: true,
    });
    expect(deletePermission).toHaveBeenCalledWith(permission.id);
  });
});
