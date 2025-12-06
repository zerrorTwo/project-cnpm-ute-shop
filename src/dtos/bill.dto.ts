import { EBillStatus, EPaymentMethod } from '../entities/bill.entity';

export class OrderItemDto {
  id: number;
  quantity: number;
  unitPrice: number;
  product: {
    id: number;
    productName: string;
    slug: string;
    images: string[];
  };
}

export class OrderDto {
  id: number;
  total: number;
  discount: number;
  paymentMethod: EPaymentMethod;
  status: EBillStatus;
  billCode: number;
  orderId: number;
  receiverName: string;
  receiverPhone: string;
  shippingAddress: string;
  note: string;
  createdAt: Date;
  items: OrderItemDto[];
}
