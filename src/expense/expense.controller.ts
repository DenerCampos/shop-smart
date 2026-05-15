import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from 'src/auth/auth.guard';
import { ExpenseService } from './expense.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { User } from 'src/user/entities/user.entity';
import { ExpenseResponseDto } from './dto/expense-response.dto';
import { ResponseService } from 'src/common/response/response';
import { ExpenseListDto } from './dto/expense-list.dto';
import { paginationData } from 'src/common/pagination/pagination';
import { ValueExpenseCurrentResponseDto } from './dto/value-expense-current-response.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { ItemResponseDto } from './dto/item-response.dto';
import { ExpenseRecurringConfirmDto } from './dto/expense-recurring-confirm.dto';
import { AnalyzeExpenseAudioResponseDto } from './dto/analyze-expense-audio-response.dto';
import { AnalyzeExpenseImageResponseDto } from './dto/analyze-expense-image-response.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { AudioRecognitionService } from 'src/audio-recognition/audioRecognition.service';
import { ImageRecognitionService } from 'src/image-recognition/imageRecognition.service';

@Controller('/expense')
export class ExpenseController {
  constructor(
    private readonly expenseService: ExpenseService,
    private readonly responseService: ResponseService,
    private readonly audioRecognitionService: AudioRecognitionService,
    private readonly imageRecognitionService: ImageRecognitionService,
  ) {}

  @UseGuards(AuthGuard)
  @Post()
  async create(
    @CurrentUser() user: User,
    @Body() createExpenseDto: CreateExpenseDto,
  ): Promise<ExpenseResponseDto> {
    const createExpense = await this.expenseService.create(
      user,
      createExpenseDto,
    );

    return this.responseService.mapToDto(ExpenseResponseDto, createExpense);
  }

  @UseGuards(AuthGuard)
  @Get()
  async findAll(
    @Query() listDto: ExpenseListDto,
    @CurrentUser() user: User,
  ): Promise<paginationData<ExpenseResponseDto>> {
    const expenses = await this.expenseService.findAll(listDto, user);

    return this.responseService.mapPaginatedToDto(ExpenseResponseDto, expenses);
  }

  @UseGuards(AuthGuard)
  @Get('/current-month')
  async getAllByCurrentMonth(
    @CurrentUser() user: User,
  ): Promise<ExpenseResponseDto[] | []> {
    const expenses = await this.expenseService.getAllByCurrentMonth(user);

    return this.responseService.mapArrayToDto(ExpenseResponseDto, expenses);
  }

  @UseGuards(AuthGuard)
  @Get('/value-current-month')
  async getExpenseByCurrentMonth(
    @CurrentUser() user: User,
  ): Promise<ValueExpenseCurrentResponseDto> {
    return this.expenseService.getExpenseByCurrentMonth(user);
  }

  @UseGuards(AuthGuard)
  @Get('/recurring/current-month')
  async getRecurringExpenseByCurrentMonth(
    @CurrentUser() user: User,
  ): Promise<ExpenseResponseDto[] | []> {
    const expenses =
      await this.expenseService.getRecurringExpenseByCurrentMonth(user);

    return this.responseService.mapArrayToDto(ExpenseResponseDto, expenses);
  }

  @UseGuards(AuthGuard)
  @Post('/recurring/confirm')
  async getRecurringExpenseConfirm(
    @CurrentUser() user: User,
    @Body() expenseRecurringConfirmDto: ExpenseRecurringConfirmDto,
  ): Promise<void> {
    await this.expenseService.recurringConfirm(
      user,
      expenseRecurringConfirmDto,
    );
  }

  @UseGuards(AuthGuard)
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<ExpenseResponseDto> {
    const expense = await this.expenseService.find(id);

    return this.responseService.mapToDto(ExpenseResponseDto, expense);
  }

  @UseGuards(AuthGuard)
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateExpenseDto: UpdateExpenseDto,
    @CurrentUser() user: User,
  ): Promise<ExpenseResponseDto> {
    const expense = await this.expenseService.update(
      id,
      updateExpenseDto,
      user,
    );

    return this.responseService.mapToDto(ExpenseResponseDto, expense);
  }

  @UseGuards(AuthGuard)
  @Patch('/item/:id')
  async updateItem(
    @Param('id') id: string,
    @Body() updateItemDto: UpdateItemDto,
    @CurrentUser() user: User,
  ): Promise<ItemResponseDto> {
    const item = await this.expenseService.updateItem(id, updateItemDto, user);

    return this.responseService.mapToDto(ItemResponseDto, item);
  }

  @UseGuards(AuthGuard)
  @Delete(':id')
  async remove(@Param('id') id: string): Promise<object> {
    const deleted = await this.expenseService.delete(id);

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
  ): Promise<AnalyzeExpenseAudioResponseDto> {
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
      'expense', // Passa o contexto de receita
    );

    return this.responseService.mapToDto(
      AnalyzeExpenseAudioResponseDto,
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
  ): Promise<AnalyzeExpenseImageResponseDto> {
    if (!image) {
      throw new BadRequestException('Imagem não fornecida');
    }

    // Chama o serviço de reconhecimento de imagem com contexto de receita
    const result = await this.imageRecognitionService.analyzeImage(
      image.buffer,
      user,
      'expense', // Passa o contexto de receita
    );

    return this.responseService.mapToDto(
      AnalyzeExpenseImageResponseDto,
      result,
    );
  }
}
