import { object, string, ref } from "yup";

export const loginSchema = object({
    identifier: string().required('Email or username is required.'),
    password: string().min(8, 'Password must be 8 or more characters long').required('Password is required'),
});

export const passwordLessLoginSchema = object({
    email: string().email('Invalid email address.'),
});

export const changePasswordSchema = object({
    currentPassword: string().min(8, 'Password must be 8 or more characters long'),
    newPassword: string()
        .min(8, 'Password must be 8 or more characters long')
        .matches(new RegExp('.*[A-Z].*'), 'At least one uppercase character')
        .matches(new RegExp('.*[a-z].*'), 'At least one lowercase character')
        .matches(new RegExp('.*\\d.*'), 'At least one number'),
    confirmNewPassword: string()
        .matches(new RegExp('.*[A-Z].*'), 'At least one uppercase character')
        .matches(new RegExp('.*[a-z].*'), 'At least one lowercase character')
        .matches(new RegExp('.*\\d.*'), 'At least one number')
        .min(8, 'Password must be 8 or more characters long'),
});

export const forgotPasswordSchema = object({
    email: string().email('Invalid email address.').required('Email is required'),
});

export const resetPasswordSchema = object({
    password: string().required('Password is required')
        .min(8, 'Password must be 8 or more characters long')
        .matches(new RegExp('.*[A-Z].*'), 'At least one uppercase character')
        .matches(new RegExp('.*[a-z].*'), 'At least one lowercase character')
        .matches(new RegExp('.*\\d.*'), 'At least one number'),
    confirmPassword: string()
        .min(8, 'Password must be 8 or more characters long')
        .matches(new RegExp('.*[A-Z].*'), 'At least one uppercase character')
        .matches(new RegExp('.*[a-z].*'), 'At least one lowercase character'),
});

export const registerSchema = object({
    username : string().min(3, 'Username must be 3 or more characters long').required('Username is required'),
    name: string().min(3, 'First name must be 3 or more characters long').required('Name is required'),
    email: string().email('Invalid email address.').required('Email is required'), 
    password: string()
        .min(8, 'Password must be 8 or more characters long')
        .matches(new RegExp('.*[A-Z].*'), 'At least one uppercase character')
        .matches(new RegExp('.*[a-z].*'), 'At least one lowercase character')
        .matches(new RegExp('.*\\d.*'), 'At least one number').required('Password is required'),
    confirmPassword: string()
        .min(8, 'Password must be 8 or more characters long')
        .matches(new RegExp('.*[A-Z].*'), 'At least one uppercase character')
        .matches(new RegExp('.*[a-z].*'), 'At least one lowercase character')
        .matches(new RegExp('.*\\d.*'), 'At least one number')
        .oneOf([ref('password')], 'Passwords must match'),
});

export const updateProfileSchema = object({
    name: string().min(3, 'First name must be 3 or more characters long'),
    email: string().email('Invalid email address.'),
});

export const verifyEmailSchema = object({
    token: string().required('Token is required'),
});

export const verifyEmailResendSchema = object({
    email: string().email('Invalid email address.').required('Email is required'),
});