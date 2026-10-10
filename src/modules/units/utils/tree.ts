import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { UnitData, UnitTreeNode } from '../types/unit';

// Normalizes the unit list by filtering out invalid entries.
function normalizeUnits(units?: UnitData[] | null): UnitData[] {
  if (!Array.isArray(units)) {
    return [];
  }

  // Filter out any null or undefined units and ensure each unit has a valid ID.
  return units.filter(
    (unit): unit is UnitData => !!unit && typeof unit.id === 'string',
  );
}

// Converts the flat unit list into a nested tree.
export function buildTree(units?: UnitData[] | null): UnitTreeNode[] {
  const roots: UnitTreeNode[] = [];

  // Normalize the units to ensure we have a valid array.
  const safeUnits = normalizeUnits(units);

  // Create a node for every unit so parents can be found by ID.
  const nodes = new Map<string, UnitTreeNode>(
    safeUnits.map((unit) => [unit.id, { ...unit, children: [] }]),
  );

  for (const node of nodes.values()) {
    // If the unit has no parent, it's a root node.
    if (node.parentId === null) {
      roots.push(node);
      continue;
    }

    // If the unit has a parent, find it.
    const parent = nodes.get(node.parentId);

    if (parent) {
      // If the parent exists, add this unit to its children.
      parent.children.push(node);
    } else {
      // Keep the unit visible if its parent isn't in the supplied list.
      roots.push(node);
    }
  }

  return roots;
}

// Assert that the target parent unit is valid for moving a unit.
export function assertTargetParentIsValid(
  unit: UnitData,
  targetUnitId?: string | null,
  unitsById?: Map<string, UnitData>,
): void {
  const safeUnitsById = unitsById instanceof Map ? unitsById : new Map();
  const visited = new Set<string>();
  let ancestorId: string | null = targetUnitId ?? null;

  while (ancestorId !== null) {
    if (ancestorId === unit.id) {
      throw new ConflictException(
        'Cannot move a unit under itself or one of its descendants',
      );
    }

    if (visited.has(ancestorId)) {
      throw new ConflictException(
        'Cannot move a unit into a hierarchy that contains a cycle',
      );
    }

    visited.add(ancestorId);
    const ancestor = safeUnitsById.get(ancestorId);

    if (!ancestor) {
      throw new NotFoundException('Target parent unit not found');
    }

    if (!ancestor.isActive) {
      throw new ForbiddenException('Cannot move a unit under an inactive unit');
    }

    ancestorId = ancestor.parentId;
  }
}

// Assert that the target parent unit does not have a sibling with the same name.
export function assertSiblingNameAvailable(
  unit: UnitData,
  targetUnitId?: string | null,
  units?: UnitData[] | null,
): void {
  const safeUnits = normalizeUnits(units);
  const duplicate = safeUnits.some(
    (candidate) =>
      candidate.id !== unit.id &&
      candidate.parentId === (targetUnitId ?? null) &&
      candidate.name === unit.name,
  );

  if (duplicate) {
    throw new ConflictException(
      'A unit with this name already exists under the target parent',
    );
  }
}
