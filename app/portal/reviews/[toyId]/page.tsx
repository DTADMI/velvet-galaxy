"use client";

import React, {useEffect, useState} from "react";
import {useParams, useRouter} from "next/navigation";
import {ArrowLeft, Heart, MessageSquare, Share2, ShoppingBag, Star} from "lucide-react";
import {Navigation} from "@/components/navigation";
import {Button} from "@/components/ui/button";
import {Badge} from "@/components/ui/badge";
import {Card, CardContent} from "@/components/ui/card";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {Separator} from "@/components/ui/separator";
import {ToyViewer3D} from "@/components/portal/toy-viewer-3d";
import {createBrowserClient} from "@/lib/supabase/client";
import {useFeatureFlag} from "@/hooks/use-feature-flag";

export default function ToyDetailPage() {
    const params = useParams();
    const router = useRouter();
    const toyId = params.toyId as string;
    const [toy, setToy] = useState<any>(null);
    const [media, setMedia] = useState<any[]>([]);
    const [likesCount, setLikesCount] = useState(0);
    const [hasLiked, setHasLiked] = useState(false);
    const [comments, setComments] = useState<any[]>([]);
    const [newComment, setNewComment] = useState("");
    const supabase = createBrowserClient();
    const {isEnabled: is3DEnabled} = useFeatureFlag("toy_viewer_3d");

    useEffect(() => {
        fetchToyDetails();
    }, [toyId]);

    const fetchToyDetails = async () => {
        // Mocking data for now as we are in development
        // In production, this would use supabase to fetch from 'toys' table
        const mockToy = {
            id: toyId,
            name: "Stellar Pulsar",
            brand: "Nova Industries",
            description: "A high-frequency vibrational device designed for deep tissue stimulation and celestial pleasure.",
            content: "The Stellar Pulsar is a breakthrough in pleasure technology. Featuring a dual-motor system that synchronizes pulses with cosmic rhythms, it offers 12 unique patterns ranging from gentle nebular drifts to intense supernova bursts. Crafted from medical-grade space-silicone, it feels seamless and premium.",
            rating: 4.8,
            price_range: "$$$",
            buy_link: "https://store.velvetgalaxy.com/stellar-pulsar",
            tags: ["Vibrator", "Silicone", "Rechargeable", "Waterproof"]
        };

        const mockMedia = [
            {type: 'model_3d', url: '/models/toy.glb'},
            {type: 'image', url: '/images/toy-1.jpg'},
            {type: 'image', url: '/images/toy-2.jpg'}
        ];

        setToy(mockToy);
        setMedia(mockMedia);
        setLikesCount(124);
    };

    if (!toy) return null;

    const model3d = media.find(m => m.type === 'model_3d');

    return (
        <>
            <Navigation/>
            <main className="min-h-screen bg-background pt-20 pb-12">
                <div className="container mx-auto px-4">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.back()}
                        className="mb-6 gap-2 text-muted-foreground hover:text-foreground"
                    >
                        <ArrowLeft className="h-4 w-4"/>
                        Back to Reviews
                    </Button>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                        {/* Left Column: Visuals */}
                        <div className="space-y-6">
                            {model3d && is3DEnabled ? (
                                <ToyViewer3D modelUrl={model3d.url}/>
                            ) : media.find(m => m.type === 'image') ? (
                                <div
                                    className="aspect-square bg-muted rounded-xl border border-royal-purple/20 overflow-hidden">
                                    <img
                                        src={media.find(m => m.type === 'image').url}
                                        alt={toy.name}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            ) : (
                                <div className="aspect-square bg-muted rounded-xl border border-royal-purple/20"/>
                            )}

                            <div className="grid grid-cols-4 gap-4">
                                {media.filter(m => m.type === 'image').map((img, i) => (
                                    <div key={i}
                                         className="aspect-square bg-muted rounded-lg overflow-hidden border border-border hover:border-royal-purple/50 cursor-pointer transition-colors">
                                        <img src={img.url} alt={`Toy view ${i}`}
                                             className="w-full h-full object-cover"/>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Right Column: Details */}
                        <div className="space-y-8">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <Badge variant="outline"
                                           className="text-royal-purple border-royal-purple/30 bg-royal-purple/5">
                                        {toy.brand}
                                    </Badge>
                                    <div className="flex items-center text-amber-500 font-bold ml-auto">
                                        <Star className="w-5 h-5 mr-1 fill-amber-500"/>
                                        {toy.rating}
                                    </div>
                                </div>
                                <h1 className="text-4xl font-bold mb-4">{toy.name}</h1>
                                <p className="text-xl text-muted-foreground leading-relaxed">
                                    {toy.description}
                                </p>
                            </div>

                            <div className="flex items-center gap-4">
                                <Button
                                    variant={hasLiked ? "default" : "outline"}
                                    className={hasLiked ? "bg-red-500 hover:bg-red-600 border-none" : "border-royal-purple/20"}
                                    onClick={() => {
                                        setHasLiked(!hasLiked);
                                        setLikesCount(prev => hasLiked ? prev - 1 : prev + 1);
                                    }}
                                >
                                    <Heart className={`h-4 w-4 mr-2 ${hasLiked ? "fill-white" : ""}`}/>
                                    {likesCount} Likes
                                </Button>
                                <Button variant="outline" className="border-royal-purple/20">
                                    <Share2 className="h-4 w-4 mr-2"/>
                                    Share
                                </Button>
                                <Button className="bg-royal-purple hover:bg-royal-purple/90 ml-auto gap-2">
                                    <ShoppingBag className="h-4 w-4"/>
                                    Buy Now
                                </Button>
                            </div>

                            <Separator className="bg-royal-purple/10"/>

                            <Tabs defaultValue="review" className="w-full">
                                <TabsList
                                    className="w-full justify-start bg-transparent border-b border-royal-purple/10 rounded-none h-auto p-0 gap-8">
                                    <TabsTrigger value="review"
                                                 className="px-0 py-3 data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-royal-purple rounded-none">
                                        Review Details
                                    </TabsTrigger>
                                    <TabsTrigger value="specs"
                                                 className="px-0 py-3 data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-royal-purple rounded-none">
                                        Specifications
                                    </TabsTrigger>
                                </TabsList>
                                <TabsContent value="review" className="pt-6">
                                    <div className="prose prose-invert max-w-none text-muted-foreground leading-loose">
                                        {toy.content}
                                    </div>
                                </TabsContent>
                                <TabsContent value="specs" className="pt-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 rounded-lg bg-card border border-border">
                                            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Price
                                                Range</p>
                                            <p className="font-semibold">{toy.price_range}</p>
                                        </div>
                                        <div className="p-4 rounded-lg bg-card border border-border">
                                            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Material</p>
                                            <p className="font-semibold">Medical Grade Silicone</p>
                                        </div>
                                        {/* More specs... */}
                                    </div>
                                </TabsContent>
                            </Tabs>

                            <div className="pt-8">
                                <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
                                    <MessageSquare className="h-5 w-5 text-royal-blue"/>
                                    Comments
                                </h3>
                                <Card className="border-royal-purple/10 bg-royal-purple/5 mb-6">
                                    <CardContent className="p-4">
                    <textarea
                        className="w-full bg-transparent border-none focus:ring-0 text-sm min-h-[80px] placeholder:text-muted-foreground/50"
                        placeholder="Share your experience with this toy..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                    />
                                        <div className="flex justify-end mt-2">
                                            <Button size="sm" className="bg-royal-blue">Post Comment</Button>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Mock Comments List */}
                                <div className="space-y-6">
                                    <div className="flex gap-4">
                                        <div
                                            className="h-10 w-10 rounded-full bg-linear-to-br from-royal-purple to-royal-blue shrink-0"/>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-bold">StarGazer</span>
                                                <span className="text-xs text-muted-foreground">3 days ago</span>
                                            </div>
                                            <p className="text-sm text-muted-foreground">Absolutely worth the price! The
                                                pulsation mode is like nothing else I've tried.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </>
    );
}
