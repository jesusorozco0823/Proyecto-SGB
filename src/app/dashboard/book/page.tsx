"use client";

import { useState } from 'react';
import { mockServices, mockBarbers } from '@/lib/mock-data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Check, ChevronRight, User, Scissors, Calendar as CalendarIcon, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

type BookingStep = 'service' | 'barber' | 'datetime' | 'confirm';

const timeSlots = ["09:00 AM", "10:00 AM", "11:00 AM", "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM"];

export default function BookingPage() {
  const [step, setStep] = useState<BookingStep>('service');
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedBarber, setSelectedBarber] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const { toast } = useToast();

  const handleServiceToggle = (serviceId: string) => {
    setSelectedServices(prev =>
      prev.includes(serviceId)
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const totalDuration = selectedServices.reduce((acc, id) => {
    const service = mockServices.find(s => s.id === id);
    return acc + (service?.duration || 0);
  }, 0);

  const totalPrice = selectedServices.reduce((acc, id) => {
    const service = mockServices.find(s => s.id === id);
    return acc + (service?.price || 0);
  }, 0);
  
  const handleBooking = () => {
    toast({
        title: "Appointment Booked!",
        description: "Your appointment has been successfully scheduled. See you soon!",
    });
    // Reset state
    setStep('service');
    setSelectedServices([]);
    setSelectedBarber(null);
    setSelectedDate(new Date());
    setSelectedTime(null);
  }

  const renderStepContent = () => {
    switch (step) {
      case 'service':
        return (
          <div className="space-y-4">
            {mockServices.map(service => (
              <label key={service.id} htmlFor={service.id} className="flex items-center p-4 border rounded-lg hover:bg-secondary/50 cursor-pointer transition-colors">
                <Checkbox id={service.id} checked={selectedServices.includes(service.id)} onCheckedChange={() => handleServiceToggle(service.id)} className="mr-4" />
                <div className="flex-1">
                  <p className="font-semibold">{service.name}</p>
                  <p className="text-sm text-muted-foreground">{service.description}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">${service.price.toFixed(2)}</p>
                  <p className="text-sm text-muted-foreground">{service.duration} min</p>
                </div>
              </label>
            ))}
          </div>
        );
      case 'barber':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {mockBarbers.map(barber => (
              <button key={barber.id} onClick={() => setSelectedBarber(barber.id)} className={cn("p-4 border rounded-lg text-left hover:border-primary transition-all", selectedBarber === barber.id && "border-primary ring-2 ring-primary")}>
                <div className="flex items-center gap-4">
                  <Avatar className="w-16 h-16">
                    <AvatarImage src={barber.imageUrl} />
                    <AvatarFallback>{barber.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{barber.name}</p>
                    <p className="text-sm text-muted-foreground">{barber.skills.slice(0,2).join(', ')}</p>
                  </div>
                   {selectedBarber === barber.id && <Check className="ml-auto text-primary" />}
                </div>
              </button>
            ))}
          </div>
        );
      case 'datetime':
        return (
          <div className="grid md:grid-cols-2 gap-8">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="rounded-md border self-start"
              disabled={(date) => date < new Date(new Date().setDate(new Date().getDate() - 1))}
            />
            <div className="grid grid-cols-3 gap-2 self-start">
              {timeSlots.map(time => (
                <Button key={time} variant={selectedTime === time ? 'default' : 'outline'} onClick={() => setSelectedTime(time)}>
                  {time}
                </Button>
              ))}
            </div>
          </div>
        );
      case 'confirm':
        const barber = mockBarbers.find(b => b.id === selectedBarber);
        const services = mockServices.filter(s => selectedServices.includes(s.id));
        return (
            <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                    <h3 className="font-semibold mb-2">Services</h3>
                    <ul className="list-disc list-inside text-muted-foreground">
                        {services.map(s => <li key={s.id}>{s.name} (${s.price.toFixed(2)})</li>)}
                    </ul>
                </div>
                <div className="p-4 border rounded-lg">
                    <h3 className="font-semibold mb-2">Barber</h3>
                    <p className="text-muted-foreground">{barber?.name}</p>
                </div>
                <div className="p-4 border rounded-lg">
                    <h3 className="font-semibold mb-2">Date & Time</h3>
                    <p className="text-muted-foreground">{selectedDate?.toLocaleDateString()} at {selectedTime}</p>
                </div>
            </div>
        )
    }
  };

  const STEPS: { id: BookingStep, title: string, icon: React.ElementType }[] = [
      { id: 'service', title: 'Services', icon: Scissors },
      { id: 'barber', title: 'Barber', icon: User },
      { id: 'datetime', title: 'Date & Time', icon: CalendarIcon },
      { id: 'confirm', title: 'Confirm', icon: Check },
  ];
  
  const currentStepIndex = STEPS.findIndex(s => s.id === step);
  
  return (
    <div className="space-y-8">
        <div>
            <h1 className="text-3xl font-bold font-headline">Book an Appointment</h1>
            <p className="text-muted-foreground">Follow the steps to schedule your visit.</p>
        </div>

        <div className="flex justify-between items-center p-2 border rounded-full mb-8">
            {STEPS.map((s, index) => (
                <div key={s.id} className="flex items-center text-sm">
                    <div className={cn(
                        "flex items-center justify-center w-8 h-8 rounded-full border-2",
                        index < currentStepIndex && "bg-primary border-primary text-primary-foreground",
                        index === currentStepIndex && "border-primary",
                        index > currentStepIndex && "bg-secondary"
                    )}>
                        {index < currentStepIndex ? <Check/> : <s.icon className="w-4 h-4"/>}
                    </div>
                    <span className={cn("ml-2 hidden sm:block", index <= currentStepIndex && "font-semibold")}>{s.title}</span>
                    {index < STEPS.length - 1 && <ChevronRight className="w-8 h-8 text-muted-foreground hidden sm:block"/>}
                </div>
            ))}
        </div>

      <Card>
        <CardHeader>
          <CardTitle>
            Step {currentStepIndex + 1}: Select {STEPS[currentStepIndex].title}
          </CardTitle>
          <CardDescription>
            {step === 'service' && 'Choose one or more services.'}
            {step === 'barber' && 'Pick your preferred barber.'}
            {step === 'datetime' && 'Select a date and time.'}
            {step === 'confirm' && 'Please review your appointment details.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {renderStepContent()}
        </CardContent>
      </Card>

        <div className="bg-card p-4 rounded-lg shadow-md sticky bottom-4 flex justify-between items-center">
            <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">${totalPrice.toFixed(2)}</p>
            </div>
             <div className="flex items-center gap-2">
             {step !== 'service' && (
                <Button variant="outline" onClick={() => setStep(STEPS[currentStepIndex-1].id)}>Back</Button>
            )}

            {step === 'confirm' ? (
                <Button onClick={handleBooking}>Confirm Booking</Button>
            ) : (
                <Button onClick={() => setStep(STEPS[currentStepIndex+1].id)} disabled={
                    (step === 'service' && selectedServices.length === 0) ||
                    (step === 'barber' && !selectedBarber) ||
                    (step === 'datetime' && (!selectedDate || !selectedTime))
                }>Next</Button>
            )}
            </div>
        </div>
    </div>
  );
}
