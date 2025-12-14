import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Product } from '../entities/product.entity';
import { LineItem } from '../entities/line-item.entity';

@Entity('serial_products')
export class SerialProduct {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'boolean', default: true })
  active: boolean;

  @Column()
  serial: string;

  @ManyToOne(() => Product, (product) => product.serialProducts)
  product: Product;

  @ManyToOne(() => LineItem, (lineItem) => lineItem.serialProducts)
  lineItem: LineItem;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
