"use client";

import {Search} from "lucide-react";
import {useState} from "react";

import {CreateListingDialog} from "@/components/create-listing-dialog";
import {MarketplaceItemCard} from "@/components/marketplace-item-card";
import {Input} from "@/components/ui/input";
import {createClient} from "@/lib/supabase/client";

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
    const [items, setItems] = useState(initialItems);
    const [searchQuery, setSearchQuery] = useState("");

    const [mappedItems, setMappedItems] = useState<MarketplaceItem[]>([]);

    const refreshItems = async () => {
        const supabase = createClient();
        const {data} = await supabase
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
        author_profile:profiles!inner (
          username,
          display_name
        )
      `,
            )
            .order("created_at", {ascending: false});

        if (data) {
            // Map the posts to ensure author_profile is a single object
            setMappedItems((data as MarketplaceItem[] || []).map(item => ({
                ...item,
                author_profile: Array.isArray(item.author_profile) ? item.author_profile[0] : item.author_profile,
            })));
            setItems(data);
        }
    };

    const filteredItems = (mappedItems || []).filter(
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

            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
                <Input
                    placeholder="Search items, locations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                />
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
