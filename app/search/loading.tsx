import {Navigation} from "@/components/navigation";
import {Card, CardContent} from "@/components/ui/card";
import {Skeleton} from "@/components/ui/skeleton";

export default function SearchLoading() {
    return (
        <>
            <Navigation/>
            <main className="min-h-screen bg-background pt-20 pb-8">
                <div className="container mx-auto max-w-4xl px-4">
                    <Skeleton className="h-10 w-full mb-8 rounded-lg"/>

                    <div className="space-y-4">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <Card key={i} className="border-royal-purple/20">
                                <CardContent className="py-4">
                                    <div className="flex items-center gap-3">
                                        <Skeleton className="h-12 w-12 rounded-full"/>
                                        <div className="flex-1 space-y-2">
                                            <Skeleton className="h-5 w-48"/>
                                            <Skeleton className="h-4 w-full"/>
                                        </div>
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
