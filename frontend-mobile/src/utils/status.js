export const getAttendanceStatus = (attendance) => {
  if (attendance.status === 'tidak hadir') {
    return {
      label: 'Tidak Hadir',
      variant: 'danger',
    };
  }

  if (attendance.approved === null) {
    return {
      label: 'Pending',
      variant: 'pending',
    };
  }

  if (attendance.approved === true) {
    return {
      label: 'Disetujui',
      variant: 'success',
    };
  }

  if (attendance.approved === false) {
    return {
      label: 'Ditolak',
      variant: 'danger',
    };
  }

  // Default case, though it shouldn't be reached with proper data
  return {
    label: 'Unknown',
    variant: 'default',
  };
};
