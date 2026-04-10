import { Module } from '@nestjs/common';
import { AlexaController } from './alexa.controller';
import { AlexaService } from './alexa.service';
import { ShoppingListModule } from 'src/shopping-list/shopping-list.module';
import { UserModule } from 'src/user/user.module';
import { CommonModule } from 'src/common/common.module';

@Module({
  imports: [ShoppingListModule, UserModule, CommonModule],
  controllers: [AlexaController],
  providers: [AlexaService],
})
export class AlexaModule {}
