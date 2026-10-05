import { VerificationDashboard } from '@/client/components/verification/VerificationDashboard';

export const metadata = {
  title: 'Verifier Terminal | ApparelFlow ERP',
  description: 'Gatekeeper Verification Terminal for cut components physical verification and traffic-light compliance.',
};

export default function VerifierPage() {
  return <VerificationDashboard />;
}
