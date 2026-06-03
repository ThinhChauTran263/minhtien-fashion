"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { reviewApi } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import { StarRating } from "./star-rating";
import { ReviewCard } from "./review-card";
import { ReviewForm } from "./review-form";

interface Review {
  id: string;
  rating: number;
  title?: string | null;
  content: string;
  images?: string[];
  isVerified?: boolean;
  createdAt: string;
  user: {
    id: string;
    name: string;
    avatar?: string | null;
  };
}

interface Eligibility {
  canReview: boolean;
  hasReviewed: boolean;
  hasPurchased: boolean;
}

interface ReviewSectionProps {
  productId: string;
  productSlug: string;
  rating: number;
  reviewCount: number;
}

export function ReviewSection({
  productId,
  productSlug,
  rating,
  reviewCount,
}: ReviewSectionProps) {
  const t = useTranslations("review");
  const tNav = useTranslations("nav");
  const { isAuthenticated, hydrate } = useAuthStore();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [eligibility, setEligibility] = useState<Eligibility | null>(null);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const fetchReviews = useCallback(
    async (p: number) => {
      setLoading(true);
      try {
        const { data } = await reviewApi.getByProductSlug(productSlug, p, 5);
        setReviews((prev) => (p === 1 ? data.data.items : [...prev, ...data.data.items]));
        setTotalPages(data.data.totalPages);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    },
    [productSlug]
  );

  useEffect(() => {
    fetchReviews(1);
  }, [fetchReviews]);

  useEffect(() => {
    if (!isAuthenticated) {
      setEligibility({ canReview: false, hasReviewed: false, hasPurchased: false });
      return;
    }
    reviewApi
      .getEligibility(productSlug)
      .then(({ data }) => setEligibility(data.data))
      .catch(() => setEligibility(null));
  }, [productSlug, isAuthenticated]);

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchReviews(next);
  };

  const handleReviewSuccess = () => {
    setEligibility({ canReview: false, hasReviewed: true, hasPurchased: true });
    setPage(1);
    fetchReviews(1);
  };

  return (
    <section
      id="reviews"
      aria-labelledby="reviews-heading"
      className="mt-16 border-t border-gray-100 pt-12"
    >
      <h2 id="reviews-heading" className="text-2xl font-bold text-gray-900">
        {t("sectionTitle")}
      </h2>

      <div className="mt-4 flex items-center gap-4">
        <div className="text-4xl font-bold text-gray-900">{rating.toFixed(1)}</div>
        <div>
          <StarRating value={Math.round(rating)} readonly />
          <p className="text-sm text-gray-500 mt-1">{t("ratings", { count: reviewCount })}</p>
        </div>
      </div>

      <div className="mt-8">
        {!isAuthenticated && (
          <div className="bg-primary-50 rounded-lg p-5 text-center">
            <p className="text-sm text-gray-600">
              <Link href="/login" className="text-accent hover:underline font-medium">
                {tNav("login")}
              </Link>{" "}
              {t("loginToReview")}
            </p>
          </div>
        )}

        {isAuthenticated && eligibility && (
          <>
            {eligibility.canReview && (
              <ReviewForm productId={productId} onSuccess={handleReviewSuccess} />
            )}
            {eligibility.hasReviewed && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-5 text-sm text-green-700">
                {t("alreadyReviewed")}
              </div>
            )}
            {!eligibility.canReview && !eligibility.hasReviewed && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-5 text-sm text-yellow-800">
                {t("needPurchase")}
              </div>
            )}
          </>
        )}
      </div>

      <div className="mt-8 space-y-6">
        {loading && reviews.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm">{t("loading")}</div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm">{t("noReviews")}</div>
        ) : (
          reviews.map((review) => <ReviewCard key={review.id} review={review} />)
        )}
      </div>

      {page < totalPages && (
        <div className="mt-6 text-center">
          <button onClick={loadMore} disabled={loading} className="btn-outline cursor-pointer">
            {loading ? t("loading2") : t("loadMore")}
          </button>
        </div>
      )}
    </section>
  );
}

