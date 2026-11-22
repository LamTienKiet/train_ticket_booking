import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Length,
  MaxLength,
  MinLength,
  Matches,
} from 'class-validator';

export class RegisterDto {
  @IsString()
  @IsNotEmpty({ message: 'Họ và tên không được để trống' })
  fullName!: string;

  @IsNotEmpty({ message: 'Email không được để trống' })
  @IsEmail({}, { message: 'Email không đúng định dạng' })
  email!: string;

  @IsNotEmpty({ message: 'Tên đăng nhập không được để trống' })
  @IsString()
  @MinLength(3, { message: 'Tên đăng nhập phải có ít nhất 3 ký tự' })
  username!: string;

  @IsNotEmpty({ message: 'Số điện thoại không được để trống' })
  @IsString()
  @Matches(/^(0[0-9]{9})$/, {
    message: 'Số điện thoại phải gồm 10 số và bắt đầu bằng số 0',
  })
  phone!: string;

  @IsNotEmpty({ message: 'Mật khẩu không được để trống' })
  @IsString()
  @MinLength(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự' })
  @MaxLength(50, { message: 'Mật khẩu không được vượt quá 50 ký tự' })
  password!: string;

  @IsNotEmpty({ message: 'Vui lòng xác nhận lại mật khẩu' })
  @IsString()
  @MinLength(6, { message: 'Mật khẩu xác nhận phải có ít nhất 6 ký tự' })
  @MaxLength(50, { message: 'Mật khẩu xác nhận không được vượt quá 50 ký tự' })
  confirmPassword!: string;
}
