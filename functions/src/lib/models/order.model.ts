export interface OrderItem {
    vendorId: string;
    productId: string;
    quantity: number;
    price: number;
}

export interface Order {
    id?: string;
    clientId: string;
    orderItems: OrderItem[];
    totalPrice: number;
    status: string;
    orderDate: Date | null;
    paidAt?: Date | null;
    redeemedAt?: Date | null;
    collectedAt?: Date | null;
  }