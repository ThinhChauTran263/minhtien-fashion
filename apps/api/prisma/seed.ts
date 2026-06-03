import {
  PrismaClient,
  CollarType,
  InvoiceStatus,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  PointType,
  ReturnStatus,
  ReturnType,
  Role,
  Size,
  StockMovementType,
  VoucherType,
} from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const imageBase = "https://images.unsplash.com";
const productImages = {
  poloNavy: `${imageBase}/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&w=1200&q=80`,
  poloWhite: `${imageBase}/photo-1523398002811-999ca8dec234?auto=format&fit=crop&w=1200&q=80`,
  shirtBlue: `${imageBase}/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=1200&q=80`,
  shirtLinen: `${imageBase}/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&w=1200&q=80`,
  tshirtBlack: `${imageBase}/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1200&q=80`,
  tshirtGraphic: `${imageBase}/photo-1562157873-818bc0726f68?auto=format&fit=crop&w=1200&q=80`,
  sweatshirt: `${imageBase}/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=1200&q=80`,
  hoodie: `${imageBase}/photo-1556821840-9a63f95609a7?auto=format&fit=crop&w=1200&q=80`,
  jacket: `${imageBase}/photo-1548883354-94bcfe321cbb?auto=format&fit=crop&w=1200&q=80`,
  pants: `${imageBase}/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=1200&q=80`,
  accessory: `${imageBase}/photo-1521369909029-2afed882baee?auto=format&fit=crop&w=1200&q=80`,
  banner: `${imageBase}/photo-1445205170230-053b83016050?auto=format&fit=crop&w=1600&q=85`,
};

const sizes: Size[] = ["XS", "S", "M", "L", "XL", "XXL"];
const colors = [
  { name: "Đen", hex: "#111827" },
  { name: "Trắng", hex: "#FFFFFF" },
  { name: "Xanh Navy", hex: "#1E3A8A" },
  { name: "Xám Melange", hex: "#9CA3AF" },
  { name: "Be Cát", hex: "#D6C3A5" },
  { name: "Olive", hex: "#556B2F" },
];

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function makeVariants(productSlug: string, colorSubset = colors.slice(0, 4), stockBase = 24) {
  return colorSubset.flatMap((color, colorIndex) =>
    sizes.map((size, sizeIndex) => ({
      sku: `${productSlug.toUpperCase().replace(/-/g, "")}-${colorIndex + 1}-${size}`,
      size,
      color: color.name,
      colorHex: color.hex,
      stock: stockBase + colorIndex * 4 + sizeIndex * 2,
      reserved: size === "M" && colorIndex === 0 ? 1 : 0,
      safetyStock: size === "XS" ? 1 : 2,
      outletStock: size === "XXL" ? 2 : 0,
      price: size === "XXL" ? 20000 : undefined,
      images: [],
      isActive: true,
    }))
  );
}

async function resetDatabase() {
  await prisma.stockMovement.deleteMany();
  await prisma.stockNotification.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.returnRequest.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.review.deleteMany();
  await prisma.wishlist.deleteMany();
  await prisma.flashSaleItem.deleteMany();
  await prisma.flashSale.deleteMany();
  await prisma.bundleItem.deleteMany();
  await prisma.bundle.deleteMany();
  await prisma.giftCard.deleteMany();
  await prisma.referral.deleteMany();
  await prisma.pointHistory.deleteMany();
  await prisma.pushSubscription.deleteMany();
  await prisma.address.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.sizeGuide.deleteMany();
  await prisma.category.deleteMany();
  await prisma.blogPost.deleteMany();
  await prisma.blogCategory.deleteMany();
  await prisma.banner.deleteMany();
  await prisma.newsletter.deleteMany();
  await prisma.voucher.deleteMany();
  await prisma.user.deleteMany();
}

