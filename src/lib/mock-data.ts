import type { User, Barber, Service, Appointment, InventoryItem, Feedback } from './types';

export const mockUsers: User[] = [
  {
    id: 'user-1',
    displayName: 'Alex Johnson',
    email: 'client@salonflow.com',
    role: 'client',
    phone: '555-0101',
    preferences: ['Modern Styles', 'Beard Trims'],
    avatarUrl: 'https://placehold.co/100x100.png',
  },
  {
    id: 'user-2',
    displayName: 'Maria Garcia',
    email: 'admin@salonflow.com',
    role: 'admin',
    phone: '555-0102',
    avatarUrl: 'https://placehold.co/100x100.png',
  },
  {
    id: 'user-3',
    displayName: 'Casey Lee',
    email: 'casey@salonflow.com',
    role: 'barber',
    phone: '555-0103',
    avatarUrl: 'https://placehold.co/100x100.png',
  },
];

export const mockBarbers: Barber[] = [
  {
    id: 'barber-1',
    name: 'Javier "The Blade" Rodriguez',
    skills: ['Classic Cuts', 'Fades', 'Hot Towel Shaves'],
    schedule: {
      monday: { start: '09:00', end: '18:00' },
      tuesday: { start: '09:00', end: '18:00' },
      wednesday: null,
      thursday: { start: '09:00', end: '18:00' },
      friday: { start: '09:00', end: '20:00' },
      saturday: { start: '10:00', end: '16:00' },
      sunday: null,
    },
    rating: 4.9,
    imageUrl: 'https://placehold.co/400x400.png',
  },
  {
    id: 'barber-2',
    name: 'Sam "The Stylist" Chen',
    skills: ['Modern Styles', 'Coloring', 'Beard Sculpting'],
    schedule: {
      monday: null,
      tuesday: { start: '10:00', end: '19:00' },
      wednesday: { start: '10:00', end: '19:00' },
      thursday: { start: '10:00', end: '19:00' },
      friday: { start: '10:00', end: '21:00' },
      saturday: { start: '09:00', end: '17:00' },
      sunday: null,
    },
    rating: 4.8,
    imageUrl: 'https://placehold.co/400x400.png',
  },
];

export const mockServices: Service[] = [
  { id: 'service-1', name: 'Classic Haircut', duration: 30, price: 35, description: "A timeless cut tailored to your style." },
  { id: 'service-2', name: 'Skin Fade', duration: 45, price: 45, description: "Expertly faded down to the skin for a sharp look." },
  { id: 'service-3', name: 'Beard Trim & Shape-up', duration: 20, price: 25, description: "Keep your beard looking its best." },
  { id: 'service-4', name: 'Hot Towel Shave', duration: 40, price: 50, description: "A luxurious and close shave experience." },
  { id: 'service-5', name: 'Kids Cut', duration: 25, price: 28, description: "A patient and stylish cut for the little ones." },
];

const now = new Date();
export const mockAppointments: Appointment[] = [
  {
    id: 'appt-1',
    userId: 'user-1',
    barberId: 'barber-1',
    serviceIds: ['service-1', 'service-3'],
    datetime: new Date(now.setDate(now.getDate() + 2)),
    status: 'scheduled',
  },
  {
    id: 'appt-2',
    userId: 'user-1',
    barberId: 'barber-2',
    serviceIds: ['service-2'],
    datetime: new Date(now.setDate(now.getDate() - 14)),
    status: 'completed',
  },
];

export const mockInventory: InventoryItem[] = [
    { id: 'item-1', sku: 'POM-001', name: 'High-Hold Pomade', stock: 45, price: 22.00, imageUrl: 'https://placehold.co/200x200.png' },
    { id: 'item-2', sku: 'BEA-003', name: 'Nourishing Beard Oil', stock: 60, price: 28.50, imageUrl: 'https://placehold.co/200x200.png' },
    { id: 'item-3', sku: 'SHA-012', name: 'Mint & Tea Tree Shampoo', stock: 32, price: 18.00, imageUrl: 'https://placehold.co/200x200.png' },
    { id: 'item-4', sku: 'STY-007', name: 'Matte Styling Clay', stock: 15, price: 24.00, imageUrl: 'https://placehold.co/200x200.png' },
];

export const mockFeedback: Feedback[] = [
    { id: 'fb-1', appointmentId: 'appt-2', rating: 5, comment: "Sam was fantastic! Best fade I've ever had. The salon is clean and has a great vibe. Will definitely be back." },
    { id: 'fb-2', appointmentId: 'appt-3', rating: 3, comment: "The haircut was okay, but the wait was a bit long even with an appointment. Music was too loud." },
    { id: 'fb-3', appointmentId: 'appt-4', rating: 4, comment: "Javier is a true professional. The hot towel shave was incredibly relaxing. A bit pricey but worth it for a treat." },
];
