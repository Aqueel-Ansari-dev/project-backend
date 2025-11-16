'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';

import { useAuth } from '../../lib/auth-context';
import { Button } from '../../components/ui/button';
import { Input, Label, Select } from '../../components/ui/input';
import { Spinner } from '../../components/ui/spinner';

const SECTOR_OPTIONS = [
  '41-43 : Construction',
  '56 : Accommodation & food service activities',
  '62 : Computer programming, consultancy and related activities',
  '69-75 : Professional, scientific & technical',
  '45 : Wholesale and retail trade and repair of motor vehicles and motorcycles',
  '64-66 : Financial and insurance activities',
  'Other',
];

export default function RegisterPage() {
  const router = useRouter();
  const { register, isAuthenticated, loading: authLoading } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [companyRegNumber, setCompanyRegNumber] = useState('');
  const [sector, setSector] = useState<string>('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.replace('/');
    }
  }, [authLoading, isAuthenticated, router]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await register({
        email,
        password,
        firstName,
        lastName,
        companyName,
        companyRegNumber,
        sector: sector || undefined,
      });
      router.replace('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create account');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-8 shadow-xl">
      <div className="space-y-2 text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-brand">Beyla</p>
        <h1 className="text-2xl font-semibold text-white">Create your SME space</h1>
        <p className="text-sm text-slate-400">Register to provision a live ledger tailored to your company profile.</p>
      </div>
      <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="firstName">First name</Label>
            <Input
              id="firstName"
              name="firstName"
              autoComplete="given-name"
              required
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Last name</Label>
            <Input
              id="lastName"
              name="lastName"
              autoComplete="family-name"
              required
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="companyName">Company name</Label>
          <Input
            id="companyName"
            name="companyName"
            required
            value={companyName}
            onChange={(event) => setCompanyName(event.target.value)}
            placeholder="Acme Analytics Ltd"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="companyReg">Company registration number</Label>
            <Input
              id="companyReg"
              name="companyRegNumber"
              required
              value={companyRegNumber}
              onChange={(event) => setCompanyRegNumber(event.target.value)}
              placeholder="20000008"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sector">Primary sector</Label>
            <Select
              id="sector"
              value={sector}
              onChange={(event) => setSector(event.target.value)}
            >
              <option value="" disabled>
                Select a sector
              </option>
              {SECTOR_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </Select>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Work email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@company.com"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Create a strong password"
              minLength={8}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm password</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Re-enter your password"
              minLength={8}
            />
          </div>
        </div>
        {error ? <p className="text-sm text-rose-300">{error}</p> : null}
        <Button type="submit" disabled={submitting} className="w-full">
          {submitting ? (
            <span className="flex items-center justify-center gap-2">
              <Spinner className="h-4 w-4" />
              Setting up workspace…
            </span>
          ) : (
            'Register'
          )}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-400">
        Already have an account?{' '}
        <Link href="/login" className="font-semibold text-brand hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
