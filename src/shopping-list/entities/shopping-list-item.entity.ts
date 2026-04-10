import { Group } from 'src/group/entities/group.entity';
import { User } from 'src/user/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  UpdateDateColumn,
} from 'typeorm';
import { ShoppingList } from './shopping-list.entity';
import { ShoppingListItemStatus } from '../types/shopping-list-item-status.type';
import { ShoppingListItemUnit } from '../types/shopping-list-item-unit.type';

@Entity()
export class ShoppingListItem {
  @Column({
    type: 'varchar',
    length: 36,
    primary: true,
    generated: 'uuid',
  })
  id: string;

  @Column()
  name: string;

  @Column({ type: 'float', default: 1 })
  quantity: number;

  @Column({
    type: 'enum',
    enum: ['un', 'kg', 'g', 'l', 'ml', 'pack', 'dz'],
    default: 'un',
  })
  unit: ShoppingListItemUnit;

  @Column({
    type: 'enum',
    enum: ['pending', 'in_cart'],
    default: 'pending',
  })
  status: ShoppingListItemStatus;

  @ManyToOne(() => ShoppingList, (list) => list.items)
  @JoinColumn({ name: 'shoppingListId' })
  shoppingList: ShoppingList;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'addedById' })
  addedBy: User;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'checkedById' })
  checkedBy: User;

  @ManyToOne(() => Group, { nullable: true })
  @JoinColumn({ name: 'groupId' })
  group: Group;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
