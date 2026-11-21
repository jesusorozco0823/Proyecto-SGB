export type AppointmentSummary = {
  datetime: string;
  barberName: string;
  serviceNames: string[];
};

export interface StatsRepository {
  countAppointments(where: { from: Date; to: Date; barberUserId?: string }): Promise<number>;
  sumCompletedServices(where: { from: Date; to: Date; barberUserId?: string }): Promise<number>;
  sumActiveOrders(where: { from: Date; to: Date }): Promise<number>;
  countNewClients(from: Date): Promise<number>;
  countLowStock(threshold: number): Promise<number>;
  countAdmins(): Promise<number>;
  nextAppointment(userId: string, from: Date): Promise<AppointmentSummary | null>;
  recentCompleted(userId: string, take: number): Promise<AppointmentSummary[]>;
}
