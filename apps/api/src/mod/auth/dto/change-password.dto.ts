import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @IsString({ message: 'Mật khẩu hiện tại phải là chuỗi' })
  @IsNotEmpty({ message: 'Mật khẩu hiện tại không được để trống' })
  currentPassword: string;

  @IsString({ message: 'Mật khẩu mới phải là chuỗi' })
  @MinLength(6, { message: 'Mật khẩu mới phải có tối thiểu 6 ký tự' })
  @IsNotEmpty({ message: 'Mật khẩu mới không được để trống' })
  newPassword: string;
}
