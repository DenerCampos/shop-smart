import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommonModule } from 'src/common/common.module';
import { ExpenseModule } from 'src/expense/expense.module';
import { RevenueModule } from 'src/revenue/revenue.module';
import { ReportsModule } from 'src/reports/reports.module';
import { FamilyGroupModule } from 'src/family-group/family-group.module';
import { ShoppingListModule } from 'src/shopping-list/shopping-list.module';
import { ChoreModule } from 'src/chore/chore.module';
import { CoinModule } from 'src/coin/coin.module';
import { MissionModule } from 'src/mission/mission.module';
import { HealthModule } from 'src/health/health.module';
import { RecipeModule } from 'src/recipe/recipe.module';
import { StoreModule } from 'src/store/store.module';
import { PaymentModule } from 'src/payment/payment.module';
import { GroupModule } from 'src/group/group.module';
import { ThemeModule } from 'src/theme/theme.module';
import { ProfileModule } from 'src/profile/profile.module';
import { UserModule } from 'src/user/user.module';
import { ChatSession } from './entities/chat-session.entity';
import { ChatMessage } from './entities/chat-message.entity';
import { ChatAgentController } from './chat-agent.controller';
import { ChatAgentService } from './chat-agent.service';
import { ChatToolsService } from './tools/chat-tools.service';
import { GeminiChatProvider } from './providers/gemini-chat.provider';

@Module({
  imports: [
    CommonModule,
    UserModule,
    ExpenseModule,
    RevenueModule,
    ReportsModule,
    FamilyGroupModule,
    ShoppingListModule,
    ChoreModule,
    CoinModule,
    MissionModule,
    HealthModule,
    RecipeModule,
    StoreModule,
    PaymentModule,
    GroupModule,
    ThemeModule,
    ProfileModule,
    TypeOrmModule.forFeature([ChatSession, ChatMessage]),
  ],
  controllers: [ChatAgentController],
  providers: [ChatAgentService, ChatToolsService, GeminiChatProvider],
})
export class ChatAgentModule {}
