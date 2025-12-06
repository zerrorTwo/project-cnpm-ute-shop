import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';

export enum EVoucherType {
  PERCENTAGE = 'PERCENTAGE',
  FIXED = 'FIXED',
}

export enum EVoucherStatus {
  ACTIVE = 'ACTIVE',
  USED = 'USED',
  EXPIRED = 'EXPIRED',
}

@Entity('vouchers')
export class Voucher {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  code: string;

  @Column({ type: 'enum', enum: EVoucherType })
  type: EVoucherType;

  @Column({ type: 'double' })
  value: number; // Giá trị giảm (% hoặc số tiền)

  @Column({ type: 'double', nullable: true })
  maxDiscount: number; // Giảm tối đa (cho voucher %)

  @Column({ type: 'double', default: 0 })
  minOrderValue: number; // Giá trị đơn hàng tối thiểu

  @Column({
    type: 'enum',
    enum: EVoucherStatus,
    default: EVoucherStatus.ACTIVE,
  })
  status: EVoucherStatus;

  @Column({ type: 'datetime' })
  expiryDate: Date;

  @Column({ type: 'text', nullable: true })
  description: string;

  @ManyToOne(() => User, (user) => user.vouchers)
  user: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
