import { PostgresBaseRepository } from './PostgresBaseRepository';
import { IProduct, IR_products } from './IR_products';

export class R_products extends PostgresBaseRepository<IProduct> implements IR_products {
  constructor() {
    super('products');
  }
}
