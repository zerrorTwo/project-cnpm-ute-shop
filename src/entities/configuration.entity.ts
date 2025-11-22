import {
  Entity,
  PrimaryGeneratedColumn,
  OneToMany,
  ManyToOne,
  Column,
} from 'typeorm';
import { DetailConfiguration } from '../entities/other-configuration.entity';
import { Product } from './product.entity';

@Entity('configurations')
export class Configuration {
  @PrimaryGeneratedColumn()
  id: number;
  @Column()
  name: string;
  @ManyToOne(() => Product, (product) => product.configurations)
  product: Product;

  @OneToMany(() => DetailConfiguration, (other) => other.configuration, {
    cascade: true,
  })
  otherConfigs: DetailConfiguration[];
}
