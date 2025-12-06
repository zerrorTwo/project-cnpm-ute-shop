import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { User } from './user.entity';

export enum EPointTransactionType {
  EARN = 'EARN', // Tích điểm
  REDEEM = 'REDEEM', // Đổi điểm
  EXPIRED = 'EXPIRED', // Hết hạn
}

@Entity('loyalty_points')
export class LoyaltyPoint {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  points: number;

  @Column({ type: 'enum', enum: EPointTransactionType })
  transactionType: EPointTransactionType;

  @Column({ type: 'text', nullable: true })
  description: string;

  @ManyToOne(() => User, (user) => user.loyaltyPoints)
  user: User;

  @CreateDateColumn()
  createdAt: Date;
}
