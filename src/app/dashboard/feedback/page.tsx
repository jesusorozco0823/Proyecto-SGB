import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { mockFeedback, mockAppointments } from "@/lib/mock-data";
import { getUsers } from "@/lib/user-store";
import { Star } from "lucide-react";
import SentimentBadge from "@/components/sentiment-badge";

export default function FeedbackPage() {
    const getFeedbackDetails = (feedback: typeof mockFeedback[0]) => {
        const allUsers = getUsers();
        const appointment = mockAppointments.find(a => a.id === feedback.appointmentId);
        const user = allUsers.find(u => u.id === appointment?.userId);
        return { user };
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold font-headline">Opiniones de Clientes</h1>
                <p className="text-muted-foreground">Revisa y analiza las opiniones para mejorar tu servicio.</p>
            </div>
            {mockFeedback.length === 0 ? (
                <Card>
                    <CardContent className="pt-6">
                        <p className="text-center text-muted-foreground">Todavía no hay opiniones de clientes para mostrar.</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {mockFeedback.map(feedback => {
                        const { user } = getFeedbackDetails(feedback);
                        const userInitials = user?.displayName?.split(' ').map(n => n[0]).join('') || 'U';

                        return (
                            <Card key={feedback.id}>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <Avatar>
                                                <AvatarImage src={user?.avatarUrl} />
                                                <AvatarFallback>{userInitials}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <CardTitle className="text-base">{user?.displayName}</CardTitle>
                                                <div className="flex items-center gap-0.5">
                                                    {Array.from({ length: 5 }).map((_, i) => (
                                                        <Star
                                                            key={i}
                                                            className={`w-4 h-4 ${i < feedback.rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                        <SentimentBadge feedbackText={feedback.comment} />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground italic">"{feedback.comment}"</p>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
