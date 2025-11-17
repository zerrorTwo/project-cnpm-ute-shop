import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum EPaymentStatus {
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
}

export enum EPaymentCurrency {
  VND = 'VND',
  USD = 'USD',
}

export enum EPaymentMethod {
  CASH = 'CASH',
  CARD = 'CARD',
  BANKING = 'BANKING',
}

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'enum', enum: EPaymentStatus })
  paymentStatus: EPaymentStatus;

  @Column({ type: 'enum', enum: EPaymentCurrency })
  currency: EPaymentCurrency;

  @Column({ type: 'enum', enum: EPaymentMethod })
  paymentMethod: EPaymentMethod;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
