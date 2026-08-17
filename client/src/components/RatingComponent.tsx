import { useState } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

export function RatingComponent({ productId }: { productId: number }) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();

  // Only fetch user rating if authenticated
  const { data: averageRating } = trpc.ratings.getAverageRating.useQuery({ productId });
  const { data: productRatings } = trpc.ratings.getProductRatings.useQuery({ productId });
  const { data: userRating } = trpc.ratings.getUserRating.useQuery(
    { productId },
    { enabled: !!user }
  );

  const addRatingMutation = trpc.ratings.add.useMutation();

  const handleSubmitRating = async () => {
    if (rating === 0 || !user) return;
    
    setIsSubmitting(true);
    try {
      await addRatingMutation.mutateAsync({
        productId,
        rating,
        comment: comment || undefined,
      });
      setRating(0);
      setComment("");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Average Rating Display */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              size={20}
              className={star <= Math.round(averageRating || 0) ? "fill-accent text-accent" : "text-muted-foreground"}
            />
          ))}
        </div>
        <div>
          <p className="font-semibold">{averageRating?.toFixed(1) || "0.0"} de 5</p>
          <p className="text-sm text-muted-foreground">{productRatings?.length || 0} avaliações</p>
        </div>
      </div>

      {/* User Rating Form - Only show if authenticated */}
      {user ? (
        <div className="space-y-4 border-t pt-4">
          <h4 className="font-semibold">Deixe sua avaliação</h4>
          
          {/* Star Rating Input */}
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                className="transition"
              >
                <Star
                  size={28}
                  className={
                    star <= (hoveredRating || rating)
                      ? "fill-accent text-accent"
                      : "text-muted-foreground"
                  }
                />
              </button>
            ))}
          </div>

          {/* Comment Input */}
          <Textarea
            placeholder="Compartilhe sua opinião sobre este produto..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="min-h-24"
          />

          {/* Submit Button */}
          <Button
            onClick={handleSubmitRating}
            disabled={rating === 0 || isSubmitting}
            className="w-full bg-accent hover:bg-accent/90"
          >
            {isSubmitting ? "Enviando..." : "Enviar Avaliação"}
          </Button>
        </div>
      ) : (
        <div className="border-t pt-4 text-center">
          <p className="text-sm text-muted-foreground">Faça login para deixar uma avaliação</p>
        </div>
      )}

      {/* Recent Ratings */}
      {productRatings && productRatings.length > 0 && (
        <div className="space-y-4 border-t pt-4">
          <h4 className="font-semibold">Avaliações Recentes</h4>
          <div className="space-y-3">
            {productRatings.slice(0, 5).map((r) => (
              <div key={r.id} className="border-b pb-3 last:border-b-0">
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={14}
                        className={star <= r.rating ? "fill-accent text-accent" : "text-muted-foreground"}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-semibold">{r.rating}/5</span>
                </div>
                {r.comment && <p className="text-sm text-muted-foreground">{r.comment}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
