// ============ ENUMS ============
export enum CollarType {
  CO_CO = "CO_CO",
  CO_TRON = "CO_TRON"
}

export enum Size {
  XS = "XS", S = "S", M = "M", L = "L", XL = "XL", XXL = "XXL", XXXL = "XXXL"
}

export enum OrderStatus {
  PENDING = "PENDING",
  CONFIRMED = "CONFIRMED",
  PROCESSING = "PROCESSING",
  SHIPPING = "SHIPPING",
  DELIVERED = "DELIVERED",
  CANCELLED = "CANCELLED",
  RETURNED = "RETURNED"
}

export enum PaymentMethod {
  COD = "COD",
  VNPAY = "VNPAY",
  MOMO = "MOMO",
  STRIPE = "STRIPE",
  BANK_TRANSFER = "BANK_TRANSFER"
}

export enum PaymentStatus {
  PENDING = "PENDING",
  PAID = "PAID",
  FAILED = "FAILED",
  REFUNDED = "REFUNDED"
}

export enum Role {
  CUSTOMER = "CUSTOMER",
  ADMIN = "ADMIN",
  STAFF = "STAFF"
}

// ============ INTERFACES ============
export interface User {
  id: string;
  email: string;
  phone?: string;
  name: string;
  avatar?: string;
  role: Role;
}

export interface Category {
  id: string;
  slug: string;
  name: string;
  description?: string;
  image?: string;
  parentId?: string;
  children?: Category[];
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  description: string;
  shortDesc?: string;
  categoryId: string;
  category?: Category;
  collarType: CollarType;
  material?: string;
  basePrice: number;
  salePrice?: number;
  images: string[];
  thumbnail: string;
  isActive: boolean;
  isFeatured: boolean;
  soldCount: number;
  rating: number;
  reviewCount: number;
  variants?: ProductVariant[];
  tags: string[];
}

export interface ProductVariant {
  id: string;
  productId: string;
  sku: string;
  size: Size;
  color: string;
  colorHex: string;
  stock: number;
  price?: number;
  images: string[];
  isActive: boolean;
}

export interface CartItem {
  id: string;
  variantId: string;
  variant?: ProductVariant & { product?: Product };
  quantity: number;
}

export interface Address {
  id: string;
  fullName: string;
  phone: string;
  province: string;
  district: string;
  ward: string;
  street: string;
  isDefault: boolean;
}

export interface OrderItem {
  id: string;
  variantId: string;
  productName: string;
  productSlug: string;
  variantName: string;
  image: string;
  price: number;
  quantity: number;
  subtotal: number;
}

export interface Order {
  id: string;
  code: string;
  userId?: string;
  shippingName: string;
  shippingPhone: string;
  shippingAddress: string;
  items: OrderItem[];
  subtotal: number;
  shippingFee: number;
  discount: number;
  total: number;
  voucherCode?: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  note?: string;
  createdAt: string;
}

// ============ API TYPES ============
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ProductFilter {
  collarType?: CollarType;
  category?: string;
  sizes?: Size[];
  colors?: string[];
  minPrice?: number;
  maxPrice?: number;
  sort?: "price_asc" | "price_desc" | "newest" | "best_seller";
  page?: number;
  limit?: number;
}
