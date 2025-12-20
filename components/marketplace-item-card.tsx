"use client";

import {DollarSign, MapPin} from "lucide-react";
import Image from "next/image";

import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {Card, CardContent, CardFooter} from "@/components/ui/card";

interface MarketplaceItemCardProps {
    item: {
        id: string
        title: string
        description: string
        price: string
        location: string
        image_url: string | null
        status: string
        author_profile: {
            username: string
            display_name: string | null
        }
    }
    onContact?: (itemId: string) => void
}

export function MarketplaceItemCard({item, onContact}: MarketplaceItemCardProps) {
    const displayName = item.author_profile.display_name || item.author_profile.username;

    return (
        <Card
            className="overflow-hidden border-royal-green/30 hover:border-royal-green hover:shadow-lg hover:shadow-royal-green/20 transition-all">
            <div className="aspect-square relative bg-gradient-to-br from-muted to-muted/50">
                {item.image_url ? (
                    <Image src={item.image_url || "/placeholder.svg"} alt={item.title} fill className="object-cover"/>
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <span className="text-6xl">📦</span>
                    </div>
                )}
                {item.status !== "available" && (
                    <Badge
                        className="absolute top-2 right-2 bg-gradient-to-r from-royal-orange to-yellow text-black font-semibold">
                        {item.status}
                    </Badge>
                )}
            </div>
            <CardContent className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-lg text-foreground line-clamp-1">{item.title}</h3>
                    <div
                        className="flex items-center gap-1 bg-gradient-to-r from-royal-green to-royal-blue bg-clip-text text-transparent font-bold whitespace-nowrap">
                        <DollarSign className="h-4 w-4 text-royal-green"/>
                        <span className="text-royal-green">{Number.parseFloat(item.price).toFixed(2)}</span>
                    </div>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3 text-royal-orange"/>
                    {item.location}
                </div>
                <p className="text-xs text-muted-foreground">Sold by {displayName}</p>
            </CardContent>
            <CardFooter className="p-4 pt-0">
                <Button
                    className="w-full bg-gradient-to-r from-royal-green to-royal-blue hover:from-royal-green-dark hover:to-royal-blue-dark shadow-md shadow-royal-green/20"
                    disabled={item.status !== "available"}
                    onClick={() => onContact?.(item.id)}
                >
                    {item.status === "available" ? "Contact Seller" : "Not Available"}
                </Button>
            </CardFooter>
        </Card>
    );
}
