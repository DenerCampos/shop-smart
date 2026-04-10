import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommonModule } from 'src/common/common.module';
import { UserModule } from 'src/user/user.module';
import { FamilyGroupModule } from 'src/family-group/family-group.module';
import { ExpenseModule } from 'src/expense/expense.module';
import { GroupModule } from 'src/group/group.module';
import { TextRecognitionModule } from 'src/text-recognition/textRecognition.module';
import { ShoppingListController } from './shopping-list.controller';
import { ShoppingListService } from './shopping-list.service';
import { ShoppingListGateway } from './shopping-list.gateway';
import { ShoppingListRepository } from './repositories/shopping-list.repository';
import { ShoppingList } from './entities/shopping-list.entity';
import { ShoppingListItem } from './entities/shopping-list-item.entity';
import { Item } from 'src/expense/entities/item.entity';

@Module({
  imports: [
    CommonModule,
    UserModule,
    FamilyGroupModule,
    ExpenseModule,
    GroupModule,
    TextRecognitionModule,
    TypeOrmModule.forFeature([ShoppingList, ShoppingListItem, Item]),
  ],
  controllers: [ShoppingListController],
  providers: [
    ShoppingListService,
    ShoppingListGateway,
    {
      provide: 'IShoppingListRepository',
      useClass: ShoppingListRepository,
    },
  ],
  exports: [ShoppingListService],
})
export class ShoppingListModule {}
