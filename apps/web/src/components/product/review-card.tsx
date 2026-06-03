import { ShieldCheck } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { StarRating } from "./star-rating";
import { formatDate } from "@/lib/customer-utils";

interface ReviewCardProps {
  review: {
    id: string;
    rating: number;
    title?: string | null;
    content: string;
    images?: string[];
    isVerified?: boolean;
    createdAt: string;
    user: {
      name: string;
      avatar?: string | null;
    };
  };
}

export function ReviewCard({ review }: ReviewCardProps) {
  const t = useTranslations("review");
  const locale = useLocale();
  const initials = review.user.name
    .split(" ")
    .map((n) => n[0])
    .slice(-2)
    .join("")
    .toUpperCase();

  return (
    <article className="border-b border-gray-100 pb-6">
      <header className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-medium flex-shrink-0">
          {review.user.avatar ? (
            <img
              src={review.user.avatar}
              alt={review.user.name}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            initials
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium text-gray-900">{review.user.name}</span>
            {review.isVerified && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-50 text-green-700 text-xs">
                <ShieldCheck className="w-3 h-3" />
                {t("verified")}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <StarRating value={review.rating} size="sm" readonly />
            <span className="text-xs text-gray-400">
              {formatDate(review.createdAt, locale)}
            </span>
          </div>
        </div>
      </header>

      <div className="mt-3 ml-13 pl-0 sm:pl-13">
        {review.title && (
          <h4 className="font-medium text-gray-900 mb-1">{review.title}</h4>
        )}
        <p className="text-sm text-gray-600 whitespace-pre-line leading-relaxed">
          {review.content}
        </p>
        {review.images && review.images.length > 0 && (
          <div className="mt-3 flex gap-2 flex-wrap">
            {review.images.map((img, idx) => (
              <img
                key={idx}
                src={img}
                alt={`áº¢nh review ${idx + 1}`}
                className="w-20 h-20 rounded object-cover border border-gray-100"
              />
            ))}
          </div>
        )}
      </div>
    </article>
  );
}

