import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Clock,
  CheckCircle,
  Image as ImageIcon,
  Trash2,
  Eye,
} from 'lucide-react';
import mapsIcon from '../assets/maps.png';
import historyIcon from '../assets/history.png';
import checkCircleIcon from '../assets/check-circle.png';
import clockIcon from '../assets/clock.png';
import calendarIcon from '../assets/kotak.png';
import mapPinIcon from '../assets/map-pin.png';
import xCircleIcon from '../assets/x-circle.png';
import { attendancesAPI } from '../api';
import { Header, Container } from '../components/layout';
import { Card, Badge, Loading, Button, Modal } from '../components/common';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import toast from 'react-hot-toast';

const History = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [attendances, setAttendances] = useState([]);
  const [selectedAttendance, setSelectedAttendance] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchAttendances();
  }, []);

  const fetchAttendances = async () => {
    setLoading(true);
    try {
      const response = await attendancesAPI.getMyAttendanceHistory();
      if (response.success) {
        const sortedData = response.data.sort((a, b) => 
          new Date(b.date) - new Date(a.date)
        );
        setAttendances(sortedData);
      }
    } catch (error) {
      console.error('Error fetching attendances:', error);
      toast.error('Gagal memuat riwayat kehadiran');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = (attendance) => {
    setSelectedAttendance(attendance);
    setShowDetailModal(true);
  };

  const handleViewPhoto = (attendance) => {
    setSelectedAttendance(attendance);
    setShowPhotoModal(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    
    setDeleting(true);
    try {
      const response = await attendancesAPI.delete(deleteTarget._id);
      if (response.success) {
        toast.success('Riwayat kehadiran berhasil dihapus');
        setShowDeleteConfirm(false);
        setDeleteTarget(null);
        setShowDetailModal(false);
        fetchAttendances();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Gagal menghapus riwayat kehadiran');
    } finally {
      setDeleting(false);
    }
  };

  const openDeleteConfirm = (attendance) => {
    setDeleteTarget(attendance);
    setShowDeleteConfirm(true);
  };

  const getAttendanceStatus = (attendance) => {
    if (attendance.approved) {
      return {
        label: 'Disetujui',
        variant: 'success',
      };
    }
    if (attendance.approvalStatus === 'rejected') {
      return {
        label: 'Ditolak',
        variant: 'error',
      };
    }
    if (attendance.status === 'izin') {
      return {
        label: 'Izin',
        variant: 'warning',
      };
    }
    return { label: 'Pending', variant: 'pending' };
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <Header 
        title="Riwayat Kehadiran" 
        subtitle="Lihat riwayat kehadiran Anda"
        showBack
        onBack={() => navigate('/')}
      />

      <Container>
        {loading ? (
          <Loading size="lg" text="Memuat riwayat..." className="py-20" />
        ) : attendances.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <img src={historyIcon} alt="Riwayat" className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Belum ada riwayat</h3>
            <p className="text-gray-500">Riwayat absensi Anda akan muncul di sini</p>
          </div>
        ) : (
          <div className="space-y-3 mb-20">
            {/* Header Info */}
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-gray-900">Total Riwayat</h3>
              <Badge variant="primary" size="sm">
                {attendances.length} data
              </Badge>
            </div>

            {attendances.map((attendance) => {
              const status = getAttendanceStatus(attendance);
              return (
                <div key={attendance._id}>
                  <Card className="relative">
                    {/* Status Badge - Top Right */}
                    <div className="absolute top-3 right-3">
                      <Badge variant={status.variant} size="sm">
                        {status.label}
                      </Badge>
                    </div>

                  {/* Main Content */}
                  <div className="flex items-start gap-3 mb-3 pr-24">
                    <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <img src={calendarIcon} alt="Calendar" className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 mb-1">
                        {format(new Date(attendance.date), 'EEEE, dd MMMM yyyy', {
                          locale: id,
                        })}
                      </h3>
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <img src={clockIcon} alt="Clock" className="w-4 h-4" />
                        {format(new Date(attendance.createdAt), "HH:mm 'WIB'", {
                          locale: id,
                        })}
                      </div>
                    </div>
                  </div>

                  
                  {/* Action Buttons */}
                  <div className="grid grid-cols-3 gap-2">
                    {/* View Detail Button */}
                    <button
                      onClick={() => handleViewDetail(attendance)}
                      className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium rounded-lg transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Detail
                    </button>

                    {/* View Photo Button */}
                    {attendance.photo ? (
                      <button
                        onClick={() => handleViewPhoto(attendance)}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs bg-green-50 hover:bg-green-100 text-green-700 font-medium rounded-lg transition-colors"
                      >
                        <ImageIcon className="w-3.5 h-3.5" />
                        Foto
                      </button>
                    ) : (
                      <div className="flex items-center justify-center px-3 py-2 text-xs bg-gray-50 text-gray-400 font-medium rounded-lg">
                        <ImageIcon className="w-3.5 h-3.5 mr-1.5" />
                        No Foto
                      </div>
                    )}

                    {/* Delete Button */}
                    <button
                      onClick={() => openDeleteConfirm(attendance)}
                      className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs bg-red-50 hover:bg-red-100 text-red-700 font-medium rounded-lg transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Hapus
                    </button>
                  </div>
                </Card>
                </div>
              );
            })}
          </div>
        )}
      </Container>

      {/* Detail Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title="Detail Kehadiran"
        size="md"
      >
        {selectedAttendance && (
          <div className="space-y-4">
            {/* Date */}
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <img src={calendarIcon} alt="Calendar" className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-500 mb-1">Tanggal</p>
                <p className="font-semibold text-gray-900">
                  {format(new Date(selectedAttendance.date), 'EEEE, dd MMMM yyyy', {
                    locale: id,
                  })}
                </p>
              </div>
            </div>

            {/* Time */}
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                <img src={clockIcon} alt="Clock" className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-500 mb-1">Waktu Absensi</p>
                <p className="font-semibold text-gray-900">
                  {format(new Date(selectedAttendance.createdAt), "HH:mm 'WIB'", {
                    locale: id,
                  })}
                </p>
              </div>
            </div>

            {/* Status */}
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                <img src={checkCircleIcon} alt="Status" className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-500 mb-2">Status Kehadiran</p>
                <Badge variant={getAttendanceStatus(selectedAttendance).variant}>
                  {getAttendanceStatus(selectedAttendance).label}
                </Badge>
              </div>
            </div>

            {/* Reason */}
            {selectedAttendance.reason && (
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
                  <img src={xCircleIcon} alt="Reason" className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-500 mb-1">Alasan</p>
                  <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedAttendance.reason}</p>
                </div>
              </div>
            )}

            {/* Location */}
            {selectedAttendance.location && (
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 bg-teal-50 rounded-lg flex items-center justify-center">
                  <img src={mapPinIcon} alt="Location" className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-500 mb-1">Lokasi</p>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-900 break-all">
                      Lat: {selectedAttendance.location.latitude?.toFixed(6)}
                    </p>
                    <p className="text-sm text-gray-900 break-all">
                      Long: {selectedAttendance.location.longitude?.toFixed(6)}
                    </p>
                    {selectedAttendance.location.accuracy && (
                      <p className="text-xs text-gray-500 mt-1">
                        Akurasi: ±{selectedAttendance.location.accuracy.toFixed(0)}m
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Photo */}
            {selectedAttendance.photo && (
              <div>
                <p className="text-sm text-gray-500 mb-2">Foto Bukti Kehadiran</p>
                <img
                  src={selectedAttendance.photo}
                  alt="Foto bukti"
                  className="w-full rounded-lg cursor-pointer hover:opacity-90 transition-opacity border-2 border-gray-200"
                  onClick={() => handleViewPhoto(selectedAttendance)}
                />
              </div>
            )}

            {/* Approved Date */}
            {selectedAttendance.approved && selectedAttendance.approvedAt && (
              <div className="pt-3 border-t border-gray-200">
                <p className="text-sm text-gray-500">
                  Disetujui pada{' '}
                  {format(
                    new Date(selectedAttendance.approvedAt),
                    "dd MMMM yyyy 'pukul' HH:mm",
                    { locale: id }
                  )}
                </p>
              </div>
            )}

            {/* Delete Button */}
            <div className="pt-3 border-t border-gray-200">
              <Button
                variant="error"
                fullWidth
                onClick={() => openDeleteConfirm(selectedAttendance)}
                icon={<Trash2 size={16} />}
              >
                Hapus Riwayat
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Photo Modal */}
      <Modal
        isOpen={showPhotoModal}
        onClose={() => setShowPhotoModal(false)}
        title="Foto Bukti Kehadiran"
        size="lg"
      >
        {selectedAttendance?.photo && (
          <div className="space-y-3">
            <img
              src={selectedAttendance.photo}
              alt="Foto bukti"
              className="w-full rounded-lg"
            />
            <div className="text-sm text-gray-500 text-center">
              {format(new Date(selectedAttendance.date), 'dd MMMM yyyy', { locale: id })} • 
              {format(new Date(selectedAttendance.createdAt), " HH:mm 'WIB'", { locale: id })}
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => !deleting && setShowDeleteConfirm(false)}
        title="Hapus Riwayat Kehadiran"
        size="sm"
      >
        {deleteTarget && (
          <div className="space-y-4">
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="w-8 h-8 text-red-600" />
              </div>
            </div>
            
            <p className="text-gray-600 text-center">
              Apakah Anda yakin ingin menghapus riwayat kehadiran pada tanggal{' '}
              <strong className="text-gray-900">
                {format(new Date(deleteTarget.date), 'dd MMMM yyyy', { locale: id })}
              </strong>?
            </p>
            
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-sm text-amber-800 text-center">
                ⚠️ Tindakan ini tidak dapat dibatalkan
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <Button
                variant="outline"
                fullWidth
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
              >
                Batal
              </Button>
              <Button
                variant="error"
                fullWidth
                onClick={handleDelete}
                loading={deleting}
                icon={<Trash2 size={16} />}
              >
                {deleting ? 'Menghapus...' : 'Hapus'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default History;