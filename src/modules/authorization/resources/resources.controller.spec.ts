import { jest } from '@jest/globals';
import type { ResourcesService } from './resources.service.js';
import { ResourcesController } from './resources.controller.js';
import type { ResourceData } from './types/resource.js';

const resource: ResourceData = {
  id: 'resource-1',
  route: '/users',
  createdAt: '2026-10-09T00:00:00.000Z',
  updatedAt: '2026-10-09T00:00:00.000Z',
};

describe('ResourcesController', () => {
  it('delegates resource creation', async () => {
    const createResource = jest.fn(async () => resource);
    const controller = new ResourcesController({
      createResource,
    } as unknown as ResourcesService);

    await expect(controller.createResource({ route: '/users' })).resolves.toBe(
      resource,
    );
    expect(createResource).toHaveBeenCalledWith({ route: '/users' });
  });

  it('delegates resource listing', async () => {
    const listResources = jest.fn(async () => [resource]);
    const controller = new ResourcesController({
      listResources,
    } as unknown as ResourcesService);

    await expect(controller.listResources()).resolves.toEqual([resource]);
  });

  it('delegates resource lookup', async () => {
    const getResource = jest.fn(async () => resource);
    const controller = new ResourcesController({
      getResource,
    } as unknown as ResourcesService);

    await expect(controller.getResource(resource.id)).resolves.toBe(resource);
    expect(getResource).toHaveBeenCalledWith(resource.id);
  });

  it('delegates resource updates', async () => {
    const updateResource = jest.fn(async () => resource);
    const controller = new ResourcesController({
      updateResource,
    } as unknown as ResourcesService);

    await expect(
      controller.updateResource(resource.id, { route: '/members' }),
    ).resolves.toBe(resource);
    expect(updateResource).toHaveBeenCalledWith(resource.id, {
      route: '/members',
    });
  });

  it('delegates resource deletion', async () => {
    const deleteResource = jest.fn(async () => ({ deleted: true as const }));
    const controller = new ResourcesController({
      deleteResource,
    } as unknown as ResourcesService);

    await expect(controller.deleteResource(resource.id)).resolves.toEqual({
      deleted: true,
    });
    expect(deleteResource).toHaveBeenCalledWith(resource.id);
  });
});
