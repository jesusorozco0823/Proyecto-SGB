export type UserRole = 'client' | 'admin' | 'barber';

export interface User {
  id: string;
  displayName: string;
  email: string;
  role: UserRole;
  phone?: string;
  preferences?: string[];
  avatarUrl?: string;
}

export interface Barber {
  id: string;
  name: string;
  skills: string[];
  schedule: Record<string, { start: string; end: string } | null>;
  rating: number;
  imageUrl: string;
}

export interface Service {
  id: string;
  name: string;
  duration: number; // in minutes
  price: number;
  description: string;
}

export interface Appointment {
  id: string;
  userId: string;
  barberId: string;
  serviceIds: string[];
  datetime: Date;
  status: 'scheduled' | 'completed' | 'cancelled';
  cancellationReason?: string;
}

export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  stock: number;
  price: number;
  imageUrl: string;
}

export interface Feedback {
  id: string;
  appointmentId: string;
  rating: number;
  comment: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
}

export interface Order {
    id: string;
    userId: string;
    items: {
        itemId: string;
        quantity: number;
        price: number; // Price at time of purchase
    }[];
    total: number;
    status: 'pending' | 'shipped' | 'delivered' | 'cancelled';
    createdAt: Date;
}
