import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { UnitData, UnitTreeNode } from '../types/unit';

// Converts the flat unit list into a nested tree.
export function buildTree(units: UnitData[]): UnitTreeNode[] {
  const roots: UnitTreeNode[] = [];

  // Create a node for every unit so parents can be found by ID.
  const nodes = new Map<string, UnitTreeNode>(
    units.map((unit) => [unit.id, { ...unit, children: [] }]),
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
  targetUnitId: string | null,
  unitsById: Map<string, UnitData>,
): void {
  const visited = new Set<string>();
  let ancestorId = targetUnitId;

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
    const ancestor = unitsById.get(ancestorId);

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
  targetUnitId: string | null,
  units: UnitData[],
): void {
  const duplicate = units.some(
    (candidate) =>
      candidate.id !== unit.id &&
      candidate.parentId === targetUnitId &&
      candidate.name === unit.name,
  );

  if (duplicate) {
    throw new ConflictException(
      'A unit with this name already exists under the target parent',
    );
  }
}
