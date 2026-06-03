import { prisma } from "../config/database";
import { AppError } from "../middlewares/error.middleware";
import { slugify } from "../utils/slug";

function readingTimeOf(content: string): number {
  const words = content.trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}

export const blogService = {
  async getPosts(filter: { categorySlug?: string; tag?: string; page?: number; limit?: number }) {
    const page = filter.page ?? 1;
    const limit = filter.limit ?? 12;
    const where: any = { isPublished: true };
    if (filter.categorySlug) where.category = { slug: filter.categorySlug };
    if (filter.tag) where.tags = { has: filter.tag };

    const [items, total] = await Promise.all([
      prisma.blogPost.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { publishedAt: "desc" },
        include: {
          author: { select: { name: true, avatar: true } },
          category: { select: { slug: true, name: true } },
        },
      }),
      prisma.blogPost.count({ where }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  },

  async getPostBySlug(slug: string) {
    const post = await prisma.blogPost.findUnique({
      where: { slug },
      include: {
        author: { select: { name: true, avatar: true } },
        category: { select: { slug: true, name: true } },
      },
    });
    if (!post || !post.isPublished) throw new AppError("Bài viết không tồn tại", 404);

    await prisma.blogPost.update({
      where: { id: post.id },
      data: { viewCount: { increment: 1 } },
    });

    return post;
  },

  async getRelatedPosts(postId: string, categoryId: string, limit = 4) {
    return prisma.blogPost.findMany({
      where: { id: { not: postId }, categoryId, isPublished: true },
      take: limit,
      orderBy: { publishedAt: "desc" },
      select: { id: true, slug: true, title: true, thumbnail: true, excerpt: true },
    });
  },

  async getPopularPosts(limit = 5) {
    return prisma.blogPost.findMany({
      where: { isPublished: true },
      take: limit,
      orderBy: { viewCount: "desc" },
      select: { id: true, slug: true, title: true, thumbnail: true },
    });
  },

  async getCategories() {
    return prisma.blogCategory.findMany({ orderBy: { name: "asc" } });
  },

  async getAllSlugs() {
    return prisma.blogPost.findMany({
      where: { isPublished: true },
      select: { slug: true, updatedAt: true },
    });
  },

  // Admin
  async adminList(filter: { categoryId?: string; status?: string; q?: string; page?: number; limit?: number }) {
    const page = filter.page ?? 1;
    const limit = filter.limit ?? 20;
    const where: any = {};
    if (filter.categoryId) where.categoryId = filter.categoryId;
    if (filter.status === "published") where.isPublished = true;
    if (filter.status === "draft") where.isPublished = false;
    if (filter.q) where.title = { contains: filter.q, mode: "insensitive" };

    const [items, total] = await Promise.all([
      prisma.blogPost.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: { category: { select: { name: true } } },
      }),
      prisma.blogPost.count({ where }),
    ]);
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  },

  async create(authorId: string, data: any) {
    let slug = data.slug || slugify(data.title);
    const existing = await prisma.blogPost.findUnique({ where: { slug } });
    if (existing) slug = `${slug}-${Date.now()}`;

    return prisma.blogPost.create({
      data: {
        slug,
        title: data.title,
        excerpt: data.excerpt,
        content: data.content,
        thumbnail: data.thumbnail,
        authorId,
        categoryId: data.categoryId,
        tags: data.tags ?? [],
        metaTitle: data.metaTitle,
        metaDescription: data.metaDescription,
        relatedProductIds: data.relatedProductIds ?? [],
        readingTime: readingTimeOf(data.content),
        isPublished: data.isPublished ?? false,
        publishedAt: data.isPublished ? new Date() : null,
      },
    });
  },

  async update(id: string, data: any) {
    const current = await prisma.blogPost.findUnique({ where: { id } });
    if (!current) throw new AppError("Bài viết không tồn tại", 404);

    return prisma.blogPost.update({
      where: { id },
      data: {
        title: data.title,
        excerpt: data.excerpt,
        content: data.content,
        thumbnail: data.thumbnail,
        categoryId: data.categoryId,
        tags: data.tags,
        metaTitle: data.metaTitle,
        metaDescription: data.metaDescription,
        relatedProductIds: data.relatedProductIds,
        readingTime: data.content ? readingTimeOf(data.content) : undefined,
        isPublished: data.isPublished,
        publishedAt:
          data.isPublished && !current.publishedAt ? new Date() : current.publishedAt,
      },
    });
  },

  async remove(id: string) {
    await prisma.blogPost.delete({ where: { id } });
    return { success: true };
  },
};
