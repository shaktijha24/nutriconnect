import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="container-x flex flex-col items-center py-32 text-center">
      <p className="font-display text-7xl font-semibold text-brand-600">404</p>
      <h1 className="mt-4 text-xl font-semibold">We couldn&apos;t find that page</h1>
      <Link href="/" className="btn-primary mt-6">Back to home</Link>
    </div>
  );
}
