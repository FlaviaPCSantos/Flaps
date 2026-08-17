import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";

export function WishlistButton({ productId }: { productId: number }) {
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  const { data: wishlistStatus } = trpc.wishlists.isInWishlist.useQuery(
    { productId },
    { enabled: !!user }
  );

  const addMutation = trpc.wishlists.add.useMutation();
  const removeMutation = trpc.wishlists.remove.useMutation();

  useEffect(() => {
    if (wishlistStatus !== undefined) {
      setIsInWishlist(wishlistStatus);
    }
  }, [wishlistStatus]);

  const handleToggleWishlist = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      if (isInWishlist) {
        await removeMutation.mutateAsync({ productId });
      } else {
        await addMutation.mutateAsync({ productId });
      }
      setIsInWishlist(!isInWishlist);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleToggleWishlist}
      disabled={isLoading}
      className="gap-2"
    >
      <Heart
        size={16}
        className={isInWishlist ? "fill-accent text-accent" : ""}
      />
      {isInWishlist ? "Remover da Lista" : "Adicionar à Lista"}
    </Button>
  );
}
