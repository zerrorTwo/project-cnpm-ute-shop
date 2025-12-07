import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { Product } from '../entities/product.entity';
import { User } from '../entities/user.entity';
import { Bill } from '../entities/bill.entity';

@Entity('comments')
export class Comment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'int', nullable: true })
  rating: number;

  @Column({ type: 'boolean', default: true })
  active: boolean;

  @Column({ type: 'boolean', default: false })
  hasRewardGiven: boolean; // Đã tặng thưởng chưa

  // Many comments -> one product
  @ManyToOne(() => Product, (product) => product.comments)
  product: Product;

  // Many comments -> one customer
  @ManyToOne(() => User, (user) => user.comments)
  customer: User;

  // Many comments -> one bill (chỉ đánh giá sản phẩm đã mua)
  @ManyToOne(() => Bill, { nullable: true })
  @JoinColumn({ name: 'bill_id' })
  bill: Bill;

  // Nested comments - replies
  @ManyToOne(() => Comment, (comment) => comment.replies, { nullable: true })
  @JoinColumn({ name: 'parent_id' })
  parent: Comment;

  @OneToMany(() => Comment, (comment) => comment.parent)
  replies: Comment[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
