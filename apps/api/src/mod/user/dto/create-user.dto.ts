import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  IsDateString,
} from 'class-validator';
import { Role, UserStatus } from '@prisma/client';

export class CreateUserDto {
  @IsEmail({}, { message: 'Email không đúng định dạng' })
  @IsNotEmpty({ message: 'Email không được để trống' })
  email: string;

  @IsString({ message: 'Mật khẩu phải là chuỗi' })
  @MinLength(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự' })
  @IsNotEmpty({ message: 'Mật khẩu không được để trống' })
  password: string;

  @IsOptional()
  @IsString({ message: 'Tên đăng nhập phải là chuỗi' })
  username?: string;

  @IsOptional()
  @IsEnum(Role, { message: 'Role không hợp lệ (CUSTOMER | STAFF | ADMIN)' })
  role?: Role;

  @IsOptional()
  @IsEnum(UserStatus, { message: 'Trạng thái không hợp lệ (ACTIVE | INACTIVE | BANNED)' })
  status?: UserStatus;

  @IsOptional()
  @IsString({ message: 'Họ và tên phải là chuỗi' })
  fullName?: string;

  @IsOptional()
  @IsString({ message: 'Số điện thoại phải là chuỗi' })
  phone?: string;

  @IsOptional()
  @IsDateString({}, { message: 'Ngày sinh phải đúng định dạng ngày (YYYY-MM-DD)' })
  birthday?: string;

  @IsOptional()
  @IsString({ message: 'Giới tính phải là chuỗi' })
  gender?: string;

  @IsOptional()
  @IsString({ message: 'Địa chỉ phải là chuỗi' })
  address?: string;

  @IsOptional()
  @IsString({ message: 'Avatar phải là chuỗi URL' })
  avatar?: string;
}
