export interface DiscountRate {
  rate: number;
  label: string;
  isActive: boolean;
}
export interface DiscountSettings {
  isActive: boolean;
  startDate: Date;
  endDate: Date;
  discountRates: DiscountRate[];
  customRate: number;
  minOrderAmount: number;
  allowDuplicateDiscount: boolean;
  allowPointAccumulation: boolean;
  createdAt: Date;
  updatedAt: Date;
}
