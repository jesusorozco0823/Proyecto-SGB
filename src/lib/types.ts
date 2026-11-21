export type UserRole = 'client' | 'admin' | 'barber' | 'superadmin';

export interface User {
  id: string;
  displayName: string;
  documentNumber: string;
  role: UserRole;
  phone?: string;
  preferences?: string[];
  avatarUrl?: string;
}

export interface Barber {
  id: string;
  userId: string; // Link to the User model
  name: string;
  documentNumber: string;
  phone: string;
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
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show';
  attendance?: 'pending' | 'confirmed' | 'declined';
  depositStatus?: 'waived' | 'pending' | 'paid';
  depositAmount?: number;
  cancellationReason?: string;
  rating?: number;
  comment?: string;
  client?: { id: string; displayName: string; avatarUrl?: string };
  barber?: { id: string; name: string; userId?: string };
  services?: Service[];
}

export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  stock?: number;
  availability?: 'disponible' | 'ultimas' | 'agotado';
  price: number;
  imageUrl: string;
}

export interface Feedback {
  id: string;
  appointmentId: string;
  rating: number;
  comment: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
  user?: { displayName: string; avatarUrl?: string };
}

export interface Order {
    id: string;
    userId: string;
    items: {
        itemId: string;
        quantity: number;
        price: number;
        name?: string;
        imageUrl?: string;
    }[];
    total: number;
    status: 'pending' | 'shipped' | 'delivered' | 'cancelled';
    paymentStatus?: 'pending' | 'paid';
    createdAt: Date;
    user?: { id: string; displayName: string; documentNumber?: string };
}
