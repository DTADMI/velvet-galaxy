"use client";

import {MapPin, Search} from "lucide-react";
import {useEffect, useState} from "react";

import {CreateListingDialog} from "@/components/create-listing-dialog";
import {MarketplaceItemCard} from "@/components/marketplace-item-card";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {createClient} from "@/lib/supabase/client";
import {cn} from "@/lib/utils";

interface MarketplaceItem {
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

interface MarketplaceClientProps {
    items: MarketplaceItem[]
}

export function MarketplaceClient({items: initialItems}: MarketplaceClientProps) {
    const [items, setItems] = useState<MarketplaceItem[]>(initialItems);
    const [searchQuery, setSearchQuery] = useState("");
    const [localOnly, setLocalOnly] = useState(false);
    const [userLocation, setUserLocation] = useState<{ lat: number, lon: number } | null>(null);

    useEffect(() => {
        const fetchUserLocation = async () => {
            const supabase = createClient();
            const {data: {user}} = await supabase.auth.getUser();
            if (user) {
                const {data} = await supabase.from("profiles").select("latitude, longitude").eq("id", user.id).single();
                if (data?.latitude && data?.longitude) {
                    setUserLocation({lat: Number(data.latitude), lon: Number(data.longitude)});
                }
            }
        };
        fetchUserLocation();
    }, []);

    const refreshItems = async () => {
        const supabase = createClient();
        let query = supabase
            .from("marketplace_items")
            .select(
                `
        id,
        title,
        description,
        price,
        location,
        image_url,
        status,
        created_at,
        latitude,
        longitude,
        author_profile:profiles!inner (
          username,
          display_name
        )
      `,
            );

        if (localOnly && userLocation) {
            query = query
                .gte("latitude", userLocation.lat - 1)
                .lte("latitude", userLocation.lat + 1)
                .gte("longitude", userLocation.lon - 1)
                .lte("longitude", userLocation.lon + 1);
        }

        const {data} = await query.order("created_at", {ascending: false});

        if (data) {
            const mapped = (data as any[]).map(item => ({
                ...item,
                author_profile: Array.isArray(item.author_profile) ? item.author_profile[0] : item.author_profile,
            }));
            setItems(mapped);
        }
    };

    useEffect(() => {
        refreshItems();
    }, [localOnly, userLocation]);

    const filteredItems = (items || []).filter(
        (item) =>
            item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.location.toLowerCase().includes(searchQuery.toLowerCase()),
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Local Marketplace</h1>
                    <p className="text-muted-foreground">Buy and sell with your community</p>
                </div>
                <CreateListingDialog onListingCreated={refreshItems}/>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
                    <Input
                        placeholder="Search items, locations..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <Button
                    variant="outline"
                    onClick={() => setLocalOnly(!localOnly)}
                    className={cn(
                        "gap-2 border-royal-purple/20 bg-transparent shrink-0",
                        localOnly && "bg-royal-purple text-white hover:bg-royal-purple/90"
                    )}
                >
                    <MapPin className="h-4 w-4"/>
                    {localOnly ? "Local Only" : "All Locations"}
                </Button>
            </div>

            {filteredItems.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                    <p>{searchQuery ? "No items found matching your search." : "No items listed yet. Be the first to sell!"}</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredItems.map((item) => (
                        <MarketplaceItemCard key={item.id} item={item}/>
                    ))}
                </div>
            )}
        </div>
    );
}
