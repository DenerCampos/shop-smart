import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from 'src/auth/auth.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { ResponseService } from 'src/common/response/response';
import { User } from 'src/user/entities/user.entity';
import { MissionClaimResponseDto } from './dto/mission-claim-response.dto';
import { MissionWithProgressResponseDto } from './dto/mission-response.dto';
import { MissionService } from './mission.service';

@UseGuards(AuthGuard)
@Controller('missions')
export class MissionController {
  constructor(
    private readonly missionService: MissionService,
    private readonly responseService: ResponseService,
  ) {}

  @Get()
  async getMissions(
    @CurrentUser() user: User,
  ): Promise<MissionWithProgressResponseDto[]> {
    const items = await this.missionService.getMissionsWithProgress(user);

    return this.responseService.mapArrayToDto(
      MissionWithProgressResponseDto,
      items,
    );
  }

  @Post(':progressId/claim')
  @HttpCode(HttpStatus.OK)
  async claimReward(
    @Param('progressId') progressId: string,
    @CurrentUser() user: User,
  ): Promise<MissionClaimResponseDto> {
    await this.missionService.claimReward(user, progressId);

    return this.responseService.mapToDto(MissionClaimResponseDto, {
      success: true,
    });
  }
}
