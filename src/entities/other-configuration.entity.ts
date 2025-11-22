import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Configuration } from '../entities/configuration.entity';

@Entity('other_configurations')
export class DetailConfiguration {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  value: string;

  @ManyToOne(() => Configuration, (config) => config.otherConfigs, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'configuration_id' })
  configuration: Configuration;
}
