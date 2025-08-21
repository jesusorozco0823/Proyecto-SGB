"use client";

import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import RecommendedServices from '@/components/recommended-services';

export default function ProfilePage() {
    const { user } = useAuth();
    const userInitials = user?.displayName?.split(' ').map(n => n[0]).join('') || 'U';

    if (!user) {
        return <div>Loading...</div>;
    }

    return (
        <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Profile Information</CardTitle>
                        <CardDescription>Update your personal details and preferences.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="displayName">Full Name</Label>
                            <Input id="displayName" defaultValue={user.displayName} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" type="email" defaultValue={user.email} readOnly />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone</Label>
                            <Input id="phone" type="tel" defaultValue={user.phone} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="preferences">Preferences</Label>
                            <Textarea
                                id="preferences"
                                placeholder="e.g., Modern styles, beard trims, quiet appointments..."
                                defaultValue={user.preferences?.join(', ')}
                            />
                            <p className="text-xs text-muted-foreground">
                                Let your barbers know what you like to get the best experience.
                            </p>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button>Save Changes</Button>
                    </CardFooter>
                </Card>
            </div>
            
            <div className="space-y-6">
                <Card className="flex flex-col items-center text-center p-6">
                    <Avatar className="w-24 h-24 mb-4 border-4 border-primary">
                        <AvatarImage src={user.avatarUrl} />
                        <AvatarFallback className="text-3xl">{userInitials}</AvatarFallback>
                    </Avatar>
                    <h2 className="text-xl font-bold">{user.displayName}</h2>
                    <p className="text-muted-foreground">{user.email}</p>
                    <Button variant="outline" className="mt-4">Change Photo</Button>
                </Card>
                
                <RecommendedServices />
            </div>
        </div>
    );
}
