import { FamilyGroup } from 'src/family-group/entities/family-group.entity';
import { User } from 'src/user/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  UpdateDateColumn,
} from 'typeorm';
import { ShoppingListItem } from './shopping-list-item.entity';
import { ShoppingListStatus } from '../types/shopping-list-status.type';

@Entity()
export class ShoppingList {
  @Column({
    type: 'varchar',
    length: 36,
    primary: true,
    generated: 'uuid',
  })
  id: string;

  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: ['active', 'completed', 'archived'],
    default: 'active',
  })
  status: ShoppingListStatus;

  @ManyToOne(() => FamilyGroup, { nullable: true })
  @JoinColumn({ name: 'familyGroupId' })
  familyGroup: FamilyGroup;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'createdById' })
  createdBy: User;

  @OneToMany(() => ShoppingListItem, (item) => item.shoppingList)
  items: ShoppingListItem[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
