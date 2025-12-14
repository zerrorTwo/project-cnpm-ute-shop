import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

export enum ENotificationType {
  ORDER = 'ORDER',
  COMMENT = 'COMMENT',
  EVENT = 'EVENT',
  REVIEW = 'REVIEW',
}

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'recipient_id' })
  recipient: User;

  @Column({ type: 'enum', enum: ENotificationType })
  type: ENotificationType;

  @Column({ type: 'boolean', default: false })
  isRead: boolean;

  @Column({ type: 'varchar', length: 512, nullable: true })
  url: string;

  @CreateDateColumn()
  createdAt: Date;
}
