import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { Brand } from '../entities/brand.entity';
import { Category } from '../entities/category.entity';
import { DiscountDetail } from '../entities/discount-detail.entity';
import { Image } from '../entities/image.entity';
import { Comment } from '../entities/comment.entity';
import { LineItem } from '../entities/line-item.entity';
import { SerialProduct } from './serialProduct.entity';
import { CartItem } from './cart-item.entity';

export enum EProductStatus {
  ACTIVE = 'ACTIVE',
  OUT_OF_STOCK = 'OUT_OF_STOCK',
}

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  productName: string;

  @Column({ type: 'longtext', nullable: true })
  description: string;

  @Column()
  displayStatus: boolean;

  @Column()
  ratingAvg: number;

  @Column()
  originalPrice: number;

  @Column()
  unitPrice: number;

  @Column({ type: 'enum', enum: EProductStatus })
  productStatus: EProductStatus;

  @ManyToOne(() => Brand, (brand) => brand.products)
  brand: Brand;

  @ManyToOne(() => DiscountDetail)
  discountDetail: DiscountDetail;

  @ManyToOne(() => Category, (category) => category.products)
  category: Category;

  @OneToMany(() => Image, (image) => image.product, { cascade: true })
  images: Image[];

  @OneToMany(() => Comment, (comment) => comment.product)
  comments: Comment[];

  @OneToMany(() => LineItem, (lineItem) => lineItem.product)
  lineItems: LineItem[];

  @OneToMany(() => CartItem, (cartItem) => cartItem.product)
  cartItems: CartItem[];

  @OneToMany(() => SerialProduct, (serial) => serial.product)
  serialProducts: SerialProduct[];
}
