import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Bill } from '../entities/bill.entity';
import { Comment } from '../entities/comment.entity';
import { Cart } from '../entities/cart.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ nullable: true })
  fullName: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  avatar: string;

  @OneToMany(() => Bill, (bill) => bill.customer)
  bills: Bill[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Comment, (comment) => comment.customer)
  comments: Comment[];

  @OneToMany(() => Cart, (cart) => cart.customer)
  carts: Cart[];

}
