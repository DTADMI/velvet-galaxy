import {Navigation} from "@/components/navigation";
import {Card, CardContent, CardHeader} from "@/components/ui/card";
import {Skeleton} from "@/components/ui/skeleton";

export default function ProfileLoading() {
    return (
        <>
            <Navigation/>
            <main className="min-h-screen bg-background pt-20 pb-8">
                <div className="container mx-auto max-w-4xl px-4">
                    <div className="space-y-6">
                        <Card className="border-royal-purple/20">
                            <CardHeader className="pb-4">
                                <div className="flex items-start gap-6">
                                    <Skeleton className="h-24 w-24 rounded-full"/>
                                    <div className="flex-1 space-y-3">
                                        <Skeleton className="h-8 w-48"/>
                                        <Skeleton className="h-4 w-full"/>
                                        <Skeleton className="h-4 w-2/3"/>
                                    </div>
                                </div>
                            </CardHeader>
                        </Card>

                        <div className="grid grid-cols-3 gap-4">
                            {[1, 2, 3].map((i) => (
                                <Card key={i} className="border-royal-blue/20">
                                    <CardContent className="pt-6">
                                        <div className="flex flex-col items-center gap-2">
                                            <Skeleton className="h-12 w-12 rounded-lg"/>
                                            <Skeleton className="h-6 w-12"/>
                                            <Skeleton className="h-4 w-16"/>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        <Skeleton className="h-10 w-full rounded-lg"/>

                        <div className="space-y-4">
                            {[1, 2, 3].map((i) => (
                                <Card key={i} className="border-royal-purple/20">
                                    <CardContent className="py-6">
                                        <Skeleton className="h-32 w-full"/>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                </div>
            </main>
        </>
    );
}
