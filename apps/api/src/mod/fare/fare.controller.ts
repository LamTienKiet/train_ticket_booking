import { Role } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { FareService } from './fare.service';
import { CreateFareDto } from './dto/create-fare.dto';
import { UpdateFareDto } from './dto/update-fare.dto';

@Roles(Role.ADMIN) // shortcut: module còn là code mẫu, khóa toàn bộ cho ADMIN tới khi viết xong
@Controller('fare')
export class FareController {
  constructor(private readonly fareService: FareService) {}

  @Post()
  create(@Body() createFareDto: CreateFareDto) {
    return this.fareService.create(createFareDto);
  }

  @Get()
  findAll() {
    return this.fareService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.fareService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateFareDto: UpdateFareDto) {
    return this.fareService.update(+id, updateFareDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.fareService.remove(+id);
  }
}
