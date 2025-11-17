import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Product } from '../entities/product.entity';
import { Bill } from '../entities/bill.entity';
import { SerialProduct } from '../entities/serialProduct.entity';

@Entity('line_items')
export class LineItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  quantity: number;

  @Column()
  unitPrice: number;

  @ManyToOne(() => Product, (product) => product.lineItems)
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @ManyToOne(() => Bill, (bill) => bill.items)
  @JoinColumn({ name: 'bill_id' })
  bill: Bill;

  @OneToMany(() => SerialProduct, (serial) => serial.lineItem)
  serialProducts: SerialProduct[];
}
