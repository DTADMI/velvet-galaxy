"use client";

import React, {useState} from "react";
import {ArrowUpDown, Filter, Heart, LayoutGrid, List, Search, Star} from "lucide-react";
import {Navigation} from "@/components/navigation";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Badge} from "@/components/ui/badge";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger} from "@/components/ui/dropdown-menu";
import Link from "next/link";

export default function ToyCatalogPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [sortBy, setSortBy] = useState("Popularity");

    const allToys = [
        {
            id: 1,
            name: "Stellar Pulsar",
            brand: "Nova",
            rating: 4.8,
            likes: 124,
            image: "/placeholder.svg",
            price: "$$$",
            category: "Vibrators"
        },
        {
            id: 2,
            name: "Nebula Wand",
            brand: "Astro",
            rating: 4.9,
            likes: 89,
            image: "/placeholder.svg",
            price: "$$$",
            category: "Vibrators"
        },
        {
            id: 3,
            name: "Void Sucker",
            brand: "Galactic",
            rating: 4.5,
            likes: 56,
            image: "/placeholder.svg",
            price: "$$",
            category: "Strokers"
        },
        {
            id: 4,
            name: "Comet Rider",
            brand: "Nova",
            rating: 4.2,
            likes: 34,
            image: "/placeholder.svg",
            price: "$",
            category: "Anal Toys"
        },
        {
            id: 5,
            name: "Asteroid Impact",
            brand: "DeepSpace",
            rating: 3.9,
            likes: 21,
            image: "/placeholder.svg",
            price: "$$",
            category: "Anal Toys"
        },
        {
            id: 6,
            name: "Galaxy Bind",
            brand: "Velvet",
            rating: 4.7,
            likes: 112,
            image: "/placeholder.svg",
            price: "$$$",
            category: "BDSM Gear"
        },
    ];

    return (
        <>
            <Navigation/>
            <main className="min-h-screen bg-background pt-20 pb-12">
                <div className="container mx-auto px-4">
                    <header className="mb-8">
                        <h1 className="text-3xl font-bold mb-2">Toy Catalog</h1>
                        <p className="text-muted-foreground">Browse our full collection of reviewed pleasure tools.</p>
                    </header>

                    <div className="flex flex-col md:flex-row gap-4 mb-8 items-center justify-between">
                        <div className="relative w-full md:w-96">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
                            <Input
                                placeholder="Search by name, brand or category..."
                                className="pl-9 bg-card border-royal-purple/20 focus:border-royal-purple/50"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="border-royal-purple/20 gap-2 shrink-0">
                                        <ArrowUpDown className="h-4 w-4"/>
                                        Sort by: {sortBy}
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="bg-card border-royal-purple/20">
                                    <DropdownMenuItem
                                        onClick={() => setSortBy("Popularity")}>Popularity</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setSortBy("Rating")}>Rating</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setSortBy("Newest")}>Newest</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setSortBy("Price: Low to High")}>Price: Low to
                                        High</DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>

                            <div className="flex border border-royal-purple/20 rounded-md p-1 shrink-0">
                                <Button
                                    variant={viewMode === "grid" ? "default" : "ghost"}
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => setViewMode("grid")}
                                >
                                    <LayoutGrid className="h-4 w-4"/>
                                </Button>
                                <Button
                                    variant={viewMode === "list" ? "default" : "ghost"}
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => setViewMode("list")}
                                >
                                    <List className="h-4 w-4"/>
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col lg:flex-row gap-8">
                        {/* Filters Sidebar */}
                        <aside className="w-full lg:w-64 space-y-6">
                            <div>
                                <h3 className="font-bold mb-4 flex items-center gap-2">
                                    <Filter className="h-4 w-4"/>
                                    Categories
                                </h3>
                                <div className="space-y-2">
                                    {["Vibrators", "Anal Toys", "Strokers", "BDSM Gear", "Luxury", "App-Controlled"].map(cat => (
                                        <label key={cat} className="flex items-center gap-2 cursor-pointer group">
                                            <div
                                                className="w-4 h-4 border border-royal-purple/30 rounded flex items-center justify-center group-hover:border-royal-purple/60">
                                                {/* Checkbox logic here */}
                                            </div>
                                            <span
                                                className="text-sm text-muted-foreground group-hover:text-foreground">{cat}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <h3 className="font-bold mb-4">Price Range</h3>
                                <div className="flex gap-2">
                                    {["$", "$$", "$$$", "$$$$"].map(p => (
                                        <Button key={p} variant="outline" size="sm"
                                                className="flex-1 border-royal-purple/20">{p}</Button>
                                    ))}
                                </div>
                            </div>
                        </aside>

                        {/* Catalog Grid */}
                        <div className="flex-1">
                            <div
                                className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6" : "space-y-4"}>
                                {allToys.map((toy) => (
                                    <Link href={`/portal/reviews/${toy.id}`} key={toy.id}>
                                        <Card
                                            className={`overflow-hidden group hover:border-royal-purple/40 transition-all cursor-pointer ${viewMode === "list" ? "flex" : ""}`}>
                                            <div
                                                className={`${viewMode === "grid" ? "aspect-video" : "w-48 h-full"} bg-muted relative shrink-0`}>
                                                <img src={toy.image} alt={toy.name}
                                                     className="object-cover w-full h-full group-hover:scale-105 transition-transform"/>
                                                <Badge className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm">
                                                    <Heart className="w-3 h-3 mr-1 fill-red-500 text-red-500"/>
                                                    {toy.likes}
                                                </Badge>
                                            </div>
                                            <div className="flex flex-col flex-1">
                                                <CardHeader className="p-4">
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <CardTitle className="text-lg">{toy.name}</CardTitle>
                                                            <CardDescription>{toy.brand} • {toy.category}</CardDescription>
                                                        </div>
                                                        <div className="flex items-center text-amber-500 font-bold">
                                                            <Star className="w-4 h-4 mr-1 fill-amber-500"/>
                                                            {toy.rating}
                                                        </div>
                                                    </div>
                                                </CardHeader>
                                                <CardContent className="p-4 pt-0 mt-auto">
                                                    <div className="flex items-center justify-between">
                                                        <span className="font-bold text-royal-purple">{toy.price}</span>
                                                        <Button variant="link"
                                                                className="p-0 h-auto text-muted-foreground group-hover:text-royal-purple">
                                                            View Details
                                                        </Button>
                                                    </div>
                                                </CardContent>
                                            </div>
                                        </Card>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </>
    );
}
