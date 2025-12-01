// src/repositories/index.ts

import { UserRepository } from './user.repository';
import { ProductRepository } from './product.repository';
import { BillRepository } from './bill.repository';
import { BrandRepository } from './brand.repository'; 
import { CategoryRepository } from './category.repository'; 
import { ImageRepository } from './image.repository'; 
import { ConfigurationRepository } from './configuration.repository'; 
import { DetailConfigurationRepository } from './detail-configuration.repository';
import { CartRepository } from './cart.repository'; 

const Repositories = [
  UserRepository,
  ProductRepository,
  BillRepository,
  BrandRepository,
  CategoryRepository,
  ImageRepository,
  ConfigurationRepository,
  DetailConfigurationRepository,
  CartRepository,
];

export {
  UserRepository,
  ProductRepository,
  BillRepository,
  BrandRepository,
  CategoryRepository,
  ImageRepository,
  ConfigurationRepository,
  DetailConfigurationRepository,
  CartRepository,
};

export default Repositories;
