import { jest } from '@jest/globals';
import type { AuthorizationService } from './authorization.service.js';
import { AuthorizationController } from './authorization.controller.js';
import type { ResourceData } from './types/resource.js';

const resource: ResourceData = {
  id: 'resource-1',
  route: '/users',
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
});
