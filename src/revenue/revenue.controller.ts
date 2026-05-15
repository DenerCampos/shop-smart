import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { AuthGuard } from 'src/auth/auth.guard';
import { RevenueService } from './revenue.service';
import { CreateRevenueDto } from './dto/create-revenue.dto';
import { UpdateRevenueDto } from './dto/update-revenue.dto';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { GetValueRevenueCurrentDto } from './dto/get-value-revenue-current.dto';
import { ResponseService } from 'src/common/response/response';
import { User } from 'src/user/entities/user.entity';
import { RevenueResponseDto } from './dto/revenue-response.dto';
import { RevenueListDto } from './dto/revenue-list.dto';
import { paginationData } from 'src/common/pagination/pagination';
import { RevenueRecurringConfirmDto } from './dto/revenue-recurring-confirm.dto';
import { RevenueRecurringDto } from './dto/revenue-recurring.dto';
import { AudioRecognitionService } from 'src/audio-recognition/audioRecognition.service';
import { ImageRecognitionService } from 'src/image-recognition/imageRecognition.service';
import { AnalyzeRevenueAudioResponseDto } from './dto/analyze-revenue-audio-response.dto';
import { AnalyzeRevenueImageResponseDto } from './dto/analyze-revenue-image-response.dto';

@Controller('/revenue')
export class RevenueController {
  constructor(
    private readonly revenueService: RevenueService,
    private readonly responseService: ResponseService,
    private readonly audioRecognitionService: AudioRecognitionService,
    private readonly imageRecognitionService: ImageRecognitionService,
  ) {}

  @UseGuards(AuthGuard)
  @Post()
  async create(
    @CurrentUser() user: User,
    @Body() createStoreDto: CreateRevenueDto,
  ): Promise<RevenueResponseDto> {
    const createRevenue = await this.revenueService.create(
      user,
      createStoreDto,
    );

    return this.responseService.mapToDto(RevenueResponseDto, createRevenue);
  }

  @UseGuards(AuthGuard)
  @Get()
  async findAll(
    @Query() listDto: RevenueListDto,
    @CurrentUser() user: User,
  ): Promise<paginationData<RevenueResponseDto>> {
    const revenues = await this.revenueService.findAll(listDto, user);

    return this.responseService.mapPaginatedToDto(RevenueResponseDto, revenues);
  }

  @UseGuards(AuthGuard)
  @Get('/recurring/current-month')
  async getRecurringRevenueByCurrentMonth(
    @CurrentUser() user: User,
  ): Promise<RevenueRecurringDto[] | []> {
    const revenues =
      await this.revenueService.getRecurringRevenueByCurrentMonth(user);

    return this.responseService.mapArrayToDto(RevenueRecurringDto, revenues);
  }

  @UseGuards(AuthGuard)
  @Post('/recurring/confirm')
  async getRecurringRevenueConfirm(
    @CurrentUser() user: User,
    @Body() revenueRecurringConfirmDto: RevenueRecurringConfirmDto,
  ): Promise<void> {
    await this.revenueService.recurringConfirm(
      user,
      revenueRecurringConfirmDto,
    );
  }

  @UseGuards(AuthGuard)
  @Get('/current-month')
  async getAllByCurrentMonth(
    @CurrentUser() user: User,
  ): Promise<RevenueResponseDto[] | []> {
    const revenues = await this.revenueService.getAllByCurrentMonth(user);

    return this.responseService.mapArrayToDto(RevenueResponseDto, revenues);
  }

  @UseGuards(AuthGuard)
  @Get('/value-current-month')
  async getRevenueByCurrentMonth(
    @CurrentUser() user: User,
  ): Promise<GetValueRevenueCurrentDto> {
    return this.revenueService.getRevenueByCurrentMonth(user);
  }

  @UseGuards(AuthGuard)
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<RevenueResponseDto> {
    const revenue = await this.revenueService.find(id);

    return this.responseService.mapToDto(RevenueResponseDto, revenue);
  }

  @UseGuards(AuthGuard)
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateStoreDto: UpdateRevenueDto,
  ): Promise<RevenueResponseDto> {
    const revenue = await this.revenueService.update(id, updateStoreDto);

    return this.responseService.mapToDto(RevenueResponseDto, revenue);
  }

  @UseGuards(AuthGuard)
  @Delete(':id')
  async remove(@Param('id') id: string): Promise<object> {
    const deleted = await this.revenueService.delete(id);

    return { deleted };
  }

  @UseGuards(AuthGuard)
  @Post('analyze-audio')
  @UseInterceptors(
    FileInterceptor('audio', {
      storage: memoryStorage(),
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB - suficiente para ~2min de áudio
        files: 1,
      },
      fileFilter: (req, file, callback) => {
        // Valida o tipo do arquivo (aceita MIME types com parâmetros, ex: audio/webm;codecs=opus)
        // Nota: video/webm também é aceito pois alguns navegadores gravam áudio como video/webm
        const audioRegex =
          /^(audio|video)\/(webm|mp3|wav|mpeg|ogg|mp4|x-m4a|aac|flac|x-wav)/i;
        const mimeTypeBase = file.mimetype.split(';')[0].trim(); // Remove parâmetros como ;codecs=opus

        if (!audioRegex.test(mimeTypeBase)) {
          return callback(
            new BadRequestException(
              `Tipo de arquivo não suportado: ${file.mimetype}. Envie um arquivo de áudio válido.`,
            ),
            false,
          );
        }
        callback(null, true);
      },
    }),
  )
  async analyzeAudio(
    @UploadedFile() audio: Express.Multer.File,
    @CurrentUser() user: User,
  ): Promise<AnalyzeRevenueAudioResponseDto> {
    if (!audio) {
      throw new BadRequestException('Áudio não fornecido');
    }

    if (!audio.buffer || audio.buffer.length === 0) {
      throw new BadRequestException('Buffer de áudio vazio');
    }

    if (audio.size < 1024) {
      throw new BadRequestException('Áudio muito curto (menos de 1KB)');
    }

    if (!Buffer.isBuffer(audio.buffer)) {
      throw new BadRequestException('Buffer inválido');
    }

    // Chama o serviço de reconhecimento de áudio com contexto de receita
    const result = await this.audioRecognitionService.analyzeAudio(
      audio.buffer,
      audio.mimetype,
      user,
      'revenue', // Passa o contexto de receita
    );

    return this.responseService.mapToDto(
      AnalyzeRevenueAudioResponseDto,
      result,
    );
  }

  @UseGuards(AuthGuard)
  @Post('analyze-image')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: memoryStorage(),
      limits: {
        fileSize: 1.5 * 1024 * 1024,
        files: 1, // Aceita apenas 1 arquivo
      },
      fileFilter: (req, file, callback) => {
        // Valida o tipo do arquivo
        const imageRegex = /^image\/(jpg|jpeg|png|gif)$/;
        if (!imageRegex.exec(file.mimetype)) {
          return callback(
            new BadRequestException('Apenas imagens são permitidas'),
            false,
          );
        }
        callback(null, true);
      },
    }),
  )
  async analyzeImage(
    @UploadedFile() image: Express.Multer.File,
    @CurrentUser() user: User,
  ): Promise<AnalyzeRevenueImageResponseDto> {
    if (!image) {
      throw new BadRequestException('Imagem não fornecida');
    }

    // Chama o serviço de reconhecimento de imagem com contexto de receita
    const result = await this.imageRecognitionService.analyzeImage(
      image.buffer,
      user,
      'revenue', // Passa o contexto de receita
    );

    return this.responseService.mapToDto(
      AnalyzeRevenueImageResponseDto,
      result,
    );
  }
}
