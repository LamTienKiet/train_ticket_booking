import { IsOptional, IsString, IsDateString } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString({ message: 'Họ tên phải là chuỗi' })
  fullName?: string;

  @IsOptional()
  @IsString({ message: 'Số điện thoại phải là chuỗi' })
  phone?: string;

  @IsOptional()
  @IsDateString({}, { message: 'Ngày sinh phải có định dạng ngày (YYYY-MM-DD)' })
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
