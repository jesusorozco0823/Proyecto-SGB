import { PrismaClient, type AppointmentStatus, type OrderStatus, type Sentiment } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { parseDisplayTime } from '../src/server/shared/time/schedule-time';

const prisma = new PrismaClient();

const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;

type Window = { start: string; end: string } | null;

function scheduleRows(schedule: Record<string, Window>) {
  return DAYS.map((day, dayOfWeek) => {
    const window = schedule[day];
    return {
      dayOfWeek,
      startMin: window ? parseDisplayTime(window.start) : null,
      endMin: window ? parseDisplayTime(window.end) : null,
    };
  });
}

function daysFromNow(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

async function main() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('La semilla de demostración no se ejecuta en producción.');
  }
  const passwordHash = await bcrypt.hash('password', 12);

  await prisma.feedback.deleteMany();
  await prisma.stockAlert.deleteMany();
  await prisma.waitlistEntry.deleteMany();
  await prisma.dayOff.deleteMany();
  await prisma.holiday.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.session.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.appointmentService.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.dayTurn.deleteMany();
  await prisma.turnTemplate.deleteMany();
  await prisma.dayPlan.deleteMany();
  await prisma.barberService.deleteMany();
  await prisma.lunchPolicy.deleteMany();
  await prisma.barberSchedule.deleteMany();
  await prisma.barber.deleteMany();
  await prisma.service.deleteMany();
  await prisma.inventoryItem.deleteMany();
  await prisma.user.deleteMany();

  await prisma.user.createMany({
    data: [
      {
        id: 'user-superadmin',
        displayName: 'Super Administrador Jesus',
        documentNumber: '00000000',
        passwordHash,
        role: 'superadmin',
        phone: '555-0100',
        avatarUrl: 'https://placehold.co/100x100.png',
      },
      {
        id: 'user-admin',
        displayName: 'Admin Principal Jhon',
        documentNumber: '11111111',
        passwordHash,
        role: 'admin',
        phone: '555-0101',
        avatarUrl: 'https://placehold.co/100x100.png',
      },
      {
        id: 'user-barber',
        displayName: 'Javier Rodriguez (Barbero)',
        documentNumber: '22222222',
        passwordHash,
        role: 'barber',
        phone: '555-0102',
        avatarUrl: 'https://placehold.co/100x100.png',
      },
      {
        id: 'user-client',
        displayName: 'Alex Campos (Cliente)',
        documentNumber: '33333333',
        passwordHash,
        role: 'client',
        phone: '555-0103',
        preferences: ['Estilos Modernos', 'Arreglos de Barba'],
        avatarUrl: 'https://placehold.co/100x100.png',
      },
      {
        id: 'user-5',
        displayName: 'Sam Chen (Barbero)',
        documentNumber: '55555555',
        passwordHash,
        role: 'barber',
        phone: '555-0202',
        avatarUrl: 'https://placehold.co/100x100.png',
      },
    ],
  });

  await prisma.barber.create({
    data: {
      id: 'barber-1',
      userId: 'user-barber',
      name: 'Javier "La Navaja" Rodriguez',
      documentNumber: '22222222',
      phone: '555-0201',
      skills: ['Cortes Clásicos', 'Degradados (Fades)', 'Afeitados con Toalla Caliente'],
      rating: 4.9,
      imageUrl: 'https://placehold.co/400x400.png',
      schedules: {
        create: scheduleRows({
          monday: { start: '09:00 AM', end: '06:00 PM' },
          tuesday: { start: '09:00 AM', end: '06:00 PM' },
          wednesday: null,
          thursday: { start: '09:00 AM', end: '06:00 PM' },
          friday: { start: '09:00 AM', end: '08:00 PM' },
          saturday: { start: '10:00 AM', end: '04:00 PM' },
          sunday: null,
        }),
      },
    },
  });

  await prisma.barber.create({
    data: {
      id: 'barber-2',
      userId: 'user-5',
      name: 'Sam "El Estilista" Chen',
      documentNumber: '55555555',
      phone: '555-0202',
      skills: ['Estilos Modernos', 'Coloración', 'Esculpido de Barba'],
      rating: 4.8,
      imageUrl: 'https://placehold.co/400x400.png',
      schedules: {
        create: scheduleRows({
          monday: null,
          tuesday: { start: '10:00 AM', end: '07:00 PM' },
          wednesday: { start: '10:00 AM', end: '07:00 PM' },
          thursday: { start: '10:00 AM', end: '07:00 PM' },
          friday: { start: '10:00 AM', end: '09:00 PM' },
          saturday: { start: '09:00 AM', end: '05:00 PM' },
          sunday: null,
        }),
      },
    },
  });

  const services = [
    { id: 'service-1', name: 'Corte de Pelo Clásico', duration: 30, price: 25000, description: 'Un corte atemporal adaptado a tu estilo.' },
    { id: 'service-2', name: 'Corte Degradado (Skin Fade)', duration: 45, price: 35000, description: 'Un degradado experto hasta la piel para un look nítido.' },
    { id: 'service-3', name: 'Arreglo de Barba y Perfilado', duration: 20, price: 15000, description: 'Mantén tu barba en su mejor forma.' },
    { id: 'service-4', name: 'Afeitado con Toalla Caliente', duration: 40, price: 40000, description: 'Una experiencia de afeitado lujosa y apurada.' },
    { id: 'service-5', name: 'Corte para Niños', duration: 25, price: 18000, description: 'Un corte paciente y con estilo para los más pequeños.' },
  ];
  await prisma.service.createMany({ data: services });

  await prisma.lunchPolicy.create({ data: { id: 'default', durationMinutes: 60, depositAmount: 10000, commissionPercent: 40, lowStockThreshold: 5 } });
  await prisma.barberService.createMany({
    data: [
      { id: 'offer-corte', barberId: 'barber-1', name: 'Corte clásico', durationMinutes: 25, price: 25000, isSpecial: false },
      { id: 'offer-degradado', barberId: 'barber-1', name: 'Degradado', durationMinutes: 25, price: 30000, isSpecial: false },
      { id: 'offer-barba', barberId: 'barber-1', name: 'Arreglo de barba', durationMinutes: 10, price: 12000, isSpecial: false },
      { id: 'offer-toalla', barberId: 'barber-1', name: 'Toalla caliente', durationMinutes: 25, price: 28000, isSpecial: false },
      { id: 'offer-ninos', barberId: 'barber-1', name: 'Corte para niños', durationMinutes: 25, price: 20000, isSpecial: false },
      { id: 'offer-combo', barberId: 'barber-1', name: 'Corte + barba', durationMinutes: 35, price: 40000, isSpecial: false },
      { id: 'offer-especial', barberId: 'barber-1', name: 'Servicio especial', durationMinutes: 45, price: 55000, description: 'Corte, barba, masaje y toalla caliente.', isSpecial: true },
    ],
  });

  const appointments: {
    id: string;
    userId: string;
    barberId: string;
    serviceIds: string[];
    days: number;
    status: AppointmentStatus;
  }[] = [
    { id: 'appt-1', userId: 'user-client', barberId: 'barber-1', serviceIds: ['service-1', 'service-3'], days: 2, status: 'scheduled' },
    { id: 'appt-2', userId: 'user-client', barberId: 'barber-2', serviceIds: ['service-2'], days: -14, status: 'completed' },
    { id: 'appt-3', userId: 'user-client', barberId: 'barber-1', serviceIds: ['service-4'], days: -30, status: 'completed' },
    { id: 'appt-4', userId: 'user-admin', barberId: 'barber-1', serviceIds: ['service-4'], days: -5, status: 'completed' },
  ];

  for (const appointment of appointments) {
    const startsAt = daysFromNow(appointment.days);
    const duration = appointment.serviceIds.reduce((sum, id) => sum + (services.find((service) => service.id === id)?.duration ?? 0), 0);
    await prisma.appointment.create({
      data: {
        id: appointment.id,
        userId: appointment.userId,
        barberId: appointment.barberId,
        startsAt,
        endsAt: new Date(startsAt.getTime() + duration * 60_000),
        status: appointment.status,
        services: {
          create: appointment.serviceIds.map((serviceId) => {
            const service = services.find((item) => item.id === serviceId)!;
            return { serviceId, price: service.price, duration: service.duration };
          }),
        },
      },
    });
  }

  const feedback: { id: string; appointmentId: string; rating: number; comment: string; sentiment: Sentiment }[] = [
    { id: 'fb-1', appointmentId: 'appt-2', rating: 5, comment: '¡Sam fue fantástico! El mejor degradado que he tenido. El salón está limpio y tiene un gran ambiente. Definitivamente volveré.', sentiment: 'positive' },
    { id: 'fb-2', appointmentId: 'appt-3', rating: 3, comment: 'El corte de pelo estuvo bien, pero la espera fue un poco larga incluso con cita. La música estaba demasiado alta.', sentiment: 'neutral' },
    { id: 'fb-3', appointmentId: 'appt-4', rating: 4, comment: 'Javier es un verdadero profesional. El afeitado con toalla caliente fue increíblemente relajante. Un poco caro pero vale la pena para un capricho.', sentiment: 'positive' },
  ];
  await prisma.feedback.createMany({ data: feedback });

  await prisma.inventoryItem.createMany({
    data: [
      { id: 'item-1', sku: 'POM-001', name: 'Pomada de Alta Fijación', stock: 45, price: 22000, imageUrl: 'https://placehold.co/200x200.png' },
      { id: 'item-2', sku: 'BEA-003', name: 'Aceite Nutritivo para Barba', stock: 60, price: 28500, imageUrl: 'https://placehold.co/200x200.png' },
      { id: 'item-3', sku: 'SHA-012', name: 'Champú de Menta y Árbol de Té', stock: 32, price: 18000, imageUrl: 'https://placehold.co/200x200.png' },
      { id: 'item-4', sku: 'STY-007', name: 'Arcilla de Peinado Mate', stock: 15, price: 24000, imageUrl: 'https://placehold.co/200x200.png' },
    ],
  });

  const orders: {
    id: string;
    userId: string;
    total: number;
    status: OrderStatus;
    days: number;
    items: { itemId: string; quantity: number; price: number }[];
  }[] = [
    {
      id: 'order-1',
      userId: 'user-client',
      total: 50500,
      status: 'delivered',
      days: -5,
      items: [
        { itemId: 'item-1', quantity: 1, price: 22000 },
        { itemId: 'item-2', quantity: 1, price: 28500 },
      ],
    },
    {
      id: 'order-2',
      userId: 'user-barber',
      total: 48000,
      status: 'shipped',
      days: -2,
      items: [{ itemId: 'item-4', quantity: 2, price: 24000 }],
    },
    {
      id: 'order-3',
      userId: 'user-client',
      total: 18000,
      status: 'pending',
      days: 0,
      items: [{ itemId: 'item-3', quantity: 1, price: 18000 }],
    },
  ];

  for (const order of orders) {
    await prisma.order.create({
      data: {
        id: order.id,
        userId: order.userId,
        total: order.total,
        status: order.status,
        paymentStatus: order.status === 'pending' ? 'pending' : 'paid',
        createdAt: daysFromNow(order.days),
        items: { create: order.items },
      },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
