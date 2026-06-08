import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { AuthGuard } from 'src/auth/auth.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { ResponseService } from 'src/common/response/response';
import { User } from 'src/user/entities/user.entity';
import { ChoreService } from './chore.service';
import { CreateChoreDefinitionDto } from './dto/create-chore-definition.dto';
import { UpdateChoreDefinitionDto } from './dto/update-chore-definition.dto';
import { ChoreDefinitionFilterDto } from './dto/chore-definition-filter.dto';
import { ChoreOccurrenceQueryDto } from './dto/chore-occurrence-query.dto';
import { ChoreHistoryQueryDto } from './dto/chore-history-query.dto';
import { ChoreRejectDto } from './dto/chore-reject.dto';
import { ChoreSettlePayrollDto } from './dto/chore-settle-payroll.dto';
import { ChorePayrollPendingQueryDto } from './dto/chore-payroll-pending-query.dto';
import { ChoreDefinitionResponseDto } from './dto/chore-definition-response.dto';
import { ChoreOccurrenceResponseDto } from './dto/chore-occurrence-response.dto';
import {
  ChorePayrollPendingMemberDto,
  ChorePayrollPendingResponseDto,
} from './dto/chore-payroll-line-response.dto';
import { ChorePayrollSuggestionResponseDto } from './dto/chore-payroll-suggestion-response.dto';
import {
  ChorePayrollSettlementDetailDto,
  ChorePayrollSettlementLineDto,
} from './dto/chore-payroll-settlement-response.dto';
import { FamilyGroupService } from 'src/family-group/family-group.service';
import { UserService } from 'src/user/user.service';
import { paginationData } from 'src/common/pagination/pagination';
import { OwnerResponseDto } from 'src/common/dto/owner-response.dto';
import { ChorePendingCoinRewardDto } from './dto/chore-pending-coin-reward.dto';

@Controller('family-groups/:familyGroupId/chores')
export class ChoreController {
  constructor(
    private readonly choreService: ChoreService,
    private readonly responseService: ResponseService,
    private readonly familyGroupService: FamilyGroupService,
    private readonly userService: UserService,
  ) {}

  @Post('definitions')
  @UseGuards(AuthGuard)
  async createDefinition(
    @Param('familyGroupId') familyGroupId: string,
    @Body() dto: CreateChoreDefinitionDto,
    @CurrentUser() user: User,
  ): Promise<ChoreDefinitionResponseDto> {
    const def = await this.choreService.createDefinition(
      familyGroupId,
      user,
      dto,
    );
    return this.responseService.mapToDto(ChoreDefinitionResponseDto, def);
  }

  @Get('definitions')
  @UseGuards(AuthGuard)
  async listDefinitions(
    @Param('familyGroupId') familyGroupId: string,
    @Query() query: ChoreDefinitionFilterDto,
    @CurrentUser() user: User,
  ): Promise<paginationData<ChoreDefinitionResponseDto>> {
    const data = await this.choreService.listDefinitions(
      familyGroupId,
      user,
      query,
    );

    return this.responseService.mapPaginatedToDto(
      ChoreDefinitionResponseDto,
      data,
    );
  }

  @Patch('definitions/:definitionId')
  @UseGuards(AuthGuard)
  async updateDefinition(
    @Param('familyGroupId') familyGroupId: string,
    @Param('definitionId') definitionId: string,
    @Body() dto: UpdateChoreDefinitionDto,
    @CurrentUser() user: User,
  ): Promise<ChoreDefinitionResponseDto> {
    const def = await this.choreService.updateDefinition(
      familyGroupId,
      user,
      definitionId,
      dto,
    );
    return this.responseService.mapToDto(ChoreDefinitionResponseDto, def);
  }

  @Delete('definitions/:definitionId')
  @UseGuards(AuthGuard)
  async deleteDefinition(
    @Param('familyGroupId') familyGroupId: string,
    @Param('definitionId') definitionId: string,
    @CurrentUser() user: User,
  ): Promise<{ deleted: boolean }> {
    await this.choreService.deleteDefinition(familyGroupId, user, definitionId);
    return { deleted: true };
  }

  @Get('occurrences/pending-approval')
  @UseGuards(AuthGuard)
  async pendingApproval(
    @Param('familyGroupId') familyGroupId: string,
    @Query() query: ChoreOccurrenceQueryDto,
    @CurrentUser() user: User,
  ): Promise<paginationData<ChoreOccurrenceResponseDto>> {
    const data = await this.choreService.listPendingApproval(
      familyGroupId,
      user,
      query,
    );
    return this.responseService.mapPaginatedToDto(
      ChoreOccurrenceResponseDto,
      data,
    );
  }

