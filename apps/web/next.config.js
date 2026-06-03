const createNextIntlPlugin = require("next-intl/plugin");
const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.cloudfront.net" },
      { protocol: "https", hostname: "minh-tien-fashion.s3.ap-southeast-1.amazonaws.com" },
      { protocol: "https", hostname: "**.s3.ap-southeast-1.amazonaws.com" },
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "http", hostname: "localhost" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000",
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  },
  // Performance: chÃ¡Â»â€° minify JS, Ã„â€˜ÃƒÂ£ default
  reactStrictMode: true,
  compress: true,
  poweredByHeader: false,
  async redirects() {
    return [
      { source: "/san-pham", destination: "/products", permanent: true },
      { source: "/san-pham/:slug", destination: "/products/:slug", permanent: true },
      { source: "/gio-hang", destination: "/cart", permanent: true },
      { source: "/thanh-toan", destination: "/checkout", permanent: true },
      { source: "/thanh-toan/ket-qua", destination: "/checkout/result", permanent: true },
      { source: "/dang-nhap", destination: "/login", permanent: true },
      { source: "/dang-ky", destination: "/register", permanent: true },
      { source: "/quen-mat-khau", destination: "/forgot-password", permanent: true },
      { source: "/dat-lai-mat-khau", destination: "/reset-password", permanent: true },
      { source: "/don-hang", destination: "/orders", permanent: true },
      { source: "/don-hang/:code", destination: "/orders/:code", permanent: true },
      { source: "/tai-khoan", destination: "/account", permanent: true },
      { source: "/tai-khoan/don-hang", destination: "/account/orders", permanent: true },
      { source: "/tai-khoan/doi-tra", destination: "/account/returns", permanent: true },
      { source: "/tai-khoan/diem", destination: "/account/points", permanent: true },
      { source: "/tai-khoan/gioi-thieu", destination: "/account/referrals", permanent: true },
      { source: "/tai-khoan/the-qua-tang", destination: "/account/gift-cards", permanent: true },
      { source: "/tai-khoan/dia-chi", destination: "/account/addresses", permanent: true },
      { source: "/tai-khoan/yeu-thich", destination: "/account/wishlist", permanent: true },
      { source: "/tai-khoan/doi-mat-khau", destination: "/account/change-password", permanent: true },
      { source: "/the-qua-tang", destination: "/gift-cards", permanent: true },
      { source: "/so-sanh", destination: "/compare", permanent: true },
      { source: "/cau-hoi-thuong-gap", destination: "/faq", permanent: true },
      { source: "/chinh-sach-bao-mat", destination: "/privacy-policy", permanent: true },
      { source: "/chinh-sach-doi-tra", destination: "/return-policy", permanent: true },
      { source: "/chinh-sach-van-chuyen", destination: "/shipping-policy", permanent: true },
      { source: "/dieu-khoan-su-dung", destination: "/terms", permanent: true },
      { source: "/huong-dan-chon-size", destination: "/size-guide", permanent: true },
      { source: "/huong-dan/size", destination: "/guides/size", permanent: true },
      { source: "/huong-dan/doi-tra", destination: "/guides/returns", permanent: true },
      { source: "/huong-dan/faq", destination: "/guides/faq", permanent: true },
      { source: "/tim-kiem", destination: "/search", permanent: true },
    ];
  },
  async rewrites() {
    return [
      { source: "/products", destination: "/san-pham" },
      { source: "/products/:slug", destination: "/san-pham/:slug" },
      { source: "/cart", destination: "/gio-hang" },
      { source: "/checkout", destination: "/thanh-toan" },
      { source: "/checkout/result", destination: "/thanh-toan/ket-qua" },
      { source: "/login", destination: "/dang-nhap" },
      { source: "/register", destination: "/dang-ky" },
      { source: "/forgot-password", destination: "/quen-mat-khau" },
      { source: "/reset-password", destination: "/dat-lai-mat-khau" },
      { source: "/orders", destination: "/don-hang" },
      { source: "/orders/:code", destination: "/don-hang/:code" },
      { source: "/gift-cards", destination: "/the-qua-tang" },
      { source: "/compare", destination: "/so-sanh" },
      { source: "/faq", destination: "/cau-hoi-thuong-gap" },
      { source: "/privacy-policy", destination: "/chinh-sach-bao-mat" },
      { source: "/return-policy", destination: "/chinh-sach-doi-tra" },
      { source: "/shipping-policy", destination: "/chinh-sach-van-chuyen" },
      { source: "/terms", destination: "/dieu-khoan-su-dung" },
      { source: "/size-guide", destination: "/huong-dan-chon-size" },
      { source: "/guides/size", destination: "/huong-dan/size" },
      { source: "/guides/returns", destination: "/huong-dan/doi-tra" },
      { source: "/guides/faq", destination: "/huong-dan/faq" },
      { source: "/search", destination: "/tim-kiem" },
    ];
  },
};

module.exports = withNextIntl(nextConfig);


