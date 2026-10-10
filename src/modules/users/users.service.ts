import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import type { UserData } from './types/user.js';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  // READ USERS
  async listUsers(): Promise<UserData[]> {
    const users = await this.prisma.public.User.orderBy((user) =>
      user.displayName.asc(),
    ).all();

    return users.map((user) => ({
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      mobile: user.mobile,
      isManager: user.isManager,
      emailVerifiedAt: user.emailVerifiedAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }));
  }

  // READ USER BY ID
  async getUser(id: string): Promise<UserData> {
    const user = await this.prisma.public.User.where({ id }).first();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      mobile: user.mobile,
      isManager: user.isManager,
      emailVerifiedAt: user.emailVerifiedAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  // UPDATE USER
  async updateUser(id: string, input: UpdateUserDto): Promise<UserData> {
    const existing = await this.prisma.public.User.where({ id }).first();

    if (!existing) {
      throw new NotFoundException('User not found');
    }

    const updateData: UpdateUserDto = {};

    if (input.displayName !== undefined) {
      updateData.displayName = input.displayName.trim();
    }
    if (input.avatarUrl !== undefined) {
      updateData.avatarUrl = input.avatarUrl;
    }
    if (input.mobile !== undefined) {
      updateData.mobile = input.mobile;
    }

    // Update the user in the database
    const updated = await this.prisma.public.User.where({ id }).update(
      updateData,
    );

    // Check if the user was updated
    if (!updated) {
      throw new NotFoundException('User not found');
    }

    return {
      id: updated.id,
      email: updated.email,
      displayName: updated.displayName,
      avatarUrl: updated.avatarUrl,
      mobile: updated.mobile,
      isManager: updated.isManager,
      emailVerifiedAt: updated.emailVerifiedAt,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  }

  // DELETE USER
  async deleteUser(id: string): Promise<{ deleted: true }> {
    const existing = await this.prisma.public.User.where({ id }).first();

    if (!existing) {
      throw new NotFoundException('User not found');
    }

    // Check if the user has any assigned roles before deletion
    const roleAssignment = await this.prisma.public.RoleAssignment.where({
      userId: id,
    }).first();

    if (roleAssignment) {
      throw new ConflictException(
        'Cannot delete a user while they have assigned roles',
      );
    }

    await this.prisma.public.User.where({ id }).delete();

    return { deleted: true };
  }
}
