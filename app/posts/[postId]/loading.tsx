import {Navigation} from "@/components/navigation";
import {Card, CardContent, CardFooter, CardHeader} from "@/components/ui/card";
import {Skeleton} from "@/components/ui/skeleton";

export default function PostDetailLoading() {
    return (
        <>
            <Navigation/>
            <main className="min-h-screen bg-background pt-20 pb-8">
                <div className="container mx-auto max-w-4xl px-4">
                    <Card className="border-royal-purple/20">
                        <CardHeader>
                            <div className="flex items-center gap-3">
                                <Skeleton className="h-12 w-12 rounded-full"/>
                                <div className="space-y-2">
                                    <Skeleton className="h-5 w-32"/>
                                    <Skeleton className="h-3 w-24"/>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-96 w-full mb-4 rounded-lg"/>
                            <Skeleton className="h-4 w-full mb-2"/>
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

                    <div className="mt-8 space-y-4">
                        <Skeleton className="h-6 w-32"/>
                        {[1, 2, 3].map((i) => (
                            <Card key={i} className="border-royal-purple/20">
                                <CardContent className="py-4">
                                    <div className="flex items-start gap-3">
                                        <Skeleton className="h-8 w-8 rounded-full"/>
                                        <div className="flex-1 space-y-2">
                                            <Skeleton className="h-4 w-24"/>
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
