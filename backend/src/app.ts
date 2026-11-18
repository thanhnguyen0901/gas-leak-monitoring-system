import { CanActivate, Controller, ExecutionContext, Get, Injectable, Module, Param, Query, UnauthorizedException, UseGuards, BadRequestException } from '@nestjs/common';
import { MonitorService } from './monitor';
import { MonitorGateway } from './gateway';
import { deviceId } from './contracts';
function limitOf(raw: string | undefined) {
  if (raw === undefined) return 100;
  if (!/^\d+$/.test(raw) || Number(raw)<1 || Number(raw)>1000) throw new BadRequestException('limit must be 1–1000');
  return Number(raw);
}
function idOf(id: string) {
  if (!deviceId.safeParse(id).success) throw new BadRequestException('Invalid device ID');
  return id;
}
@Injectable()
class ReadGuard implements CanActivate {
  canActivate(ctx: ExecutionContext) {
    if (process.env.APP_TOKEN && ctx.switchToHttp().getRequest().headers.authorization !== `Bearer ${process.env.APP_TOKEN}`) throw new UnauthorizedException();
    return true;
  }
}
@Controller('api')
@UseGuards(ReadGuard)
class ApiController {
  constructor(private readonly monitor: MonitorService) {}
  @Get('health') health() { return this.monitor.health(); }
  @Get('devices') devices() { return this.monitor.getDevices(); }
  @Get('devices/:id/readings') readings(@Param('id') id: string, @Query('limit') limit?: string) { return this.monitor.getReadings(idOf(id), limitOf(limit)); }
  @Get('alerts') alerts(@Query('deviceId') id?: string, @Query('limit') limit?: string) { return this.monitor.getAlerts(id === undefined ? undefined : idOf(id), limitOf(limit)); }
}
@Module({ controllers: [ApiController], providers: [MonitorService, MonitorGateway] })
export class AppModule {}
