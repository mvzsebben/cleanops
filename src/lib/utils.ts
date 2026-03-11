import { addDays, differenceInCalendarDays, endOfDay, format, isSameDay, startOfDay } from "date-fns";
import clsx, { type ClassValue } from "clsx";
import type { BookingRecord, BookingStatus } from "@/types/app";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function bookingStatusForDates(checkIn: Date, checkOut: Date): BookingStatus {
  const now = new Date();
  if (checkOut.getTime() < now.getTime()) return "completed";
  if (checkIn.getTime() <= now.getTime() && checkOut.getTime() >= now.getTime()) return "active";
  return "upcoming";
}

export function nightsBetween(checkIn: string | Date, checkOut: string | Date) {
  return Math.max(1, differenceInCalendarDays(new Date(checkOut), new Date(checkIn)));
}

export function formatDateTime(value: string | Date) {
  return format(new Date(value), "EEE d MMM, h:mm a");
}

export function formatShortDate(value: string | Date) {
  return format(new Date(value), "EEE d MMM");
}

export function formatTime(value: string | Date) {
  return format(new Date(value), "h:mm a");
}

export function rgba(hex: string, alpha: number) {
  const value = hex.replace("#", "");
  const bigint = Number.parseInt(value, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function buildDateRange(start: Date, days: number) {
  return Array.from({ length: days }, (_, index) => addDays(startOfDay(start), index));
}

export function isBookingOnDate(booking: BookingRecord, date: Date) {
  const checkIn = startOfDay(new Date(booking.check_in));
  const checkOut = startOfDay(new Date(booking.check_out));
  const day = startOfDay(date);
  return day.getTime() >= checkIn.getTime() && day.getTime() < checkOut.getTime();
}

export function bookingStartsOnDate(booking: BookingRecord, date: Date) {
  return isSameDay(new Date(booking.check_in), date);
}

export function bookingEndsOnDate(booking: BookingRecord, date: Date) {
  return isSameDay(addDays(new Date(booking.check_out), -1), date);
}

export function startOfVisibleRange(date: Date) {
  return startOfDay(date);
}

export function endOfVisibleRange(date: Date, days: number) {
  return endOfDay(addDays(startOfDay(date), days - 1));
}
