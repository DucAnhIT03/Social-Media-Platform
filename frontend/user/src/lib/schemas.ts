import { z } from 'zod';

export const loginSchema = z.object({
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const registerSchema = z.object({
    firstName: z.string().min(1, 'Họ không được để trống').max(30, 'Họ tối đa 30 ký tự'),
    lastName: z.string().min(1, 'Tên không được để trống').max(30, 'Tên tối đa 30 ký tự'),
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

export type LoginValues = z.infer<typeof loginSchema>;
export type RegisterValues = z.infer<typeof registerSchema>;
