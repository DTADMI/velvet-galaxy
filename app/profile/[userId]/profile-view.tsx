import {RelationshipManager} from "@/components/relationship-manager";
import type {ProfileViewProps} from "@/types/profile";

export function ProfileView({profile, isOwnProfile, currentUserId}: ProfileViewProps) {
    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-6xl mx-auto p-6">
                <div className="bg-card rounded-xl border border-border p-6 mb-6">
                    <div className="flex flex-col md:flex-row gap-6">
                        {/* ... existing avatar and info ... */}

                        <div className="flex-1">
                            {/* ... existing profile info ... */}

                            {!isOwnProfile && currentUserId && (
                                <div className="mt-4 pt-4 border-t border-border">
                                    <h3 className="text-sm font-semibold mb-3">Your Relationship</h3>
                                    <RelationshipManager targetUserId={profile.id} currentUserId={currentUserId}/>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
