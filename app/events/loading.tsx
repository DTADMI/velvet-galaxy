import {Navigation} from "@/components/navigation";
import {Card, CardContent} from "@/components/ui/card";
import {Skeleton} from "@/components/ui/skeleton";

export default function EventsLoading() {
    return (
        <>
            <Navigation/>
            <main className="min-h-screen bg-background pt-20 pb-8">
                <div
                    className="bg-gradient-to-br from-royal-orange/10 via-background to-amber-600/10 border-b border-royal-orange/20">
                    <div className="container mx-auto px-4 py-12">
                        <Skeleton className="h-12 w-48 mb-4"/>
                        <Skeleton className="h-6 w-96"/>
                    </div>
                </div>
                <div className="container mx-auto px-4 py-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <Card key={i} className="border-royal-orange/20">
                                <CardContent className="p-6 space-y-3">
                                    <Skeleton className="h-5 w-3/4"/>
                                    <Skeleton className="h-4 w-full"/>
                                    <Skeleton className="h-4 w-1/2"/>
                                    <div className="flex gap-2 pt-2">
                                        <Skeleton className="h-6 w-20"/>
                                        <Skeleton className="h-6 w-20"/>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </main>
        </>
    );
}
