import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { Bill } from '../entities/bill.entity';
import { Comment } from '../entities/comment.entity';
import { Cart } from '../entities/cart.entity';
import { Voucher } from '../entities/voucher.entity';
import { LoyaltyPoint } from '../entities/loyalty-point.entity';
import { UserRole } from './enums/user-role.enum';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Exclude()
  @Column()
  password: string;

  @Column({ nullable: true })
  fullName: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  avatar: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.USER })
  role: UserRole;

  @Column({ type: 'int', default: 0 })
  totalLoyaltyPoints: number; // Tổng điểm tích lũy hiện tại

  @OneToMany(() => Bill, (bill) => bill.customer)
  bills: Bill[];

  @OneToMany(() => Comment, (comment) => comment.customer)
  comments: Comment[];

  @OneToMany(() => Cart, (cart) => cart.customer)
  carts: Cart[];

  @OneToMany(() => Voucher, (voucher) => voucher.user)
  vouchers: Voucher[];

  @OneToMany(() => LoyaltyPoint, (loyaltyPoint) => loyaltyPoint.user)
  loyaltyPoints: LoyaltyPoint[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
