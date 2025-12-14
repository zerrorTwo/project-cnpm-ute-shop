import { Injectable } from '@nestjs/common';
import { LineItem } from 'src/entities/line-item.entity';
import { Product } from 'src/entities/product.entity';
import { SerialProduct } from 'src/entities/serialProduct.entity';
import { DataSource, Repository } from 'typeorm';

@Injectable()
export class SerialProductRepository extends Repository<SerialProduct> {
  constructor(private dataSource: DataSource) {
    super(SerialProduct, dataSource.createEntityManager());
  }

  async createSerial(
    serial: string,
    product: Product,
    lineItem?: LineItem,
  ): Promise<SerialProduct> {
    const serialProduct = this.create({
      serial,
      product,
      lineItem,
      active: true,
    });

    return this.save(serialProduct);
  }
}
