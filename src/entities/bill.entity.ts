import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../entities/user.entity';
import { Payment } from '../entities/payment.entity';
import { LineItem } from '../entities/line-item.entity';

export enum EBillStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED',
}

export enum EPaymentMethod {
  CASH = 'CASH',
  CARD = 'CARD',
  BANKING = 'BANKING',
}

@Entity('bills')
export class Bill {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  total: number;

  @Column()
  discount: number;

  @Column({ type: 'enum', enum: EPaymentMethod })
  paymentMethod: EPaymentMethod;

  @Column({ type: 'enum', enum: EBillStatus })
  status: EBillStatus;

  @Column()
  billCode: number;

  @Column()
  orderId: number;

  @ManyToOne(() => User, (user) => user.bills, { nullable: false })
  @JoinColumn({ name: 'user_id' })
  customer: User;

  @OneToOne(() => Payment)
  @JoinColumn({ name: 'payment_id' })
  payment: Payment;

  @OneToMany(() => LineItem, (item) => item.bill, { cascade: true })
  items: LineItem[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
