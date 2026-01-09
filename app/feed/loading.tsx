import {Navigation} from "@/components/navigation";
import {Card, CardContent, CardFooter, CardHeader} from "@/components/ui/card";
import {Skeleton} from "@/components/ui/skeleton";

export default function FeedLoading() {
    return (
        <>
            <Navigation/>
            <main className="min-h-screen bg-background pt-20 pb-8">
                <div className="container mx-auto max-w-[1600px] px-4">
                    <div className="space-y-4">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <Card key={i} className="overflow-hidden border-royal-purple/20 bg-card/50">
                                <CardHeader className="pb-3">
                                    <div className="flex items-center gap-3">
                                        <Skeleton className="h-10 w-10 rounded-full"/>
                                        <div className="space-y-2">
                                            <Skeleton className="h-4 w-32"/>
                                            <Skeleton className="h-3 w-24"/>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="pb-4">
                                    <Skeleton className="h-64 w-full mb-3 rounded-lg"/>
                                    <Skeleton className="h-4 w-full mb-2"/>
                                    <Skeleton className="h-4 w-3/4"/>
                                </CardContent>
                                <CardFooter>
                                    <div className="flex items-center gap-4">
                                        <Skeleton className="h-8 w-16"/>
                                        <Skeleton className="h-8 w-16"/>
                                    </div>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                </div>
            </main>
        </>
    );
}
