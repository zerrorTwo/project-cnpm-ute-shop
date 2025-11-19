import { UserRepository } from './user.repository';
import { ProductRepository } from './product.repository';
import { BillRepository } from './bill.repository';

const Repositories = [UserRepository, ProductRepository, BillRepository];

export { UserRepository, ProductRepository, BillRepository };
export default Repositories;
