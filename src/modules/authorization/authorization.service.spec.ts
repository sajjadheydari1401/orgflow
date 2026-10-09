import { ConflictException, NotFoundException } from '@nestjs/common';
import { jest } from '@jest/globals';
import type { PrismaService } from '../../prisma/prisma.service.js';
import { AuthorizationService } from './authorization.service.js';
import type { ResourceData } from './types/resource.js';

const resource: ResourceData = {
  id: 'resource-1',
  route: '/users',
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
const permissionFirst = jest.fn(async () => null as { id: string } | null);
const permissionWhere = jest.fn(() => ({ first: permissionFirst }));

const prisma = {
  public: {
    Resource: {
      where: resourceWhere,
      create: resourceCreate,
      orderBy: resourceOrderBy,
    },
    Permission: { where: permissionWhere },
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
    permissionWhere.mockClear();

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
    permissionFirst.mockResolvedValueOnce({ id: 'permission-1' });

    await expect(service.deleteResource(resource.id)).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(resourceDelete).not.toHaveBeenCalled();
  });
});
