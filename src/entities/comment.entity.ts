import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Product } from '../entities/product.entity';
import { User } from '../entities/user.entity';

@Entity('comments')
export class Comment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'int' })
  rating: number;

  @Column({ type: 'boolean', default: true })
  active: boolean;

  // Many comments -> one product
  @ManyToOne(() => Product, (product) => product.comments)
  product: Product;

  // Many comments -> one customer
  @ManyToOne(() => User, (user) => user.comments)
  customer: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