async function seed() {
  console.log("[Seed] Resetting database...");
  await resetDatabase();

  const now = new Date();
  const passwordHash = await bcrypt.hash("123456", 12);
  const adminHash = await bcrypt.hash("admin123", 12);

  const [admin, staff, customerA, customerB, customerC] = await Promise.all([
    prisma.user.create({ data: { email: "admin@minhtien.vn", phone: "0900000001", passwordHash: adminHash, name: "Admin Minh Tiến", role: Role.ADMIN, emailVerified: true, points: 52000, referralCode: "ADMINMTF" } }),
    prisma.user.create({ data: { email: "staff@minhtien.vn", phone: "0900000002", passwordHash, name: "Nhân viên Kho", role: Role.STAFF, emailVerified: true, points: 1200, referralCode: "STAFFMTF" } }),
    prisma.user.create({ data: { email: "customer@example.com", phone: "0900000003", passwordHash, name: "Nguyễn Minh Anh", role: Role.CUSTOMER, emailVerified: true, points: 24500, referralCode: "MINHANH" } }),
    prisma.user.create({ data: { email: "linh.tran@example.com", phone: "0900000004", passwordHash, name: "Trần Gia Linh", role: Role.CUSTOMER, emailVerified: true, points: 8400, referralCode: "GIALINH" } }),
    prisma.user.create({ data: { email: "quocbao@example.com", phone: "0900000005", passwordHash, name: "Lê Quốc Bảo", role: Role.CUSTOMER, emailVerified: true, points: 600, referralCode: "QUOCBAO" } }),
  ]);

  const [addrA, addrB, addrC] = await Promise.all([
    prisma.address.create({ data: { userId: customerA.id, fullName: customerA.name, phone: "0900000003", province: "TP. Hồ Chí Minh", district: "Quận 1", ward: "Bến Nghé", street: "12 Nguyễn Huệ", isDefault: true } }),
    prisma.address.create({ data: { userId: customerB.id, fullName: customerB.name, phone: "0900000004", province: "Hà Nội", district: "Cầu Giấy", ward: "Dịch Vọng", street: "88 Xuân Thủy", isDefault: true } }),
    prisma.address.create({ data: { userId: customerC.id, fullName: customerC.name, phone: "0900000005", province: "Đà Nẵng", district: "Hải Châu", ward: "Phước Ninh", street: "25 Bạch Đằng", isDefault: true } }),
  ]);

  console.log("[Seed] Users and addresses created");

  const men = await prisma.category.create({ data: { slug: "nam", name: "Thời trang nam", description: "Trang phục nam hiện đại", image: productImages.banner, order: 1 } });
  const women = await prisma.category.create({ data: { slug: "nu", name: "Thời trang nữ", description: "Trang phục nữ tối giản", image: productImages.banner, order: 2 } });
  const unisex = await prisma.category.create({ data: { slug: "unisex", name: "Unisex", description: "Dễ mặc cho mọi giới tính", image: productImages.banner, order: 3 } });

  const categories = {
    polo: await prisma.category.create({ data: { slug: "ao-polo", name: "Áo Polo", parentId: men.id, order: 1 } }),
    shirt: await prisma.category.create({ data: { slug: "ao-so-mi", name: "Áo Sơ Mi", parentId: men.id, order: 2 } }),
    tshirt: await prisma.category.create({ data: { slug: "ao-thun", name: "Áo Thun", parentId: unisex.id, order: 1 } }),
    sweatshirt: await prisma.category.create({ data: { slug: "sweatshirt-hoodie", name: "Sweatshirt & Hoodie", parentId: unisex.id, order: 2 } }),
    jacket: await prisma.category.create({ data: { slug: "ao-khoac", name: "Áo Khoác", parentId: unisex.id, order: 3 } }),
    pants: await prisma.category.create({ data: { slug: "quan", name: "Quần", parentId: women.id, order: 1 } }),
    accessory: await prisma.category.create({ data: { slug: "phu-kien", name: "Phụ Kiện", parentId: unisex.id, order: 4 } }),
  };

  const sizeGuide = {
    XS: { chest: 88, length: 64, shoulder: 39, weight: "42-50kg", height: "150-160cm" },
    S: { chest: 94, length: 67, shoulder: 42, weight: "50-58kg", height: "158-166cm" },
    M: { chest: 100, length: 70, shoulder: 44, weight: "58-66kg", height: "166-172cm" },
    L: { chest: 106, length: 73, shoulder: 46, weight: "66-74kg", height: "172-178cm" },
    XL: { chest: 112, length: 76, shoulder: 49, weight: "74-84kg", height: "178-184cm" },
    XXL: { chest: 118, length: 79, shoulder: 52, weight: "84-95kg", height: "184-190cm" },
  };
  await prisma.sizeGuide.createMany({
    data: [
      { categoryId: categories.polo.id, data: sizeGuide },
      { categoryId: categories.shirt.id, data: sizeGuide },
      { categoryId: categories.tshirt.id, data: sizeGuide },
      { categoryId: categories.sweatshirt.id, data: sizeGuide },
    ],
  });

  const productData = [
    ["polo-premium-navy", "Polo Premium Navy", categories.polo.id, CollarType.CO_CO, 389000, 329000, productImages.poloNavy, true, ["polo", "premium", "navy", "office"]],
    ["polo-aircool-trang", "Polo AirCool Trắng", categories.polo.id, CollarType.CO_CO, 359000, null, productImages.poloWhite, true, ["polo", "aircool", "basic"]],
    ["so-mi-oxford-xanh", "Sơ Mi Oxford Xanh", categories.shirt.id, CollarType.CO_CO, 499000, 429000, productImages.shirtBlue, true, ["so-mi", "oxford", "cong-so"]],
    ["so-mi-linen-be", "Sơ Mi Linen Be", categories.shirt.id, CollarType.CO_CO, 529000, null, productImages.shirtLinen, false, ["linen", "summer", "resort"]],
    ["ao-thun-heavyweight-den", "Áo Thun Heavyweight Đen", categories.tshirt.id, CollarType.CO_TRON, 299000, 249000, productImages.tshirtBlack, true, ["t-shirt", "heavyweight", "streetwear"]],
    ["ao-thun-graphic-saigon", "Áo Thun Graphic Saigon", categories.tshirt.id, CollarType.CO_TRON, 329000, null, productImages.tshirtGraphic, true, ["graphic", "saigon", "local-brand"]],
    ["sweatshirt-french-terry", "Sweatshirt French Terry", categories.sweatshirt.id, CollarType.CO_TRON, 459000, 399000, productImages.sweatshirt, true, ["sweatshirt", "french-terry"]],
    ["hoodie-zip-oversize", "Hoodie Zip Oversize", categories.sweatshirt.id, CollarType.CO_TRON, 579000, null, productImages.hoodie, false, ["hoodie", "oversize"]],
    ["ao-khoac-bomber-olive", "Áo Khoác Bomber Olive", categories.jacket.id, CollarType.CO_TRON, 799000, 699000, productImages.jacket, true, ["bomber", "outerwear"]],
    ["quan-wide-leg-den", "Quần Wide-leg Đen", categories.pants.id, CollarType.CO_TRON, 549000, 489000, productImages.pants, false, ["pants", "wide-leg"]],
    ["mu-bucket-canvas", "Mũ Bucket Canvas", categories.accessory.id, CollarType.CO_TRON, 199000, 169000, productImages.accessory, true, ["bucket", "accessory"]],
    ["tui-tote-daily", "Túi Tote Daily", categories.accessory.id, CollarType.CO_TRON, 249000, null, productImages.accessory, false, ["tote", "accessory"]],
  ] as const;

  const products = [];
  for (const [slug, name, categoryId, collarType, basePrice, salePrice, image, isFeatured, tags] of productData) {
    const product = await prisma.product.create({
      data: {
        slug,
        name,
        description: `${name} thuộc bộ sưu tập Minh Tiến Fashion 2026. Chất liệu được chọn để mặc hằng ngày, dễ phối đồ, giữ form tốt sau nhiều lần giặt.`,
        shortDesc: `${name} form đẹp, chất liệu thoáng, phù hợp đi làm và đi chơi.`,
        categoryId,
        collarType,
        material: collarType === CollarType.CO_CO ? "Cotton pique 65/35" : "Cotton compact 100%",
        basePrice,
        salePrice: salePrice ?? undefined,
        images: [image, `${image}&crop=faces`, `${image}&sat=-20`],
        thumbnail: image,
        isActive: true,
        isFeatured,
        metaTitle: `${name} | Minh Tiến Fashion`,
        metaDescription: `Mua ${name} chính hãng Minh Tiến Fashion, đổi trả dễ dàng, giao nhanh toàn quốc.`,
        soldCount: Math.floor(Math.random() * 90) + 10,
        viewCount: Math.floor(Math.random() * 1200) + 150,
        lowStockThreshold: 5,
        tags: [...tags],
        variants: { create: makeVariants(slug, slug.includes("bucket") || slug.includes("tote") ? colors.slice(0, 3) : colors.slice(0, 5), slug.includes("bomber") ? 10 : 22) },
      },
      include: { variants: true },
    });
    products.push(product);
  }

  console.log(`[Seed] Products created: ${products.length}`);

  await prisma.banner.createMany({
    data: [
      { title: "Black Friday Minh Tiến", image: productImages.banner, link: "/products?sort=best_seller", position: "home_hero", order: 1, isActive: true, startsAt: addDays(now, -7), expiresAt: addDays(now, 30) },
      { title: "Polo Premium giảm đến 20%", image: productImages.poloNavy, link: "/products/polo-premium-navy", position: "home_secondary", order: 2, isActive: true },
      { title: "New arrivals 2026", image: productImages.shirtLinen, link: "/products?sort=newest", position: "collection", order: 3, isActive: true },
    ],
  });

  const vouchers = await prisma.voucher.createMany({
    data: [
      { code: "MTF10", description: "Giảm 10% tối đa 50.000đ", type: VoucherType.PERCENT, value: 10, minOrder: 200000, maxDiscount: 50000, usageLimit: 500, usageCount: 24, perUserLimit: 1, applicableCategoryIds: [], applicableProductIds: [], startsAt: addDays(now, -30), expiresAt: addDays(now, 365), isActive: true },
      { code: "BLACKFRIDAY", description: "Giảm 20% tối đa 150.000đ cho Black Friday", type: VoucherType.PERCENT, value: 20, minOrder: 500000, maxDiscount: 150000, usageLimit: 100, usageCount: 88, perUserLimit: 1, applicableCategoryIds: [], applicableProductIds: [], startsAt: addDays(now, -3), expiresAt: addDays(now, 10), isActive: true },
      { code: "FREESHIP", description: "Miễn phí vận chuyển toàn quốc", type: VoucherType.FREE_SHIPPING, value: 0, minOrder: 300000, usageLimit: 1000, usageCount: 112, perUserLimit: 3, applicableCategoryIds: [], applicableProductIds: [], startsAt: addDays(now, -30), expiresAt: addDays(now, 365), isActive: true },
      { code: "GOLD50", description: "Thành viên GOLD giảm 50.000đ", type: VoucherType.FIXED, value: 50000, minOrder: 399000, usageLimit: 200, usageCount: 7, perUserLimit: 1, applicableCategoryIds: [], applicableProductIds: [], requiredMemberTier: "GOLD", startsAt: addDays(now, -10), expiresAt: addDays(now, 90), isActive: true },
      { code: "LIMIT1", description: "Voucher giới hạn 1 lượt để test oversell", type: VoucherType.FIXED, value: 100000, minOrder: 300000, usageLimit: 1, usageCount: 0, perUserLimit: 1, applicableCategoryIds: [], applicableProductIds: [], startsAt: addDays(now, -1), expiresAt: addDays(now, 30), isActive: true },
    ],
  });

  const flashSale = await prisma.flashSale.create({
    data: {
      name: "Flash Sale 12H - Test Race Condition",
      startsAt: addDays(now, -1),
      endsAt: addDays(now, 2),
      isActive: true,
      items: {
        create: [
          { productId: products[0].id, salePrice: 289000, quantity: 50, sold: 12 },
          { productId: products[4].id, salePrice: 219000, quantity: 80, sold: 35 },
          { productId: products[8].id, salePrice: 649000, quantity: 20, sold: 6 },
        ],
      },
    },
  });

  await prisma.bundle.create({
    data: {
      slug: "combo-polo-tshirt",
      name: "Combo Polo + Áo Thun",
      description: "Mua combo đi làm và cuối tuần, giảm trực tiếp trên giỏ hàng.",
      thumbnail: productImages.poloNavy,
      discountType: VoucherType.PERCENT,
      discountValue: 12,
      startDate: addDays(now, -7),
      endDate: addDays(now, 60),
      isActive: true,
      items: { create: [{ productId: products[0].id, quantity: 1 }, { productId: products[4].id, quantity: 1 }] },
    },
  });

  await prisma.bundle.create({
    data: {
      slug: "set-streetwear-cuoi-tuan",
      name: "Set Streetwear Cuối Tuần",
      description: "Áo graphic, hoodie và bucket hat cho outfit cuối tuần.",
      thumbnail: productImages.tshirtGraphic,
      discountType: VoucherType.FIXED,
      discountValue: 120000,
      startDate: addDays(now, -3),
      endDate: addDays(now, 45),
      isActive: true,
      items: { create: [{ productId: products[5].id, quantity: 1 }, { productId: products[7].id, quantity: 1 }, { productId: products[10].id, quantity: 1 }] },
    },
  });

  console.log(`[Seed] Promotions created: vouchers=${vouchers.count}, flashSale=${flashSale.name}`);

  const firstVariant = products[0].variants[2];
  const secondVariant = products[4].variants[8];
  const thirdVariant = products[2].variants[5];
  const fourthVariant = products[8].variants[4];

  await prisma.cart.create({
    data: {
      userId: customerA.id,
      reminderCount: 1,
      items: { create: [{ variantId: firstVariant.id, quantity: 1 }, { variantId: secondVariant.id, quantity: 2 }] },
    },
  });

  await prisma.wishlist.createMany({
    data: [
      { userId: customerA.id, productId: products[0].id },
      { userId: customerA.id, productId: products[8].id },
      { userId: customerB.id, productId: products[2].id },
      { userId: customerC.id, productId: products[5].id },
    ],
  });

  const orderDelivered = await prisma.order.create({
    data: {
      code: "MTF202606010001",
      userId: customerA.id,
      addressId: addrA.id,
      shippingName: customerA.name,
      shippingPhone: "0900000003",
      shippingAddress: "12 Nguyễn Huệ, Bến Nghé, Quận 1, TP. Hồ Chí Minh",
      subtotal: 578000,
      shippingFee: 30000,
      discount: 50000,
      total: 558000,
      pointsUsed: 0,
      pointsEarned: 558,
      voucherCode: "MTF10",
      status: OrderStatus.DELIVERED,
      paymentMethod: PaymentMethod.COD,
      paymentStatus: PaymentStatus.PAID,
      stockDeducted: true,
      paidAt: addDays(now, -12),
      shippedAt: addDays(now, -10),
      deliveredAt: addDays(now, -8),
      items: {
        create: [
          { variantId: firstVariant.id, productName: products[0].name, productSlug: products[0].slug, variantName: `${firstVariant.color} / ${firstVariant.size}`, image: products[0].thumbnail, price: 329000, quantity: 1, subtotal: 329000, discountAllocated: 28000 },
          { variantId: secondVariant.id, productName: products[4].name, productSlug: products[4].slug, variantName: `${secondVariant.color} / ${secondVariant.size}`, image: products[4].thumbnail, price: 249000, quantity: 1, subtotal: 249000, discountAllocated: 22000 },
        ],
      },
    },
  });

  const orderShipping = await prisma.order.create({
    data: {
      code: "MTF202606010002",
      userId: customerB.id,
      addressId: addrB.id,
      shippingName: customerB.name,
      shippingPhone: "0900000004",
      shippingAddress: "88 Xuân Thủy, Dịch Vọng, Cầu Giấy, Hà Nội",
      subtotal: 1128000,
      shippingFee: 0,
      discount: 150000,
      total: 978000,
      pointsEarned: 978,
      voucherCode: "BLACKFRIDAY",
      status: OrderStatus.SHIPPING,
      paymentMethod: PaymentMethod.VNPAY,
      paymentStatus: PaymentStatus.PAID,
      paymentRef: "VNPAY-DEMO-0002",
      stockDeducted: true,
      paidAt: addDays(now, -2),
      shippedAt: addDays(now, -1),
      estimatedDelivery: addDays(now, 2),
      items: { create: [{ variantId: thirdVariant.id, productName: products[2].name, productSlug: products[2].slug, variantName: `${thirdVariant.color} / ${thirdVariant.size}`, image: products[2].thumbnail, price: 429000, quantity: 1, subtotal: 429000, discountAllocated: 57000 }, { variantId: fourthVariant.id, productName: products[8].name, productSlug: products[8].slug, variantName: `${fourthVariant.color} / ${fourthVariant.size}`, image: products[8].thumbnail, price: 699000, quantity: 1, subtotal: 699000, discountAllocated: 93000 }] },
    },
  });

  const orderPending = await prisma.order.create({
    data: {
      code: "MTF202606010003",
      userId: customerC.id,
      addressId: addrC.id,
      shippingName: customerC.name,
      shippingPhone: "0900000005",
      shippingAddress: "25 Bạch Đằng, Phước Ninh, Hải Châu, Đà Nẵng",
      subtotal: 399000,
      shippingFee: 30000,
      discount: 0,
      total: 429000,
      status: OrderStatus.PENDING,
      paymentMethod: PaymentMethod.BANK_TRANSFER,
      paymentStatus: PaymentStatus.PENDING,
      reservedUntil: addDays(now, 1),
      items: { create: [{ variantId: products[6].variants[7].id, productName: products[6].name, productSlug: products[6].slug, variantName: `${products[6].variants[7].color} / ${products[6].variants[7].size}`, image: products[6].thumbnail, price: 399000, quantity: 1, subtotal: 399000 }] },
    },
  });

  await prisma.invoice.create({ data: { orderId: orderDelivered.id, invoiceNumber: "INV-2026-0001", invoiceSerial: "MTF26", invoiceDate: addDays(now, -8), buyerName: customerA.name, buyerAddress: "12 Nguyễn Huệ, TP. Hồ Chí Minh", buyerTaxCode: "0312345678", totalAmount: 558000, vatAmount: 50727, status: InvoiceStatus.ISSUED, pdfUrl: "https://example.com/invoices/INV-2026-0001.pdf" } });

  await prisma.returnRequest.create({
    data: {
      code: "RET202606010001",
      orderId: orderDelivered.id,
      userId: customerA.id,
      type: ReturnType.EXCHANGE,
      status: ReturnStatus.PENDING,
      reason: "Đổi size",
      description: "Mình muốn đổi Polo từ M sang L.",
      images: [productImages.poloNavy],
      items: [{ orderItemProductSlug: products[0].slug, quantity: 1, reason: "Chật vai" }],
      refundAmount: 0,
      adminNote: "Chờ kho xác nhận size L",
    },
  });

  await prisma.review.createMany({
    data: [
      { productId: products[0].id, userId: customerA.id, rating: 5, title: "Form rất đẹp", content: "Vải polo dày vừa, mặc đi làm lịch sự.", images: [productImages.poloNavy], isApproved: true, isVerified: true, createdAt: addDays(now, -7) },
      { productId: products[4].id, userId: customerA.id, rating: 4, title: "Áo dày dặn", content: "Màu đen đẹp, cổ hơi ôm nhưng ổn.", images: [], isApproved: true, isVerified: true, createdAt: addDays(now, -6) },
      { productId: products[2].id, userId: customerB.id, rating: 5, title: "Sơ mi công sở tốt", content: "Ít nhăn, đường may sạch.", images: [productImages.shirtBlue], isApproved: true, isVerified: true, createdAt: addDays(now, -2) },
      { productId: products[8].id, userId: customerB.id, rating: 4, title: "Bomber chắc chắn", content: "Dày, hợp đi tối, giao nhanh.", images: [], isApproved: true, isVerified: true, createdAt: addDays(now, -1) },
      { productId: products[5].id, userId: customerC.id, rating: 3, title: "Chờ duyệt", content: "Review mẫu chưa duyệt để test admin.", images: [], isApproved: false, isVerified: false, createdAt: now },
    ],
  });

  for (const product of products) {
    const result = await prisma.review.aggregate({ where: { productId: product.id, isApproved: true }, _avg: { rating: true }, _count: { id: true } });
    await prisma.product.update({ where: { id: product.id }, data: { rating: result._avg.rating ?? 0, reviewCount: result._count.id } });
  }

  await prisma.pointHistory.createMany({
    data: [
      { userId: customerA.id, type: PointType.EARN_ORDER, points: 558, description: "Tích điểm đơn MTF202606010001", orderId: orderDelivered.id },
      { userId: customerA.id, type: PointType.BONUS, points: 5000, description: "Welcome bonus" },
      { userId: customerB.id, type: PointType.EARN_ORDER, points: 978, description: "Tích điểm đơn MTF202606010002", orderId: orderShipping.id },
    ],
  });

  await prisma.giftCard.createMany({
    data: [
      { code: "GC-MTF-500", amount: 500000, balance: 350000, purchaserId: customerA.id, recipientEmail: "friend@example.com", recipientName: "Bạn thân", message: "Chúc bạn mua sắm vui vẻ", isActive: true, expiresAt: addDays(now, 180) },
      { code: "GC-USED-200", amount: 200000, balance: 0, purchaserId: customerB.id, recipientEmail: customerC.email, recipientName: customerC.name, isActive: false, redeemedById: customerC.id, expiresAt: addDays(now, 120), usedAt: addDays(now, -3) },
    ],
  });

  await prisma.referral.create({ data: { referrerId: customerA.id, refereeId: customerC.id, orderId: orderDelivered.id, refereeOrderId: orderPending.id, rewarded: true, rewardGiven: false, rewardAmount: 50000 } });

  await prisma.stockNotification.createMany({
    data: [
      { variantId: products[8].variants[0].id, email: "wait-bomber@example.com", userId: customerA.id, notified: false },
      { variantId: products[10].variants[1].id, email: "bucket@example.com", notified: true, notifiedAt: addDays(now, -1) },
    ],
  });

  await prisma.stockMovement.createMany({
    data: [
      { variantId: firstVariant.id, type: StockMovementType.DEDUCT_DIRECT, quantity: -1, stockAfter: firstVariant.stock - 1, reservedAfter: firstVariant.reserved, refType: "ORDER", refId: orderDelivered.id, note: "Seed delivered order", createdBy: staff.id },
      { variantId: secondVariant.id, type: StockMovementType.DEDUCT_DIRECT, quantity: -1, stockAfter: secondVariant.stock - 1, reservedAfter: secondVariant.reserved, refType: "ORDER", refId: orderDelivered.id, note: "Seed delivered order", createdBy: staff.id },
      { variantId: thirdVariant.id, type: StockMovementType.COMMIT_SALE, quantity: -1, stockAfter: thirdVariant.stock - 1, reservedAfter: 0, refType: "ORDER", refId: orderShipping.id, note: "Seed paid VNPAY order", createdBy: staff.id },
      { variantId: products[6].variants[7].id, type: StockMovementType.RESERVE, quantity: -1, stockAfter: products[6].variants[7].stock, reservedAfter: products[6].variants[7].reserved + 1, refType: "ORDER", refId: orderPending.id, note: "Seed pending bank transfer", createdBy: staff.id },
      { variantId: fourthVariant.id, type: StockMovementType.MANUAL_ADJUST, quantity: 5, stockAfter: fourthVariant.stock + 5, reservedAfter: fourthVariant.reserved, refType: "MANUAL", refId: staff.id, note: "Admin kiểm kê bổ sung", createdBy: staff.id },
    ],
  });

  const blogCat = await prisma.blogCategory.create({ data: { slug: "phoi-do", name: "Phối đồ" } });
  const guideCat = await prisma.blogCategory.create({ data: { slug: "huong-dan-size", name: "Hướng dẫn size" } });
  await prisma.blogPost.createMany({
    data: [
      { slug: "cach-chon-size-ao-polo", title: "Cách chọn size áo polo chuẩn", excerpt: "Đo vai, ngực và chiều dài áo trong 3 phút.", content: "Bài viết hướng dẫn khách hàng chọn size áo polo Minh Tiến Fashion theo chiều cao, cân nặng và form mặc mong muốn.", thumbnail: productImages.poloNavy, categoryId: guideCat.id, authorId: admin.id, tags: ["size", "polo"], relatedProductIds: [products[0].id, products[1].id], readingTime: 4, isPublished: true, publishedAt: addDays(now, -14), metaTitle: "Chọn size áo polo", metaDescription: "Hướng dẫn chọn size polo Minh Tiến." },
      { slug: "5-outfit-di-lam-mua-he", title: "5 outfit đi làm mùa hè", excerpt: "Polo, sơ mi linen và quần wide-leg cho tuần làm việc.", content: "Gợi ý phối đồ mùa hè với chất liệu thoáng, màu trung tính và phụ kiện tối giản.", thumbnail: productImages.shirtLinen, categoryId: blogCat.id, authorId: admin.id, tags: ["office", "summer"], relatedProductIds: [products[2].id, products[3].id, products[9].id], readingTime: 6, isPublished: true, publishedAt: addDays(now, -5), metaTitle: "Outfit đi làm mùa hè", metaDescription: "Gợi ý phối đồ công sở mùa hè." },
      { slug: "bao-quan-ao-thun-heavyweight", title: "Bảo quản áo thun heavyweight", excerpt: "Giặt và phơi đúng cách để áo giữ form.", content: "Checklist bảo quản áo thun dày: giặt mặt trái, nước lạnh, không sấy nhiệt cao, phơi ngang khi cần.", thumbnail: productImages.tshirtBlack, categoryId: guideCat.id, authorId: staff.id, tags: ["care", "t-shirt"], relatedProductIds: [products[4].id], readingTime: 3, isPublished: false },
    ],
  });

  await prisma.newsletter.createMany({ data: [{ email: "subscriber1@example.com" }, { email: "subscriber2@example.com" }, { email: "vip.customer@example.com" }] });
  await prisma.pushSubscription.create({ data: { userId: customerA.id, endpoint: "https://push.example.com/demo-endpoint", p256dh: "demo-p256dh-key", auth: "demo-auth-secret" } });

  console.log("[Seed] Commerce data created");
  console.log("[Seed] Login accounts:");
  console.log("  admin@minhtien.vn / admin123");
  console.log("  customer@example.com / 123456");
  console.log("  linh.tran@example.com / 123456");
  console.log("  quocbao@example.com / 123456");
}

seed()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
