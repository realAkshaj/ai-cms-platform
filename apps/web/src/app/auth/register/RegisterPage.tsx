'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { API_URL } from '../../../lib/config';

interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  general?: string;
}

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    } else if (formData.firstName.trim().length < 2) {
      newErrors.firstName = 'First name must be at least 2 characters';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    } else if (formData.lastName.trim().length < 2) {
      newErrors.lastName = 'Last name must be at least 2 characters';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(formData.password)) {
      newErrors.password = 'Password must contain uppercase, lowercase, number, and special character';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          email: formData.email.trim().toLowerCase(),
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        router.push('/auth/login?message=Registration successful! Please log in with your new account.');
      } else {
        if (data.message) {
          if (data.message.includes('email') && data.message.includes('already')) {
            setErrors({ email: 'An account with this email already exists' });
          } else {
            setErrors({ general: data.message });
          }
        } else {
          setErrors({ general: 'Registration failed. Please try again.' });
        }
      }
    } catch (error) {
      console.error('Registration error:', error);
      setErrors({ general: 'Network error. Please check your connection and try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const renderField = (
    label: string,
    name: string,
    type: string,
    placeholder: string,
    error?: string,
    isPassword?: boolean,
    showPw?: boolean,
    togglePw?: () => void
  ) => (
    <div>
      <label style={{
        display: 'block',
        fontSize: '13px',
        fontWeight: '500',
        color: 'var(--text-secondary)',
        marginBottom: '8px',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
      }}>
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        <input
          type={isPassword ? (showPw ? 'text' : 'password') : type}
          name={name}
          value={formData[name as keyof typeof formData]}
          onChange={handleInputChange}
          placeholder={placeholder}
          className={`glass-input ${error ? 'glass-input-error' : ''}`}
          style={isPassword ? { paddingRight: '44px' } : undefined}
        />
        {isPassword && togglePw && (
          <button
            type="button"
            onClick={togglePw}
            style={{
              position: 'absolute',
              right: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              fontSize: '14px',
              padding: '4px',
            }}
          >
            {showPw ? 'Hide' : 'Show'}
          </button>
        )}
      </div>
      {error && (
        <p style={{ color: 'var(--accent-red)', fontSize: '12px', margin: '6px 0 0 0' }}>
          {error}
        </p>
      )}
    </div>
  );

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
    }}>
      <div style={{ maxWidth: '460px', width: '100%' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '56px',
            height: '56px',
            background: 'linear-gradient(135deg, var(--accent-violet), var(--accent-cyan))',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            boxShadow: '0 4px 20px var(--glow-violet)',
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="8.5" cy="7" r="4"/>
              <line x1="20" y1="8" x2="20" y2="14"/>
              <line x1="23" y1="11" x2="17" y2="11"/>
            </svg>
          </div>
          <h2 style={{
            fontSize: '28px',
            fontWeight: '700',
            color: 'var(--text-primary)',
            margin: '0 0 8px 0',
            letterSpacing: '-0.02em',
          }}>
            Create your account
          </h2>
          <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '15px' }}>
            Start managing your content with AI
          </p>
        </div>

        {/* Registration Form */}
        <div className="glass-card" style={{ padding: '32px 28px' }}>
          <form onSubmit={handleSubmit}>
            {/* General Error */}
            {errors.general && (
              <div className="alert alert-error" style={{ marginBottom: '24px' }}>
                {errors.general}
              </div>
            )}

            {/* Name Fields */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '16px',
              marginBottom: '20px'
            }}>
              {renderField('First Name', 'firstName', 'text', 'John', errors.firstName)}
              {renderField('Last Name', 'lastName', 'text', 'Doe', errors.lastName)}
            </div>

            {/* Email Field */}
            <div style={{ marginBottom: '20px' }}>
              {renderField('Email', 'email', 'email', 'you@example.com', errors.email)}
            </div>

            {/* Password Field */}
            <div style={{ marginBottom: '20px' }}>
              {renderField('Password', 'password', 'password', 'Min. 8 characters', errors.password, true, showPassword, () => setShowPassword(!showPassword))}
              <p style={{
                color: 'var(--text-muted)',
                fontSize: '12px',
                margin: '6px 0 0 0',
                lineHeight: '1.4'
              }}>
                Must contain uppercase, lowercase, number, and special character
              </p>
            </div>

            {/* Confirm Password Field */}
            <div style={{ marginBottom: '28px' }}>
              {renderField('Confirm Password', 'confirmPassword', 'password', 'Re-enter password', errors.confirmPassword, true, showConfirmPassword, () => setShowConfirmPassword(!showConfirmPassword))}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="btn-gradient"
              style={{ width: '100%', padding: '14px' }}
            >
              {isLoading ? (
                <>
                  <span className="spinner spinner-sm" />
                  Creating account...
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          {/* Login Link */}
          <div style={{ marginTop: '24px', textAlign: 'center' }}>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: 0 }}>
              Already have an account?{' '}
              <Link href="/auth/login" className="link" style={{ fontWeight: '500' }}>
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
