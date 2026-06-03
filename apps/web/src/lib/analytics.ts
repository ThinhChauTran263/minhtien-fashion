/**
 * Event tracking helpers cho GA4 + Facebook Pixel.
 * Chá»‰ gá»­i event náº¿u cookie Ä‘Ã£ Ä‘Æ°á»£c cháº¥p nháº­n (kiá»ƒm tra lÃºc gá»i).
 */

type GtagFn = (...args: any[]) => void;

declare global {
  interface Window {
    gtag?: GtagFn;
    fbq?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}

function ga(...args: any[]) {
  if (typeof window === "undefined" || !window.gtag) return;
  window.gtag(...args);
}

function fbq(...args: any[]) {
  if (typeof window === "undefined" || !window.fbq) return;
  window.fbq(...args);
}

export function trackPageView(url: string) {
  ga("event", "page_view", { page_path: url });
  fbq("track", "PageView");
}

export function trackSearch(query: string) {
  ga("event", "search", { search_term: query });
  fbq("track", "Search", { search_string: query });
}

interface ProductLike {
  id: string;
  name: string;
  basePrice: number | string;
  salePrice?: number | string | null;
  category?: { name?: string } | string;
}

function priceOf(p: ProductLike): number {
  return Number(p.salePrice ?? p.basePrice);
}

function categoryOf(p: ProductLike): string | undefined {
  if (typeof p.category === "string") return p.category;
  return p.category?.name;
}

export function trackViewItem(product: ProductLike) {
  const price = priceOf(product);
  ga("event", "view_item", {
    currency: "VND",
    value: price,
    items: [
      {
        item_id: product.id,
        item_name: product.name,
        item_category: categoryOf(product),
        price,
      },
    ],
  });
  fbq("track", "ViewContent", {
    content_ids: [product.id],
    content_name: product.name,
    content_type: "product",
    value: price,
    currency: "VND",
  });
}

interface CartItemLike {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  size?: string;
  color?: string;
}

export function trackAddToCart(item: CartItemLike) {
  const value = item.price * item.quantity;
  ga("event", "add_to_cart", {
    currency: "VND",
    value,
    items: [
      {
        item_id: item.productId,
        item_name: item.productName,
        price: item.price,
        quantity: item.quantity,
        item_variant: [item.size, item.color].filter(Boolean).join("/") || undefined,
      },
    ],
  });
  fbq("track", "AddToCart", {
    content_ids: [item.productId],
    content_type: "product",
    value,
    currency: "VND",
  });
}

export function trackBeginCheckout(items: CartItemLike[], total: number) {
  ga("event", "begin_checkout", {
    currency: "VND",
    value: total,
    items: items.map((it) => ({
      item_id: it.productId,
      item_name: it.productName,
      price: it.price,
      quantity: it.quantity,
    })),
  });
  fbq("track", "InitiateCheckout", {
    content_ids: items.map((it) => it.productId),
    num_items: items.reduce((s, it) => s + it.quantity, 0),
    value: total,
    currency: "VND",
  });
}

interface OrderLike {
  code: string;
  total: number;
  items: CartItemLike[];
}

export function trackPurchase(order: OrderLike) {
  ga("event", "purchase", {
    transaction_id: order.code,
    currency: "VND",
    value: order.total,
    items: order.items.map((it) => ({
      item_id: it.productId,
      item_name: it.productName,
      price: it.price,
      quantity: it.quantity,
    })),
  });
  fbq("track", "Purchase", {
    content_ids: order.items.map((it) => it.productId),
    value: order.total,
    currency: "VND",
  });
}

