// How many inquiries are still open, for the badge on the Inquiries tab. That number is the one an
// administrator works from, so it is worth keeping current rather than reading it once at startup.
//
// There is no count-only endpoint, so this reads the inbox and takes statusCounts.open from it —
// the same payload the Inquiries screen loads anyway. It refreshes on the same interval as the
// passenger app's notification badge, so the admin area adds no new polling rhythm to explain.
import { useEffect, useState } from 'react';
import { NOTIFICATION_POLL_INTERVAL_MS } from '../../../utils/constants';
import { fetchInquiryInbox } from '../services/adminInquiryApi';

const NO_OPEN_INQUIRIES = 0;

/**
 * Returns how many inquiries are open.
 * @returns {number} Open inquiry count, 0 while unknown or unreachable.
 */
export default function useOpenInquiryCount() {
  const [openCount, setOpenCount] = useState(NO_OPEN_INQUIRIES);

  useEffect(() => {
    let isEffectActive = true;

    /**
     * Reads the inbox counts once.
     * @returns {Promise<void>} Resolves when the count has been stored, or the attempt has failed.
     */
    async function countOpenInquiries() {
      try {
        const inbox = await fetchInquiryInbox();
        if (isEffectActive) setOpenCount(inbox.statusCounts?.open || NO_OPEN_INQUIRIES);
      } catch {
        // A badge is not worth an error message. The next tick tries again.
        if (isEffectActive) setOpenCount(NO_OPEN_INQUIRIES);
      }
    }

    countOpenInquiries();
    const countTimerId = setInterval(countOpenInquiries, NOTIFICATION_POLL_INTERVAL_MS);
    return () => {
      isEffectActive = false;
      clearInterval(countTimerId);
    };
  }, []);

  return openCount;
}
