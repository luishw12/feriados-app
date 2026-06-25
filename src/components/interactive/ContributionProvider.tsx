import { useEffect, useState, useCallback } from 'react';
import ContributionModal from '@/components/interactive/ContributionModal';
import type { ContributionOpenDetail } from '@/lib/contributions';
import { OPEN_CONTRIBUTION_EVENT } from '@/lib/contributions';

export default function ContributionProvider() {
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState<ContributionOpenDetail | null>(null);

  useEffect(() => {
    function handleOpen(event: Event) {
      const customEvent = event as CustomEvent<ContributionOpenDetail>;
      if (!customEvent.detail?.mode) return;
      setDetail(customEvent.detail);
      setOpen(true);
    }

    window.addEventListener(OPEN_CONTRIBUTION_EVENT, handleOpen);
    return () => window.removeEventListener(OPEN_CONTRIBUTION_EVENT, handleOpen);
  }, []);

  const handleClose = useCallback(() => {
    setOpen(false);
    setDetail(null);
  }, []);

  if (!open || !detail) return null;

  return <ContributionModal detail={detail} onClose={handleClose} />;
}
