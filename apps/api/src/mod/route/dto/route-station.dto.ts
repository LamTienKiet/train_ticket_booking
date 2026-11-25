import { IsInt, IsNotEmpty, IsUUID, Min } from 'class-validator';

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
}
