import { FamilyGroup } from 'src/family-group/entities/family-group.entity';
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

export interface RecipeIngredient {
  name: string;
  quantity: number;
  unit: string;
}

@Entity({ name: 'recipe' })
export class Recipe {
  @Column({
    type: 'varchar',
    length: 36,
    primary: true,
    generated: 'uuid',
  })
  id: string;

  @Column({ length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'json' })
  ingredients: RecipeIngredient[];

  @Column({ type: 'text' })
  instructions: string;

  @Column({ type: 'json' })
  photos: string[];

  @ManyToOne(() => FamilyGroup, { nullable: true })
  @JoinColumn({ name: 'familyGroupId' })
  familyGroup: FamilyGroup | null;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'createdById' })
  createdBy: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
