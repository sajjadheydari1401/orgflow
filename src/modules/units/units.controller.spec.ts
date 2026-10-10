import { jest } from '@jest/globals';
import type { UnitsService } from './units.service.js';
import { UnitsController } from './units.controller.js';
import type { UnitData } from './types/unit.js';

const unit: UnitData = {
  id: 'unit-1',
  parentId: null,
  name: 'Finance',
  type: 'DEPARTMENT',
  description: null,
  isActive: true,
  createdAt: '2026-10-10T00:00:00.000Z',
  updatedAt: '2026-10-10T00:00:00.000Z',
};

describe('UnitsController', () => {
  it('delegates unit creation', async () => {
    const createUnit = jest.fn(async () => unit);
    const controller = new UnitsController({
      createUnit,
    } as unknown as UnitsService);
    const input = { name: 'Finance', type: 'DEPARTMENT' as const };

    await expect(controller.createUnit(input)).resolves.toBe(unit);
    expect(createUnit).toHaveBeenCalledWith(input);
  });

  it('delegates unit listing', async () => {
    const listUnits = jest.fn(async () => [unit]);
    const controller = new UnitsController({
      listUnits,
    } as unknown as UnitsService);

    await expect(controller.listUnits()).resolves.toEqual([unit]);
  });

  it('delegates unit lookup', async () => {
    const getUnit = jest.fn(async () => unit);
    const controller = new UnitsController({
      getUnit,
    } as unknown as UnitsService);

    await expect(controller.getUnit(unit.id)).resolves.toBe(unit);
    expect(getUnit).toHaveBeenCalledWith(unit.id);
  });

  it('delegates unit updates', async () => {
    const updateUnit = jest.fn(async () => unit);
    const controller = new UnitsController({
      updateUnit,
    } as unknown as UnitsService);
    const input = {
      name: 'Finance',
      type: 'DEPARTMENT' as const,
      description: null,
      isActive: false,
    };

    await expect(controller.updateUnit(unit.id, input)).resolves.toBe(unit);
    expect(updateUnit).toHaveBeenCalledWith(unit.id, input);
  });

  it('delegates unit deletion', async () => {
    const deleteUnit = jest.fn(async () => ({ deleted: true as const }));
    const controller = new UnitsController({
      deleteUnit,
    } as unknown as UnitsService);

    await expect(controller.deleteUnit(unit.id)).resolves.toEqual({
      deleted: true,
    });
    expect(deleteUnit).toHaveBeenCalledWith(unit.id);
  });
});