  @Get('occurrences/mine')
  @UseGuards(AuthGuard)
  async occurrencesMine(
    @Param('familyGroupId') familyGroupId: string,
    @Query() query: ChoreOccurrenceQueryDto,
    @CurrentUser() user: User,
  ): Promise<paginationData<ChoreOccurrenceResponseDto>> {
    const data = await this.choreService.listMine(familyGroupId, user, query);
    return this.responseService.mapPaginatedToDto(
      ChoreOccurrenceResponseDto,
      data,
    );
  }

  @Get('occurrences/history')
  @UseGuards(AuthGuard)
  async occurrencesHistory(
    @Param('familyGroupId') familyGroupId: string,
    @Query() query: ChoreHistoryQueryDto,
    @CurrentUser() user: User,
  ): Promise<paginationData<ChoreOccurrenceResponseDto>> {
    const admin = await this.familyGroupService.isAcceptedAdmin(
      familyGroupId,
      user.id,
    );
    const data = await this.choreService.listHistory(
      familyGroupId,
      user,
      query,
      admin,
    );
    return this.responseService.mapPaginatedToDto(
      ChoreOccurrenceResponseDto,
      data,
    );
  }

  @Get('occurrences')
  @UseGuards(AuthGuard)
  async listOccurrences(
    @Param('familyGroupId') familyGroupId: string,
    @Query() query: ChoreOccurrenceQueryDto,
    @CurrentUser() user: User,
  ): Promise<paginationData<ChoreOccurrenceResponseDto>> {
    const data = await this.choreService.listOccurrences(
      familyGroupId,
      user,
      query,
    );

    return this.responseService.mapPaginatedToDto(
      ChoreOccurrenceResponseDto,
      data,
    );
  }

  @Patch('occurrences/:occurrenceId/start')
  @UseGuards(AuthGuard)
  async start(
    @Param('familyGroupId') familyGroupId: string,
    @Param('occurrenceId') occurrenceId: string,
    @CurrentUser() user: User,
  ): Promise<ChoreOccurrenceResponseDto> {
    const occ = await this.choreService.startOccurrence(
      familyGroupId,
      user,
      occurrenceId,
    );
    return this.responseService.mapToDto(ChoreOccurrenceResponseDto, occ);
  }

