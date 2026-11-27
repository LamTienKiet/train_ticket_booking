import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { Role } from '@prisma/client';
import { AuthResult, SignInData, RegisterResponseDto } from './auth.interface';
// DB chỉ lưu sha256 của refresh token: lộ DB không dùng được token
const hashToken = (token: string) =>
  crypto.createHash('sha256').update(token).digest('hex');

@Injectable()
export class AuthService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async authenticate(input: LoginDto): Promise<AuthResult> {
    const user = await this.validateUser(input);
    if (!user) {
      throw new UnauthorizedException('Tên đăng nhập hoặc mật khẩu không chính xác');
    }
    return this.signIn(user);
  }

  async validateUser(input: LoginDto): Promise<SignInData | null> {
    const account = await this.prismaService.account.findFirst({
      where: {
        OR: [
          { username: input.username },
          { email: input.username },
        ],
      },

      include: {
        user: true,
      },
    });

    if (!account || account.status !== 'ACTIVE') {
      return null;
    }

    if (await bcrypt.compare(input.password, account.passwordHash)) {
      if (!account.user) {
        throw new InternalServerErrorException(
          'Tài khoản thiếu dữ liệu user liên kết',
        );
      }
      return {
        id: account.user.id,
        accountId: account.id,
        username: account.username,
        role: account.role,
        email: account.email,
        fullName: account.user.fullName || '',
        phone: account.user.phone || null,
      };
    }
    return null;

    //
  }

  async signIn(user: SignInData): Promise<AuthResult> {
    const tokenPayload = {
      sub: user.id,
      accountId: user.accountId,
      username: user.username,
      role: user.role,
      email: user.email,
      fullName: user.fullName,
      phone: user.phone,
    };

    const accessToken = await this.jwtService.signAsync(tokenPayload);

    // Generate Refresh Token
    const refreshToken = crypto.randomBytes(40).toString('hex');
    const expiredAt = new Date();
    expiredAt.setDate(expiredAt.getDate() + 7); // 7 days expiration

    await this.prismaService.refreshToken.create({
      data: {
        tokenHash: hashToken(refreshToken),
        expiresAt: expiredAt,
        accountId: user.accountId,
      },
    });

    return {
      accessToken,
      refreshToken,
      id: user.id,
      accountId: user.accountId,
      username: user.username,
      role: user.role,
      email: user.email,
      fullName: user.fullName,
      phone: user.phone,
    };
  }

  async refreshToken(token: string): Promise<AuthResult> {
    const existingToken = await this.prismaService.refreshToken.findUnique({
      where: { tokenHash: hashToken(token) },
      include: {
        account: {
          include: { user: true },
        },
      },
    });

    if (!existingToken) {
      throw new UnauthorizedException('Refresh token không hợp lệ');
    }

    if (new Date() > existingToken.expiresAt) {
      await this.prismaService.refreshToken.delete({
        where: { id: existingToken.id },
      });
      throw new UnauthorizedException('Refresh token đã hết hạn');
    }

    const account = existingToken.account;
    if (account.status !== 'ACTIVE') {
      throw new UnauthorizedException('Tài khoản đã bị khóa');
    }

    if (!account.user) {
      throw new InternalServerErrorException(
        'Tài khoản thiếu dữ liệu user liên kết',
      );
    }

    const userData: SignInData = {
      id: account.user.id,
      accountId: account.id,
      username: account.username,
      role: account.role,
      email: account.email,
      fullName: account.user.fullName || '',
      phone: account.user.phone || null,
    };

    const tokenPayload = {
      sub: userData.id,
      accountId: userData.accountId,
      username: userData.username,
      role: userData.role,
      email: userData.email,
      fullName: userData.fullName,
      phone: userData.phone,
    };

    const accessToken = await this.jwtService.signAsync(tokenPayload);
    const newRefreshToken = crypto.randomBytes(40).toString('hex');
    const expiredAt = new Date();
    expiredAt.setDate(expiredAt.getDate() + 7);

    // Xóa token cũ và tạo token mới trong cùng 1 transaction (Token Rotation an toàn)
    await this.prismaService.$transaction([
      this.prismaService.refreshToken.delete({
        where: { id: existingToken.id },
      }),
      this.prismaService.refreshToken.create({
        data: {
          tokenHash: hashToken(newRefreshToken),
          expiresAt: expiredAt,
          accountId: userData.accountId,
        },
      }),
    ]);

    return {
      accessToken,
      refreshToken: newRefreshToken,
      id: userData.id,
      accountId: userData.accountId,
      username: userData.username,
      role: userData.role,
      email: userData.email,
      fullName: userData.fullName,
      phone: userData.phone,
    };
  }

  /** Đăng xuất: thu hồi refresh token (không báo lỗi nếu token không tồn tại) */
  async logout(token: string): Promise<{ message: string }> {
    await this.prismaService.refreshToken.deleteMany({
      where: { tokenHash: hashToken(token) },
    });
    return { message: 'Đăng xuất thành công' };
  }

  async register(input: RegisterDto): Promise<RegisterResponseDto> {
    const account = await this.prismaService.account.findUnique({
      where: {
        username: input.username,
      },
    });

    const emailExist = await this.prismaService.account.findUnique({
      where: {
        email: input.email,
      },
    });

    if (input.confirmPassword !== input.password) {
      throw new BadRequestException('Mật khẩu xác nhận không khớp');
    }

    if (account) {
      throw new BadRequestException('Tên đăng nhập đã được sử dụng');
    }

    if (emailExist) {
      throw new BadRequestException('Email đã được đăng ký tài khoản');
    }
    const hashedPassword = await bcrypt.hash(input.password, 10);
    const newAccount = await this.prismaService.account.create({
      data: {
        username: input.username,
        email: input.email,
        passwordHash: hashedPassword,
        status: 'ACTIVE',
        role: Role.CUSTOMER,

        user: {
          create: {
            fullName: input.fullName,
            phone: input.phone,
          },
        },
      },

      include: {
        user: true,
      },
    });

    return {
      id: newAccount.id,
      fullName: newAccount.user!.fullName || '',
      username: newAccount.username,
      email: newAccount.email,
      phone: newAccount.user!.phone ?? '',
    };
  }

  async getProfile(userId: string) {
    const account = await this.prismaService.account.findFirst({
      where: {
        OR: [{ id: userId }, { user: { id: userId } }],
      },
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
    });

    if (!account || !account.user) {
      throw new UnauthorizedException('Không tìm thấy thông tin tài khoản');
    }

    return {
      id: account.user.id,
      accountId: account.id,
      username: account.username,
      email: account.email,
      role: account.role,
      status: account.status,
      fullName: account.user.fullName,
      phone: account.user.phone,
      avatar: account.user.avatar,
      birthday: account.user.birthday,
      gender: account.user.gender,
      address: account.user.address,
      createdAt: account.createdAt,
      bookingsCount: account.user._count?.bookings ?? 0,
    };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const account = await this.prismaService.account.findFirst({
      where: {
        OR: [{ id: userId }, { user: { id: userId } }],
      },
      include: { user: true },
    });

    if (!account || !account.user) {
      throw new UnauthorizedException('Không tìm thấy thông tin người dùng');
    }

    const updatedUser = await this.prismaService.user.update({
      where: { id: account.user.id },
      data: {
        fullName: dto.fullName !== undefined ? dto.fullName?.trim() || null : undefined,
        phone: dto.phone !== undefined ? dto.phone?.trim() || null : undefined,
        birthday: dto.birthday !== undefined ? (dto.birthday ? new Date(dto.birthday) : null) : undefined,
        gender: dto.gender !== undefined ? dto.gender || null : undefined,
        address: dto.address !== undefined ? dto.address?.trim() || null : undefined,
        avatar: dto.avatar !== undefined ? dto.avatar || null : undefined,
      },
    });

    return {
      id: updatedUser.id,
      accountId: account.id,
      username: account.username,
      email: account.email,
      role: account.role,
      fullName: updatedUser.fullName,
      phone: updatedUser.phone,
      avatar: updatedUser.avatar,
      birthday: updatedUser.birthday,
      gender: updatedUser.gender,
      address: updatedUser.address,
    };
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const account = await this.prismaService.account.findFirst({
      where: {
        OR: [{ id: userId }, { user: { id: userId } }],
      },
    });

    if (!account) {
      throw new UnauthorizedException('Không tìm thấy tài khoản');
    }

    const isMatch = await bcrypt.compare(dto.currentPassword, account.passwordHash);
    if (!isMatch) {
      throw new BadRequestException('Mật khẩu hiện tại không chính xác');
    }

    const newHash = await bcrypt.hash(dto.newPassword, 10);
    await this.prismaService.account.update({
      where: { id: account.id },
      data: { passwordHash: newHash },
    });

    return { message: 'Đổi mật khẩu thành công' };
  }
}
