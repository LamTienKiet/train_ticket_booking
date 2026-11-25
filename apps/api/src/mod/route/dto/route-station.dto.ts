import { IsInt, IsNotEmpty, IsNumber, IsOptional, IsUUID, Min } from 'class-validator';

export class RouteStationItemDto {
  @IsUUID('all', { message: 'Mã nhà ga (stationId) phải là UUID hợp lệ' })
  @IsNotEmpty({ message: 'Mã nhà ga không được để trống' })
  stationId: string;

  @IsInt({ message: 'Thứ tự dừng phải là số nguyên' })
  @Min(1, { message: 'Thứ tự dừng tối thiểu là 1' })
  stopOrder: number;

  @IsInt({ message: 'Thời gian đến lệch (phút) phải là số nguyên' })
  @Min(0, { message: 'Thời gian đến lệch không âm' })
  arrivalOffsetMinutes: number;

  @IsInt({ message: 'Thời gian đi lệch (phút) phải là số nguyên' })
  @Min(0, { message: 'Thời gian đi lệch không âm' })
  departureOffsetMinutes: number;

  // Km từ ga đầu tuyến, dùng để tính giá theo chặng
  @IsOptional()
  @IsNumber({}, { message: 'Km từ ga đầu phải là số' })
  @Min(0, { message: 'Km từ ga đầu không âm' })
  distanceFromOriginKm?: number;
}
