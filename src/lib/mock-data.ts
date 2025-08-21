import type { User, Barber, Service, Appointment, InventoryItem, Feedback } from './types';

export const mockUsers: User[] = [
  {
    id: 'user-1',
    displayName: 'Alex Johnson',
    email: 'client@salonflow.com',
    role: 'client',
    phone: '555-0101',
    preferences: ['Estilos Modernos', 'Arreglos de Barba'],
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
    name: 'Javier "La Navaja" Rodriguez',
    skills: ['Cortes Clásicos', 'Degradados (Fades)', 'Afeitados con Toalla Caliente'],
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
    name: 'Sam "El Estilista" Chen',
    skills: ['Estilos Modernos', 'Coloración', 'Esculpido de Barba'],
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
  { id: 'service-1', name: 'Corte de Pelo Clásico', duration: 30, price: 35, description: "Un corte atemporal adaptado a tu estilo." },
  { id: 'service-2', name: 'Corte Degradado (Skin Fade)', duration: 45, price: 45, description: "Un degradado experto hasta la piel para un look nítido." },
  { id: 'service-3', name: 'Arreglo de Barba y Perfilado', duration: 20, price: 25, description: "Mantén tu barba en su mejor forma." },
  { id: 'service-4', name: 'Afeitado con Toalla Caliente', duration: 40, price: 50, description: "Una experiencia de afeitado lujosa y apurada." },
  { id: 'service-5', name: 'Corte para Niños', duration: 25, price: 28, description: "Un corte paciente y con estilo para los más pequeños." },
];

const now = new Date();
export const mockAppointments: Appointment[] = [
  {
    id: 'appt-1',
    userId: 'user-1',
    barberId: 'barber-1',
    serviceIds: ['service-1', 'service-3'],
    datetime: new Date(new Date().setDate(new Date().getDate() + 2)),
    status: 'scheduled',
  },
  {
    id: 'appt-2',
    userId: 'user-1',
    barberId: 'barber-2',
    serviceIds: ['service-2'],
    datetime: new Date(new Date().setDate(new Date().getDate() - 14)),
    status: 'completed',
  },
];

export const mockInventory: InventoryItem[] = [
    { id: 'item-1', sku: 'POM-001', name: 'Pomada de Alta Fijación', stock: 45, price: 22.00, imageUrl: 'https://placehold.co/200x200.png' },
    { id: 'item-2', sku: 'BEA-003', name: 'Aceite Nutritivo para Barba', stock: 60, price: 28.50, imageUrl: 'https://placehold.co/200x200.png' },
    { id: 'item-3', sku: 'SHA-012', name: 'Champú de Menta y Árbol de Té', stock: 32, price: 18.00, imageUrl: 'https://placehold.co/200x200.png' },
    { id: 'item-4', sku: 'STY-007', name: 'Arcilla de Peinado Mate', stock: 15, price: 24.00, imageUrl: 'https://placehold.co/200x200.png' },
];

export const mockFeedback: Feedback[] = [
    { id: 'fb-1', appointmentId: 'appt-2', rating: 5, comment: "¡Sam fue fantástico! El mejor degradado que he tenido. El salón está limpio y tiene un gran ambiente. Definitivamente volveré." },
    { id: 'fb-2', appointmentId: 'appt-3', rating: 3, comment: "El corte de pelo estuvo bien, pero la espera fue un poco larga incluso con cita. La música estaba demasiado alta." },
    { id: 'fb-3', appointmentId: 'appt-4', rating: 4, comment: "Javier es un verdadero profesional. El afeitado con toalla caliente fue increíblemente relajante. Un poco caro pero vale la pena para un capricho." },
];
