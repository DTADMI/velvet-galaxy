"use client";

import React from "react";
import Link from "next/link";
import {Clock, Filter, Heart, Search, Star} from "lucide-react";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Badge} from "@/components/ui/badge";
import {Navigation} from "@/components/navigation";

export default function ReviewsHomePage() {
    const featuredToys = [
        {id: 1, name: "Stellar Pulsar", brand: "Nova", rating: 4.8, likes: 124, image: "/placeholder.svg"},
        {id: 2, name: "Nebula Wand", brand: "Astro", rating: 4.9, likes: 89, image: "/placeholder.svg"},
        {id: 3, name: "Void Sucker", brand: "Galactic", rating: 4.5, likes: 56, image: "/placeholder.svg"},
    ];

    const recentReviews = [
        {id: 4, name: "Comet Rider", brand: "Nova", rating: 4.2, date: "2 days ago"},
        {id: 5, name: "Asteroid Impact", brand: "DeepSpace", rating: 3.9, date: "5 days ago"},
    ];

    return (
        <>
            <Navigation/>
            <main className="min-h-screen bg-background pt-20 pb-12">
                <div className="container mx-auto px-4">
                    <header className="mb-12 text-center max-w-3xl mx-auto">
                        <h1 className="text-4xl font-bold text-gradient mb-4">Velvet Reviews</h1>
                        <p className="text-muted-foreground text-lg">
                            Explore honest, detailed reviews of the finest pleasure tools in the galaxy.
                            From high-tech innovators to classic essentials, we dive deep into performance,
                            quality, and sensation.
                        </p>
                    </header>

                    <section className="mb-12">
                        <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-8">
                            <h2 className="text-2xl font-bold flex items-center gap-2">
                                <Star className="text-amber-500 fill-amber-500"/>
                                Featured Toys
                            </h2>
                            <div className="relative w-full md:w-64">
                                <Search
                                    className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
                                <Input placeholder="Search reviews..." className="pl-9"/>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {featuredToys.map((toy) => (
                                <Link href={`/portal/reviews/${toy.id}`} key={toy.id}>
                                    <Card
                                        className="overflow-hidden group hover:border-royal-purple/40 transition-all cursor-pointer">
                                        <div className="aspect-video bg-muted relative">
                                            <img src={toy.image} alt={toy.name}
                                                 className="object-cover w-full h-full group-hover:scale-105 transition-transform"/>
                                            <Badge className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm">
                                                <Heart className="w-3 h-3 mr-1 fill-red-500 text-red-500"/>
                                                {toy.likes}
                                            </Badge>
                                        </div>
                                        <CardHeader className="p-4">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <CardTitle className="text-lg">{toy.name}</CardTitle>
                                                    <CardDescription>{toy.brand}</CardDescription>
                                                </div>
                                                <div className="flex items-center text-amber-500 font-bold">
                                                    <Star className="w-4 h-4 mr-1 fill-amber-500"/>
                                                    {toy.rating}
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="p-4 pt-0">
                                            <Button variant="outline"
                                                    className="w-full border-royal-purple/20 group-hover:bg-royal-purple group-hover:text-white transition-colors">
                                                Read Full Review
                                            </Button>
                                        </CardContent>
                                    </Card>
                                </Link>
                            ))}
                        </div>
                    </section>

                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                        <div className="lg:col-span-3">
                            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                                <Clock className="text-royal-blue"/>
                                Recently Added
                            </h2>
                            <div className="space-y-4">
                                {recentReviews.map((review) => (
                                    <Link href={`/portal/reviews/${review.id}`} key={review.id}>
                                        <div
                                            className="flex items-center justify-between p-4 bg-card border border-border rounded-lg hover:border-royal-blue/40 transition-all">
                                            <div className="flex gap-4 items-center">
                                                <div className="w-12 h-12 bg-muted rounded shrink-0"/>
                                                <div>
                                                    <h3 className="font-bold">{review.name}</h3>
                                                    <p className="text-xs text-muted-foreground">{review.brand} • {review.date}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="flex items-center text-sm font-medium">
                                                    <Star className="w-3 h-3 mr-1 fill-amber-500 text-amber-500"/>
                                                    {review.rating}
                                                </div>
                                                <Button variant="ghost" size="sm">View</Button>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                            <Button asChild variant="link" className="mt-4 text-royal-purple p-0">
                                <Link href="/portal/reviews/catalog">View full catalog →</Link>
                            </Button>
                        </div>

                        <div className="space-y-6">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <Filter className="w-5 h-5"/>
                                Categories
                            </h2>
                            <div className="flex flex-wrap gap-2">
                                {["Vibrators", "Anal Toys", "Lubricants", "BDSM Gear", "Strokers", "App-Controlled", "Silicone", "Luxury"].map(tag => (
                                    <Badge key={tag} variant="secondary"
                                           className="hover:bg-royal-purple hover:text-white cursor-pointer transition-colors">
                                        {tag}
                                    </Badge>
                                ))}
                            </div>

                            <Card className="bg-royal-purple/5 border-royal-purple/20">
                                <CardHeader>
                                    <CardTitle className="text-sm">Contribute</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-xs text-muted-foreground mb-4">
                                        Have a toy you love? Share your experience with the community.
                                    </p>
                                    <Button size="sm" className="w-full bg-royal-purple">Submit Review</Button>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </main>
        </>
    );
}
