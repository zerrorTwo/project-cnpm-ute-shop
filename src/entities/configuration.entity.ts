import { Entity, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { OtherConfiguration } from '../entities/other-configuration.entity';

@Entity('configurations')
export class Configuration {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToMany(() => OtherConfiguration, (other) => other.configuration, {
    cascade: true,
  })
  otherConfigs: OtherConfiguration[];
}
