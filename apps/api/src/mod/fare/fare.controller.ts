import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { FareService } from './fare.service';
import { CreateFareDto } from './dto/create-fare.dto';
import { UpdateFareDto } from './dto/update-fare.dto';
import { QueryFareDto } from './dto/query-fare.dto';
import { PassengerFareItemDto } from './dto/passenger-fare.dto';
import { PassengerType, Role } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';

@Roles(Role.ADMIN)
@Controller(['fares', 'fare'])
export class FareController {
  constructor(private readonly fareService: FareService) {}

  @Post()
  create(@Body() createFareDto: CreateFareDto) {
    return this.fareService.create(createFareDto);
  }

  @Get()
  findAll(@Query() query: QueryFareDto) {
    return this.fareService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.fareService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateFareDto: UpdateFareDto) {
    return this.fareService.update(id, updateFareDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.fareService.remove(id);
  }

  @Post(':id/passenger-fares')
  upsertPassengerFare(
    @Param('id') fareRuleId: string,
    @Body() dto: PassengerFareItemDto,
  ) {
    return this.fareService.upsertPassengerFare(fareRuleId, dto);
  }

  @Delete(':id/passenger-fares/:passengerType')
  removePassengerFare(
    @Param('id') fareRuleId: string,
    @Param('passengerType') passengerType: PassengerType,
  ) {
    return this.fareService.removePassengerFare(fareRuleId, passengerType);
  }
}
