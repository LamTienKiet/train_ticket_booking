import { Role } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
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
import { TrainService } from './train.service';
import { CreateTrainDto } from './dto/create-train.dto';
import { UpdateTrainDto } from './dto/update-train.dto';
import { QueryTrainDto } from './dto/query-train.dto';

@Controller('trains')
export class TrainController {
  constructor(private readonly trainService: TrainService) {}

  @Roles(Role.ADMIN)

  @Post()
  create(@Body() createTrainDto: CreateTrainDto) {
    return this.trainService.create(createTrainDto);
  }

  @Get()
  findAll(@Query() query: QueryTrainDto) {
    return this.trainService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.trainService.findOne(id);
  }

  @Roles(Role.ADMIN)

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTrainDto: UpdateTrainDto) {
    return this.trainService.update(id, updateTrainDto);
  }

  @Roles(Role.ADMIN)

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.trainService.remove(id);
  }
}
