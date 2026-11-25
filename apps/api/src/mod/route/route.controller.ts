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
import { RouteService } from './route.service';
import { CreateRouteDto } from './dto/create-route.dto';
import { UpdateRouteDto } from './dto/update-route.dto';
import { QueryRouteDto } from './dto/query-route.dto';
import { RouteStationItemDto } from './dto/route-station.dto';
import { Role } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';

@Roles(Role.ADMIN)
@Controller(['routes', 'route'])
export class RouteController {
  constructor(private readonly routeService: RouteService) {}

  @Post()
  create(@Body() createRouteDto: CreateRouteDto) {
    return this.routeService.create(createRouteDto);
  }

  @Get()
  findAll(@Query() query: QueryRouteDto) {
    return this.routeService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.routeService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateRouteDto: UpdateRouteDto) {
    return this.routeService.update(id, updateRouteDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.routeService.remove(id);
  }

  @Post(':id/stations')
  addStation(
    @Param('id') routeId: string,
    @Body() dto: RouteStationItemDto,
  ) {
    return this.routeService.addStation(routeId, dto);
  }

  @Delete(':id/stations/:stationId')
  removeStation(
    @Param('id') routeId: string,
    @Param('stationId') stationId: string,
  ) {
    return this.routeService.removeStation(routeId, stationId);
  }
}
