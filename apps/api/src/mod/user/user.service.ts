import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUserDto } from './dto/query-user.dto';
import * as bcrypt from 'bcryptjs';
import { Role, UserStatus, Prisma } from '@prisma/client';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateUserDto) {
    const existingEmail = await this.prisma.account.findUnique({
      where: { email: dto.email.toLowerCase().trim() },
    });
    if (existingEmail) {
      throw new ConflictException(`Email '${dto.email}' đã được sử dụng.`);
    }

    if (dto.username) {
      const existingUsername = await this.prisma.account.findUnique({
        where: { username: dto.username.toLowerCase().trim() },
      });
      if (existingUsername) {
        throw new ConflictException(`Tên đăng nhập '${dto.username}' đã tồn tại.`);
      }
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const created = await this.prisma.account.create({
      data: {
        email: dto.email.toLowerCase().trim(),
        username: dto.username ? dto.username.toLowerCase().trim() : null,
        passwordHash,
        role: dto.role ?? Role.CUSTOMER,
        status: dto.status ?? UserStatus.ACTIVE,
        user: {
          create: {
            fullName: dto.fullName?.trim() || null,
            phone: dto.phone?.trim() || null,
            birthday: dto.birthday ? new Date(dto.birthday) : null,
            gender: dto.gender || null,
            address: dto.address?.trim() || null,
            avatar: dto.avatar || null,
          },
        },
      },
      include: {
        user: true,
      },
    });

    const { passwordHash: _, ...safeAccount } = created;
    return safeAccount;
  }

  async findAll(query: QueryUserDto) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.AccountWhereInput = {};

    if (query.role) {
      where.role = query.role;
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.keyword) {
      const kw = query.keyword.trim();
      where.OR = [
        { email: { contains: kw } },
        { username: { contains: kw } },
        { user: { fullName: { contains: kw } } },
        { user: { phone: { contains: kw } } },
      ];
    }

    const [total, accounts] = await Promise.all([
      this.prisma.account.count({ where }),
      this.prisma.account.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            include: {
              _count: {
                select: {
                  bookings: true,
                },
              },
            },
          },
        },
      }),
    ]);

    const items = accounts.map(({ passwordHash: _, ...acc }) => ({
      ...acc,
      bookingsCount: acc.user?._count?.bookings ?? 0,
    }));

    return {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    // Tìm theo user.id hoặc account.id
    const account = await this.prisma.account.findFirst({
      where: {
        OR: [{ id }, { user: { id } }],
      },
      include: {
        user: {
          include: {
            bookings: {
              take: 5,
              orderBy: { createdAt: 'desc' },
              select: {
                id: true,
                bookingCode: true,
                totalAmount: true,
                status: true,
                createdAt: true,
              },
            },
            _count: {
              select: {
                bookings: true,
                reviews: true,
              },
            },
          },
        },
      },
    });

    if (!account) {
      throw new NotFoundException(`Không tìm thấy người dùng với mã: ${id}`);
    }

    const { passwordHash: _, ...safeAccount } = account;
    return safeAccount;
  }

  async update(id: string, dto: UpdateUserDto) {
    const existing = await this.prisma.account.findFirst({
      where: {
        OR: [{ id }, { user: { id } }],
      },
      include: { user: true },
    });

    if (!existing) {
      throw new NotFoundException(`Không tìm thấy người dùng với mã: ${id}`);
    }

    // Kiểm tra trùng email nếu đổi email
    if (dto.email && dto.email.toLowerCase().trim() !== existing.email) {
      const emailDup = await this.prisma.account.findUnique({
        where: { email: dto.email.toLowerCase().trim() },
      });
      if (emailDup) {
        throw new ConflictException(`Email '${dto.email}' đã được tài khoản khác sử dụng.`);
      }
    }

    // Kiểm tra trùng username nếu đổi username
    if (dto.username && dto.username.toLowerCase().trim() !== existing.username) {
      const usernameDup = await this.prisma.account.findUnique({
        where: { username: dto.username.toLowerCase().trim() },
      });
      if (usernameDup) {
        throw new ConflictException(`Tên đăng nhập '${dto.username}' đã tồn tại.`);
      }
    }

    const updateAccountData: Prisma.AccountUpdateInput = {};
    if (dto.email) updateAccountData.email = dto.email.toLowerCase().trim();
    if (dto.username !== undefined) updateAccountData.username = dto.username?.toLowerCase().trim() || null;
    if (dto.role) updateAccountData.role = dto.role;
    if (dto.status) updateAccountData.status = dto.status;

    const passwordToChange = dto.newPassword || dto.password;
    if (passwordToChange) {
      updateAccountData.passwordHash = await bcrypt.hash(passwordToChange, 10);
    }

    const updateUserProfileData: Prisma.UserUpdateWithoutAccountInput = {};
    if (dto.fullName !== undefined) updateUserProfileData.fullName = dto.fullName?.trim() || null;
    if (dto.phone !== undefined) updateUserProfileData.phone = dto.phone?.trim() || null;
    if (dto.birthday !== undefined) updateUserProfileData.birthday = dto.birthday ? new Date(dto.birthday) : null;
    if (dto.gender !== undefined) updateUserProfileData.gender = dto.gender || null;
    if (dto.address !== undefined) updateUserProfileData.address = dto.address?.trim() || null;
    if (dto.avatar !== undefined) updateUserProfileData.avatar = dto.avatar || null;

    const updated = await this.prisma.account.update({
      where: { id: existing.id },
      data: {
        ...updateAccountData,
        user: {
          upsert: {
            create: {
              fullName: dto.fullName?.trim() || null,
              phone: dto.phone?.trim() || null,
              birthday: dto.birthday ? new Date(dto.birthday) : null,
              gender: dto.gender || null,
              address: dto.address?.trim() || null,
              avatar: dto.avatar || null,
            },
            update: updateUserProfileData,
          },
        },
      },
      include: {
        user: true,
      },
    });

    const { passwordHash: _, ...safeAccount } = updated;
    return safeAccount;
  }

  async remove(id: string) {
    const existing = await this.prisma.account.findFirst({
      where: {
        OR: [{ id }, { user: { id } }],
      },
      include: {
        user: {
          include: {
            _count: {
              select: { bookings: true },
            },
          },
        },
      },
    });

    if (!existing) {
      throw new NotFoundException(`Không tìm thấy người dùng với mã: ${id}`);
    }

    // Nếu người dùng đã có vé đặt, không hard delete để bảo toàn tính toàn vẹn tài chính, mà chuyển status = BANNED
    const bookingCount = existing.user?._count?.bookings ?? 0;
    if (bookingCount > 0) {
      const banned = await this.prisma.account.update({
        where: { id: existing.id },
        data: { status: UserStatus.BANNED },
        include: { user: true },
      });
      const { passwordHash: _, ...safe } = banned;
      return {
        message: `Người dùng có ${bookingCount} đơn đặt vé. Đã chuyển trạng thái tài khoản sang BANNED (khóa tài khoản).`,
        account: safe,
      };
    }

    await this.prisma.account.delete({
      where: { id: existing.id },
    });

    return {
      message: `Đã xóa tài khoản '${existing.email}' thành công.`,
      id: existing.id,
    };
  }
}
