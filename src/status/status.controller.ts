import { Controller, Get } from '@nestjs/common';
import { ResponseService } from 'src/common/response/response';
import { StatusResponseDto } from './dto/status-response.dto';

@Controller('status')
export class StatusController {
  constructor(private readonly responseService: ResponseService) {}

  @Get()
  getStatus(): StatusResponseDto {
    return this.responseService.mapToDto(StatusResponseDto, { status: 'ok' });
  }
}
