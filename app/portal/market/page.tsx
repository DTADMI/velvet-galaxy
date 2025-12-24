"use client";

import React from "react";
import {Download, Filter, Package, Search, ShoppingBag, Star, Zap} from "lucide-react";
import {Card, CardContent, CardFooter, CardHeader, CardTitle} from "@/components/ui/card";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Badge} from "@/components/ui/badge";
import {Navigation} from "@/components/navigation";

export default function MarketPage() {
    const products = [
        {
            id: "1",
            name: "Velvet Galaxy Classic Tee",
            category: "Merchandise",
            price: 29.99,
            rating: 4.8,
            image: "/placeholder.svg",
            is_digital: false,
        },
        {
            id: "2",
            name: "Digital Art Pack: Nebula",
            category: "Digital Products",
            price: 15.00,
            rating: 4.9,
            image: "/placeholder.svg",
            is_digital: true,
        },
        {
            id: "3",
            name: "Limited Edition Keychain",
            category: "Merchandise",
            price: 9.99,
            rating: 4.5,
            image: "/placeholder.svg",
            is_digital: false,
        },
        {
            id: "4",
            name: "Pro Preset Bundle",
            category: "Digital Products",
            price: 45.00,
            rating: 4.7,
            image: "/placeholder.svg",
            is_digital: true,
        },
    ];

    const categories = ["All", "Merchandise", "Digital Products", "Affiliate Products"];

    return (
        <>
            <Navigation/>
            <main className="min-h-screen bg-background pt-20 pb-12">
                <div className="container mx-auto px-4">
                    <header className="mb-12 text-center max-w-3xl mx-auto">
                        <div className="flex justify-center mb-4">
                            <div className="p-3 rounded-full bg-royal-purple/10 text-royal-purple">
                                <ShoppingBag size={40}/>
                            </div>
                        </div>
                        <h1 className="text-4xl font-bold text-gradient mb-4">Velvet Market</h1>
                        <p className="text-muted-foreground text-lg">
                            Exclusive merchandise, premium digital products, and curated recommendations
                            to support the Velvet Galaxy platform and its creators.
                        </p>
                    </header>

                    <div className="flex flex-col md:flex-row gap-8">
                        {/* Sidebar Filters */}
                        <div className="w-full md:w-64 space-y-6">
                            <div>
                                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                    <Filter size={18}/>
                                    Categories
                                </h3>
                                <div className="space-y-2">
                                    {categories.map((cat) => (
                                        <Button
                                            key={cat}
                                            variant="ghost"
                                            className="w-full justify-start hover:bg-royal-purple/10 hover:text-royal-purple"
                                        >
                                            {cat}
                                        </Button>
                                    ))}
                                </div>
                            </div>

                            <Card className="bg-royal-purple/5 border-royal-purple/20">
                                <CardHeader className="p-4">
                                    <CardTitle className="text-sm">Store Support</CardTitle>
                                </CardHeader>
                                <CardContent className="p-4 pt-0">
                                    <p className="text-xs text-muted-foreground">
                                        Every purchase goes directly towards maintaining and improving the platform.
                                        Thank you for being part of our journey!
                                    </p>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Product Grid */}
                        <div className="flex-1 space-y-6">
                            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
                                <div className="relative w-full sm:w-96">
                                    <Search
                                        className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
                                    <Input placeholder="Search products..." className="pl-9"/>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-muted-foreground">Sort by:</span>
                                    <select className="bg-background border rounded px-2 py-1 text-sm outline-none">
                                        <option>Newest</option>
                                        <option>Price: Low to High</option>
                                        <option>Price: High to Low</option>
                                        <option>Popularity</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {products.map((product) => (
                                    <Card key={product.id}
                                          className="overflow-hidden group hover:border-royal-purple/40 transition-all flex flex-col">
                                        <div className="aspect-square bg-muted relative">
                                            <img
                                                src={product.image}
                                                alt={product.name}
                                                className="object-cover w-full h-full group-hover:scale-105 transition-transform"
                                            />
                                            {product.is_digital ? (
                                                <Badge className="absolute top-2 right-2 bg-royal-blue">
                                                    <Download size={12} className="mr-1"/>
                                                    Digital
                                                </Badge>
                                            ) : (
                                                <Badge className="absolute top-2 right-2 bg-royal-green">
                                                    <Package size={12} className="mr-1"/>
                                                    Physical
                                                </Badge>
                                            )}
                                        </div>
                                        <CardHeader className="p-4 flex-1">
                                            <div className="flex justify-between items-start mb-2">
                                                <Badge variant="outline"
                                                       className="text-[10px] uppercase tracking-wider">
                                                    {product.category}
                                                </Badge>
                                                <div className="flex items-center text-amber-500 text-sm font-bold">
                                                    <Star size={14} className="fill-amber-500 mr-1"/>
                                                    {product.rating}
                                                </div>
                                            </div>
                                            <CardTitle className="text-lg mb-1">{product.name}</CardTitle>
                                            <p className="text-2xl font-bold text-royal-purple">${product.price.toFixed(2)}</p>
                                        </CardHeader>
                                        <CardFooter className="p-4 pt-0">
                                            <Button
                                                className="w-full bg-gradient-to-r from-royal-purple to-royal-blue hover:opacity-90 gap-2">
                                                <Zap size={16}/>
                                                Add to Cart
                                            </Button>
                                        </CardFooter>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </>
    );
}
