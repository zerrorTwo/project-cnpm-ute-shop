import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Product } from '../entities/product.entity';

@Entity('discount_details')
export class DiscountDetail {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'double', default: 0 })
  percentage: number;

  // One discount -> many products
  @OneToMany(() => Product, (product) => product.discountDetail, {
    cascade: true,
  })
  products: Product[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
