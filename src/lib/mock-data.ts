import type { User, Barber, Service, Appointment, InventoryItem, Feedback, Order } from './types';

// En un entorno de producción, estos datos vendrían de una base de datos.
// Para este prototipo, los definimos aquí para tener datos de inicio.

// ----- USUARIOS DE EJEMPLO -----
// Estos son los usuarios que puedes usar para iniciar sesión.
// La contraseña para todos es "password".
export const mockUsers: User[] = [
  {
    id: 'user-superadmin',
    displayName: 'Super Administrador Jesus',
    documentNumber: '00000000', // Documento para iniciar sesión
    role: 'superadmin',
    phone: '555-0100',
    avatarUrl: 'https://placehold.co/100x100.png',
  },
  {
    id: 'user-admin',
    displayName: 'Admin Principal Jhon',
    documentNumber: '11111111', // Documento para iniciar sesión
    role: 'admin',
    phone: '555-0101',
    avatarUrl: 'https://placehold.co/100x100.png',
  },
  {
    id: 'user-barber',
    displayName: 'Javier Rodriguez (Barbero)',
    documentNumber: '22222222', // Documento para iniciar sesión
    role: 'barber',
    phone: '555-0102',
    avatarUrl: 'https://placehold.co/100x100.png',
  },
  {
    id: 'user-client',
    displayName: 'Alex Campos (Cliente)',
    documentNumber: '33333333', // Documento para iniciar sesión
    role: 'client',
    phone: '555-0103',
    preferences: ['Estilos Modernos', 'Arreglos de Barba'],
    avatarUrl: 'https://placehold.co/100x100.png',
  },
];


export const mockBarbers: Barber[] = [
  {
    id: 'barber-1',
    userId: 'user-barber', // Vinculado a Javier Rodriguez
    name: 'Javier "La Navaja" Rodriguez',
    documentNumber: '22222222',
    phone: '555-0201',
    skills: ['Cortes Clásicos', 'Degradados (Fades)', 'Afeitados con Toalla Caliente'],
    schedule: {
      monday: { start: '09:00 AM', end: '06:00 PM' },
      tuesday: { start: '09:00 AM', end: '06:00 PM' },
      wednesday: null,
      thursday: { start: '09:00 AM', end: '06:00 PM' },
      friday: { start: '09:00 AM', end: '08:00 PM' },
      saturday: { start: '10:00 AM', end: '04:00 PM' },
      sunday: null,
    },
    rating: 4.9,
    imageUrl: 'https://placehold.co/400x400.png',
  },
  {
    id: 'barber-2',
    userId: 'user-5', // ID de usuario de ejemplo
    name: 'Sam "El Estilista" Chen',
    documentNumber: '55555555',
    phone: '555-0202',
    skills: ['Estilos Modernos', 'Coloración', 'Esculpido de Barba'],
    schedule: {
      monday: null,
      tuesday: { start: '10:00 AM', end: '07:00 PM' },
      wednesday: { start: '10:00 AM', end: '07:00 PM' },
      thursday: { start: '10:00 AM', end: '07:00 PM' },
      friday: { start: '10:00 AM', end: '09:00 PM' },
      saturday: { start: '09:00 AM', end: '05:00 PM' },
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

export const mockAppointments: Appointment[] = [
  {
    id: 'appt-1',
    userId: 'user-client',
    barberId: 'barber-1',
    serviceIds: ['service-1', 'service-3'],
    datetime: new Date(new Date().setDate(new Date().getDate() + 2)),
    status: 'scheduled',
  },
  {
    id: 'appt-2',
    userId: 'user-client',
    barberId: 'barber-2',
    serviceIds: ['service-2'],
    datetime: new Date(new Date().setDate(new Date().getDate() - 14)),
    status: 'completed',
    rating: 5,
    comment: "¡Sam fue fantástico! El mejor degradado que he tenido."
  },
  {
    id: 'appt-3',
    userId: 'user-client',
    barberId: 'barber-1',
    serviceIds: ['service-4'],
    datetime: new Date(new Date().setDate(new Date().getDate() - 30)),
    status: 'completed',
    rating: 3,
    comment: "El corte de pelo estuvo bien, pero la espera fue un poco larga incluso con cita."
  },
  {
    id: 'appt-4',
    userId: 'user-admin',
    barberId: 'barber-1',
    serviceIds: ['service-4'],
    datetime: new Date(new Date().setDate(new Date().getDate() - 5)),
    status: 'completed',
    rating: 4,
    comment: "Javier es un verdadero profesional. El afeitado con toalla caliente fue increíblemente relajante. Un poco caro pero vale la pena para un capricho."
  }
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

export const mockOrders: Order[] = [
    {
        id: 'order-1',
        userId: 'user-client',
        items: [
            { itemId: 'item-1', quantity: 1, price: 22.00 },
            { itemId: 'item-2', quantity: 1, price: 28.50 },
        ],
        total: 50.50,
        status: 'delivered',
        createdAt: new Date(new Date().setDate(new Date().getDate() - 5)),
    },
    {
        id: 'order-2',
        userId: 'user-barber',
        items: [
            { itemId: 'item-4', quantity: 2, price: 24.00 },
        ],
        total: 48.00,
        status: 'shipped',
        createdAt: new Date(new Date().setDate(new Date().getDate() - 2)),
    },
    {
        id: 'order-3',
        userId: 'user-client',
        items: [
            { itemId: 'item-3', quantity: 1, price: 18.00 },
        ],
        total: 18.00,
        status: 'pending',
        createdAt: new Date(),
    }
]