  @Post('occurrences/:occurrenceId/photos')
  @UseGuards(AuthGuard)
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'before', maxCount: 1 },
        { name: 'after', maxCount: 1 },
      ],
      {
        storage: memoryStorage(),
        limits: {
          fileSize: 1.5 * 1024 * 1024,
          files: 2,
        },
      },
    ),
  )
  async uploadPhotos(
    @Param('familyGroupId') familyGroupId: string,
    @Param('occurrenceId') occurrenceId: string,
    @CurrentUser() user: User,
    @UploadedFiles()
    files?: {
      before?: Express.Multer.File[];
      after?: Express.Multer.File[];
    },
  ): Promise<ChoreOccurrenceResponseDto> {
    const before = files?.before?.[0];
    const after = files?.after?.[0];

    const occ = await this.choreService.uploadPhotos(
      familyGroupId,
      user,
      occurrenceId,
      before,
      after,
    );
    return this.responseService.mapToDto(ChoreOccurrenceResponseDto, occ);
  }

  @Post('occurrences/:occurrenceId/submit')
  @UseGuards(AuthGuard)
  async submit(
    @Param('familyGroupId') familyGroupId: string,
    @Param('occurrenceId') occurrenceId: string,
    @CurrentUser() user: User,
  ): Promise<ChoreOccurrenceResponseDto> {
    const occ = await this.choreService.submitOccurrence(
      familyGroupId,
      user,
      occurrenceId,
    );
    return this.responseService.mapToDto(ChoreOccurrenceResponseDto, occ);
  }

  @Post('occurrences/:occurrenceId/approve')
  @UseGuards(AuthGuard)
  async approve(
    @Param('familyGroupId') familyGroupId: string,
    @Param('occurrenceId') occurrenceId: string,
    @CurrentUser() user: User,
  ): Promise<ChoreOccurrenceResponseDto> {
    const occ = await this.choreService.approveOccurrence(
      familyGroupId,
      user,
      occurrenceId,
    );
    return this.responseService.mapToDto(ChoreOccurrenceResponseDto, occ);
  }

  @Post('occurrences/:occurrenceId/reject')
  @UseGuards(AuthGuard)
  async reject(
    @Param('familyGroupId') familyGroupId: string,
    @Param('occurrenceId') occurrenceId: string,
    @Body() dto: ChoreRejectDto,
    @CurrentUser() user: User,
  ): Promise<ChoreOccurrenceResponseDto> {
    const occ = await this.choreService.rejectOccurrence(
      familyGroupId,
      user,
      occurrenceId,
      dto.reason,
    );
    return this.responseService.mapToDto(ChoreOccurrenceResponseDto, occ);
  }

  @Get('payroll/suggestion')
  @UseGuards(AuthGuard)
  async payrollSuggestion(
    @Param('familyGroupId') familyGroupId: string,
    @CurrentUser() user: User,
  ): Promise<ChorePayrollSuggestionResponseDto> {
    const s = await this.choreService.getPayrollSuggestion(familyGroupId, user);
    return this.responseService.mapToDto(ChorePayrollSuggestionResponseDto, s);
  }

  @Get('payroll/pending')
  @UseGuards(AuthGuard)
  async payrollPending(
    @Param('familyGroupId') familyGroupId: string,
    @Query() query: ChorePayrollPendingQueryDto,
    @CurrentUser() user: User,
  ): Promise<ChorePayrollPendingResponseDto> {
    const admin = await this.familyGroupService.isAcceptedAdmin(
      familyGroupId,
      user.id,
    );
    const raw = await this.choreService.getPayrollPending(
      familyGroupId,
      user,
      query,
      admin,
    );

    const members: ChorePayrollPendingMemberDto[] = [];

    for (const line of raw.members) {
      const u = await this.userService.find(line.memberId);
      if (!u) {
        continue;
      }
      members.push(
        this.responseService.mapToDto(ChorePayrollPendingMemberDto, {
          totalPending: line.totalPending,
          member: this.responseService.mapToDto(OwnerResponseDto, u),
        }),
      );
    }

    return this.responseService.mapToDto(ChorePayrollPendingResponseDto, {
      periodYm: raw.periodYm,
      members,
    });
  }

  @Get('payroll/settlements')
  @UseGuards(AuthGuard)
  async payrollSettlementDetail(
    @Param('familyGroupId') familyGroupId: string,
    @Query() query: ChorePayrollPendingQueryDto,
    @CurrentUser() user: User,
  ): Promise<ChorePayrollSettlementDetailDto | null> {
    const ref = new Date();
    const periodYm =
      query.year != null && query.month != null
        ? query.year * 100 + query.month
        : ref.getFullYear() * 100 + (ref.getMonth() + 1);

    const settlement = await this.choreService.getPayrollSettlement(
      familyGroupId,
      user,
      periodYm,
    );

    if (!settlement) {
      return null;
    }

    const memberLines: ChorePayrollSettlementLineDto[] = [];

    for (const line of settlement.lines ?? []) {
      if (!line.member) {
        continue;
      }
      memberLines.push(
        this.responseService.mapToDto(ChorePayrollSettlementLineDto, {
          totalAmount: Number(line.amountMoney ?? 0),
          member: this.responseService.mapToDto(OwnerResponseDto, line.member),
        }),
      );
    }

    const totalSettled = memberLines.reduce(
      (sum, row) => sum + row.totalAmount,
      0,
    );

    return this.responseService.mapToDto(ChorePayrollSettlementDetailDto, {
      id: settlement.id,
      periodYm: settlement.periodYm,
      settledAt: settlement.settledAt,
      settledBy: this.responseService.mapToDto(
        OwnerResponseDto,
        settlement.settledBy,
      ),
      members: memberLines,
      totalSettled,
    });
  }

  @Post('payroll/settle')
  @UseGuards(AuthGuard)
  async payrollSettle(
    @Param('familyGroupId') familyGroupId: string,
    @Body() dto: ChoreSettlePayrollDto,
    @CurrentUser() user: User,
  ): Promise<{ id: string; periodYm: number; settledAt: Date }> {
    const settled = await this.choreService.settlePayroll(
      familyGroupId,
      user,
      dto.periodYm,
    );

    return {
      id: settled.id,
      periodYm: settled.periodYm,
      settledAt: settled.settledAt,
    };
  }

  @Get('coin-rewards/pending')
  @UseGuards(AuthGuard)
  async pendingCoinRewards(
    @Param('familyGroupId') familyGroupId: string,
    @CurrentUser() user: User,
  ): Promise<ChorePendingCoinRewardDto> {
    const totalCoins = await this.choreService.getPendingCoinRewards(
      familyGroupId,
      user,
    );

    return this.responseService.mapToDto(ChorePendingCoinRewardDto, {
      totalCoins,
    });
  }

  @Post('coin-rewards/celebrate')
  @UseGuards(AuthGuard)
  async celebrateCoinRewards(
    @Param('familyGroupId') familyGroupId: string,
    @CurrentUser() user: User,
  ): Promise<ChorePendingCoinRewardDto> {
    const totalCoins = await this.choreService.celebratePendingCoinRewards(
      familyGroupId,
      user,
    );

    return this.responseService.mapToDto(ChorePendingCoinRewardDto, {
      totalCoins,
    });
  }
}
