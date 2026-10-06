// Drivers page (Member 01): register, list, edit, block/unblock and delete driver accounts.
import { useCallback, useEffect, useState } from 'react';
import { Ban, Pencil, Trash2, UserPlus } from 'lucide-react';
import PageHeader from '../../components/layout/PageHeader';
import DataTable from '../../components/ui/DataTable';
import Button from '../../components/ui/Button';
import StatusBadge from '../../components/ui/StatusBadge';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { useToast } from '../../components/ui/Toast';
import { createDriver, deleteDriver, fetchDrivers, updateDriver } from './driverApi';
import DriverFormModal from './DriverFormModal';

const BLOCKED_STATUS = 'blocked';
const ACTIVE_STATUS = 'active';

/**
 * Admin driver management. Drivers never self-register, so this page is the only way to create one.
 * @returns {import('react').JSX.Element} The page.
 */
export default function DriversPage() {
  const { showSuccessToast, showErrorToast } = useToast();
  const [drivers, setDrivers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadErrorMessage, setLoadErrorMessage] = useState('');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [driverBeingEdited, setDriverBeingEdited] = useState(null);
  const [serverFieldErrors, setServerFieldErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  const [driverPendingDeletion, setDriverPendingDeletion] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Bumping this re-runs the load effect; the effect itself never sets state synchronously.
  const [reloadCounter, setReloadCounter] = useState(0);
  const loadDrivers = useCallback(() => setReloadCounter((previousCount) => previousCount + 1), []);

  useEffect(() => {
    let isEffectActive = true;
    fetchDrivers()
      .then((driverPage) => {
        if (isEffectActive) {
          setDrivers(driverPage.drivers);
          setLoadErrorMessage('');
        }
      })
      .catch((loadError) => {
        if (isEffectActive) setLoadErrorMessage(loadError.message);
      })
      .finally(() => {
        if (isEffectActive) setIsLoading(false);
      });
    // Ignore a reply that arrives after the page has moved on.
    return () => {
      isEffectActive = false;
    };
  }, [reloadCounter]);

  const openRegisterForm = () => {
    setDriverBeingEdited(null);
    setServerFieldErrors({});
    setIsFormOpen(true);
  };

  const openEditForm = (driverRow) => {
    setDriverBeingEdited(driverRow);
    setServerFieldErrors({});
    setIsFormOpen(true);
  };

  const saveDriver = async (driverForm) => {
    setIsSaving(true);
    setServerFieldErrors({});
    try {
      if (driverBeingEdited) {
        await updateDriver(driverBeingEdited.id, {
          fullName: driverForm.fullName,
          licenseNumber: driverForm.licenseNumber,
          nic: driverForm.nic,
        });
        showSuccessToast('Driver updated.');
      } else {
        await createDriver(driverForm);
        showSuccessToast('Driver registered.');
      }
      setIsFormOpen(false);
      loadDrivers();
    } catch (saveError) {
      setServerFieldErrors(saveError.fieldErrors || {});
      // Field-level problems are shown inside the form, so only surface anything else as a toast.
      if (Object.keys(saveError.fieldErrors || {}).length === 0) showErrorToast(saveError.message);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleDriverStatus = async (driverRow) => {
    const isCurrentlyBlocked = driverRow.userId?.status === BLOCKED_STATUS;
    try {
      await updateDriver(driverRow.id, { status: isCurrentlyBlocked ? ACTIVE_STATUS : BLOCKED_STATUS });
      showSuccessToast(isCurrentlyBlocked ? 'Driver unblocked.' : 'Driver blocked.');
      loadDrivers();
    } catch (statusError) {
      showErrorToast(statusError.message);
    }
  };

  const confirmDeleteDriver = async () => {
    setIsDeleting(true);
    try {
      await deleteDriver(driverPendingDeletion.id);
      showSuccessToast('Driver deleted.');
      setDriverPendingDeletion(null);
      loadDrivers();
    } catch (deleteError) {
      showErrorToast(deleteError.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const driverColumns = [
    {
      key: 'fullName',
      header: 'Driver',
      renderCell: (driverRow) => (
        <>
          <div>{driverRow.userId?.fullName}</div>
          <div className="text-caption text-muted">{driverRow.userId?.email}</div>
        </>
      ),
    },
    { key: 'mobile', header: 'Mobile', renderCell: (driverRow) => driverRow.userId?.mobile },
    { key: 'licenseNumber', header: 'Licence' },
    { key: 'nic', header: 'NIC' },
    {
      key: 'status',
      header: 'Status',
      renderCell: (driverRow) =>
        driverRow.userId?.status === BLOCKED_STATUS ? (
          <StatusBadge status="cancelled" label="Blocked" />
        ) : (
          <StatusBadge status="active" label="Active" />
        ),
    },
  ];

  // Every row shows the same three buttons, so each one names its driver for screen readers.
  const rowActions = [
    {
      label: 'Edit',
      icon: Pencil,
      onClick: openEditForm,
      buildAriaLabel: (driverRow) => `Edit ${driverRow.userId?.fullName}`,
    },
    {
      label: 'Block / Unblock',
      icon: Ban,
      onClick: toggleDriverStatus,
      buildAriaLabel: (driverRow) =>
        driverRow.userId?.status === BLOCKED_STATUS
          ? `Unblock ${driverRow.userId?.fullName}`
          : `Block ${driverRow.userId?.fullName}`,
    },
    {
      label: 'Delete',
      icon: Trash2,
      variant: 'text',
      onClick: (driverRow) => setDriverPendingDeletion(driverRow),
      buildAriaLabel: (driverRow) => `Delete ${driverRow.userId?.fullName}`,
    },
  ];

  return (
    <>
      <PageHeader
        title="Drivers"
        subtitle="Register drivers, edit their documents and block or remove accounts"
        actions={<Button label="Register driver" icon={UserPlus} onClick={openRegisterForm} />}
      />

      <DataTable
        caption="Registered drivers and their licence details"
        columns={driverColumns}
        rows={drivers}
        isLoading={isLoading}
        errorMessage={loadErrorMessage}
        onRetry={loadDrivers}
        emptyTitle="No drivers registered yet"
        emptyMessage="Register your first driver so they can start running trips."
        rowActions={rowActions}
      />

      <DriverFormModal
        key={`${isFormOpen}-${driverBeingEdited?.id || 'new'}`}
        isOpen={isFormOpen}
        driverBeingEdited={driverBeingEdited}
        serverFieldErrors={serverFieldErrors}
        isSaving={isSaving}
        onSubmit={saveDriver}
        onClose={() => setIsFormOpen(false)}
      />

      <ConfirmDialog
        isOpen={Boolean(driverPendingDeletion)}
        title="Delete this driver?"
        message={`This permanently removes ${driverPendingDeletion?.userId?.fullName || 'the driver'} and their account. This cannot be undone.`}
        confirmLabel="Delete driver"
        isDestructive
        isConfirming={isDeleting}
        onConfirm={confirmDeleteDriver}
        onCancel={() => setDriverPendingDeletion(null)}
      />
    </>
  );
}
