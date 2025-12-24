"use client";

import React, {useState} from "react";
import {Gamepad2, Ghost, Info, Lock, Play, Search, Star, Trophy} from "lucide-react";
import {Card, CardContent, CardFooter, CardHeader, CardTitle} from "@/components/ui/card";
import {Button} from "@/components/ui/button";
import {Badge} from "@/components/ui/badge";
import {Input} from "@/components/ui/input";
import {Navigation} from "@/components/navigation";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";

export default function GamesPage() {
    const [searchQuery, setSearchQuery] = useState("");

    const gameIdeas = [
        {
            title: "The Keymaster's Dungeon",
            description: "Solve puzzles to progress through a BDSM dungeon. Collect and use various toys as tools. Multiple endings based on choices.",
            icon: Lock,
            status: "In Development",
            genre: "Point & Click / Puzzle",
            color: "text-royal-purple"
        },
        {
            title: "Pleasure Island Mystery",
            description: "Whodunit mystery with adult themes. Interview characters and find clues. Sensual mini-games to unlock information.",
            icon: Search,
            status: "Prototype",
            genre: "Mystery / Adventure",
            color: "text-royal-blue"
        },
        {
            title: "The Toymaker's Workshop",
            description: "Craft and customize adult toys. Solve customer requests. Manage resources and reputation.",
            icon: Gamepad2,
            status: "Backlog",
            genre: "Simulation / Management",
            color: "text-royal-green"
        },
        {
            title: "Velvet Dreams",
            description: "Surreal dream world exploration. Transform environments using 'pleasure energy'. Non-linear storytelling.",
            icon: Ghost,
            status: "Concept",
            genre: "Exploration / Narrative",
            color: "text-royal-orange"
        }
    ];

    return (
        <>
            <Navigation/>
            <main className="min-h-screen bg-background pt-20 pb-12">
                <div className="container mx-auto px-4">
                    <header className="mb-12 text-center max-w-3xl mx-auto">
                        <div className="flex justify-center mb-4">
                            <div className="p-3 rounded-full bg-royal-purple/10 text-royal-purple">
                                <Gamepad2 size={40}/>
                            </div>
                        </div>
                        <h1 className="text-4xl font-bold text-gradient mb-4">Velvet Games</h1>
                        <p className="text-muted-foreground text-lg">
                            Experience unique, adult-themed interactive stories and puzzles.
                            Our games are designed to be atmospheric, educational about consent, and deeply engaging.
                        </p>
                    </header>

                    <Tabs defaultValue="all" className="space-y-8">
                        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                            <TabsList className="bg-background border border-royal-purple/20">
                                <TabsTrigger value="all">All Games</TabsTrigger>
                                <TabsTrigger value="playable">Playable</TabsTrigger>
                                <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                            </TabsList>
                            <div className="relative w-full md:w-64">
                                <Search
                                    className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
                                <Input
                                    placeholder="Search games..."
                                    className="pl-9"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>

                        <TabsContent value="all" className="mt-0">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {gameIdeas.map((game, index) => (
                                    <Card key={index}
                                          className="overflow-hidden border-royal-purple/20 bg-card/50 backdrop-blur-sm hover:border-royal-purple/40 transition-all flex flex-col md:flex-row">
                                        <div
                                            className="w-full md:w-48 bg-muted flex items-center justify-center p-8 bg-gradient-to-br from-royal-purple/10 to-royal-blue/10">
                                            <game.icon size={64} className={game.color}/>
                                        </div>
                                        <div className="flex-1 flex flex-col">
                                            <CardHeader>
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <CardTitle className="text-xl mb-1">{game.title}</CardTitle>
                                                        <Badge variant="secondary"
                                                               className="text-[10px]">{game.genre}</Badge>
                                                    </div>
                                                    <Badge
                                                        className={game.status === "In Development" ? "bg-amber-500/10 text-amber-600 border-amber-500/20" : "bg-muted text-muted-foreground"}>
                                                        {game.status}
                                                    </Badge>
                                                </div>
                                            </CardHeader>
                                            <CardContent>
                                                <p className="text-sm text-muted-foreground leading-relaxed">
                                                    {game.description}
                                                </p>
                                            </CardContent>
                                            <CardFooter className="mt-auto pt-0">
                                                <div className="flex gap-2 w-full">
                                                    <Button variant="outline" className="flex-1 gap-2"
                                                            disabled={game.status !== "In Development" && game.status !== "Playable"}>
                                                        <Info size={16}/>
                                                        Details
                                                    </Button>
                                                    <Button
                                                        className="flex-1 bg-gradient-to-r from-royal-purple to-royal-blue gap-2"
                                                        disabled={game.status === "Concept" || game.status === "Backlog"}>
                                                        <Play size={16}/>
                                                        {game.status === "In Development" ? "Play Alpha" : "Play Now"}
                                                    </Button>
                                                </div>
                                            </CardFooter>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        </TabsContent>

                        <TabsContent value="playable" className="mt-0">
                            <div className="text-center py-12 text-muted-foreground">
                                <Trophy size={48} className="mx-auto mb-4 opacity-20"/>
                                <p>No games are currently in public release. Check back soon for the Alpha of "The
                                    Keymaster's Dungeon"!</p>
                            </div>
                        </TabsContent>
                    </Tabs>

                    <section className="mt-20">
                        <Card className="border-royal-blue/20 bg-linear-to-br from-royal-blue/10 to-transparent">
                            <CardContent className="p-8">
                                <div className="flex flex-col md:flex-row items-center gap-8">
                                    <div className="flex-1 text-center md:text-left">
                                        <h2 className="text-2xl font-bold mb-4">Our Vision for Velvet Games</h2>
                                        <p className="text-muted-foreground mb-4">
                                            We aim to create high-quality adult games that prioritize storytelling,
                                            character development, and educational elements regarding intimacy and
                                            consent.
                                        </p>
                                        <p className="text-muted-foreground">
                                            All games are developed using modern web technologies, ensuring they are
                                            accessible directly in your browser with no installation required.
                                        </p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 w-full md:w-auto">
                                        {[
                                            {label: "High Quality", icon: Star},
                                            {label: "Educational", icon: Info},
                                            {label: "Atmospheric", icon: Ghost},
                                            {label: "Consent-focused", icon: Lock},
                                        ].map((item, i) => (
                                            <div key={i}
                                                 className="flex flex-col items-center p-4 rounded-lg bg-background/50 border border-royal-blue/10">
                                                <item.icon className="h-6 w-6 text-royal-blue mb-2"/>
                                                <span className="text-xs font-semibold">{item.label}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </section>
                </div>
            </main>
        </>
    );
}
