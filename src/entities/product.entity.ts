import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Brand } from '../entities/brand.entity';
import { Category } from '../entities/category.entity';
import { Image } from '../entities/image.entity';
import { Comment } from '../entities/comment.entity';
import { LineItem } from '../entities/line-item.entity';
import { SerialProduct } from './serialProduct.entity';
import { CartItem } from './cart-item.entity';
import { Configuration } from './configuration.entity';
import { DiscountCampaign } from './discount-campaign.entity';

export enum EProductStatus {
  ACTIVE = 'ACTIVE',
  OUT_OF_STOCK = 'OUT_OF_STOCK',
  STOP_SELLING = 'STOP_SELLING',
}

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  productName: string;

  @Column({ unique: true })
  slug: string;

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

  @Column({ name: 'views' })
  views: number;

  @Column({ type: 'enum', enum: EProductStatus })
  productStatus: EProductStatus;

  @Column({ default: 0 })
  quantityStock: number;

  @Column({ default: 0 })
  productSold: number;

  @ManyToOne(() => Brand, (brand) => brand.products)
  brand: Brand;

  @ManyToOne(() => DiscountCampaign, (campaign) => campaign.products, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'discount_campaign_id' })
  discountCampaign: DiscountCampaign | null;

  @OneToMany(() => Configuration, (configuration) => configuration.product, {
    cascade: true,
  })
  configurations: Configuration[];

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

  @OneToMany(() => SerialProduct, (serial) => serial.product, { cascade: true })
  serialProducts: SerialProduct[];
  stock: number;
}
