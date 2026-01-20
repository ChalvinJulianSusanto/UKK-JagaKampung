import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, X, Ban, Trash2,
  Users as UsersIcon, CheckCircle, ChevronDown
} from 'lucide-react';
import { usersAPI } from '../api/users';
import Button from '../components/common/Button';
import Loading from '../components/common/Loading';
import Pagination from '../components/common/Pagination';
import ConfirmModal from '../components/common/ConfirmModal';
import toast from 'react-hot-toast';
import filterIcon from '../assets/filter.png';

const MaskedIcon = ({ src, color = '#FFFFFF', size = 24, className = '' }) => {
  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        backgroundColor: color,
        maskImage: `url(${src})`,
        WebkitMaskImage: `url(${src})`,
        maskSize: 'contain',
        WebkitMaskSize: 'contain',
        maskRepeat: 'no-repeat',
        WebkitMaskRepeat: 'no-repeat',
        maskPosition: 'center',
        WebkitMaskPosition: 'center',
      }}
    />
  );
};

const RT_OPTIONS = ['01', '02', '03', '04', '05', '06'];

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRT, setFilterRT] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);

  // Custom Dropdown States
  const [isRTOpen, setIsRTOpen] = useState(false);

  // Refs
  const rtRef = useRef(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (rtRef.current && !rtRef.current.contains(event.target)) setIsRTOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [filterRT]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchUsers();
    }, 30000);
    return () => clearInterval(interval);
  }, [filterRT]);

  const fetchUsers = async () => {
    try {
      const params = {};
      if (filterRT) params.rt = filterRT;
      const response = await usersAPI.getAll(params);
      if (response.success) {
        console.log('Users fetched:', response.data.length, 'users');
        // Log users with photos for debugging
        response.data.forEach(user => {
          if (user.photo) {
            console.log(`User ${user.name} has photo:`, user.photo);
          }
        });
        setUsers(response.data);
      }
    } catch (error) {
      toast.error('Gagal memuat data pengguna');
    } finally {
      setLoading(false);
    }
  };

  const handleBanUser = async (id, currentStatus) => {
    try {
      const response = await usersAPI.toggleBan(id);
      if (response.success) {
        toast.success(currentStatus === 'active' ? 'Pengguna dinonaktifkan' : 'Pengguna diaktifkan');
        fetchUsers();
      }
    } catch {
      toast.error('Gagal memperbarui status pengguna');
    }
  };

  const handleDeleteClick = (id) => {
    setUserToDelete(id);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;

    try {
      const response = await usersAPI.delete(userToDelete);
      if (response.success) {
        toast.success('Pengguna berhasil dihapus');
        fetchUsers();
        if (selectedUsers.includes(userToDelete)) {
          setSelectedUsers(prev => prev.filter(id => id !== userToDelete));
        }
      }
    } catch {
      toast.error('Gagal menghapus pengguna');
    } finally {
      setShowDeleteModal(false);
      setUserToDelete(null);
    }
  };

  const handleSelectUser = (userId) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map((u) => u._id));
    }
  };

  const handleBulkDelete = async () => {
    if (window.confirm(`Hapus ${selectedUsers.length} pengguna terpilih?`)) {
      try {
        await Promise.all(selectedUsers.map((id) => usersAPI.delete(id)));
        toast.success('Pengguna berhasil dihapus');
        setSelectedUsers([]);
        fetchUsers();
      } catch {
        toast.error('Gagal menghapus beberapa pengguna');
      }
    }
  };

  const filteredUsers = users
    .filter((u) => u.role !== 'admin')
    .filter(
      (u) =>
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase())
    );

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const currentUsers = filteredUsers.slice(indexOfLastItem - itemsPerPage, indexOfLastItem);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    setSelectedUsers([]);
  };

  if (loading) return <Loading fullScreen />;

  return (
    <div className="space-y-6 mb-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Manajemen Akun</h1>
        <p className="text-gray-500 text-sm mt-1">Kelola data warga terdaftar di sistem.</p>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-2 text-gray-700 font-semibold text-sm">
          <div className="p-2 rounded-lg"><MaskedIcon src={filterIcon} color="#4B5563" size={18} /></div>
          <span>Filter Data</span>
        </div>

        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          <div className="relative group flex-1 md:flex-none">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-gray-400 group-focus-within:text-gray-400 transition-colors" />
            </div>
            <input
              type="text"
              placeholder="Cari nama atau email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-10 py-2.5 w-full bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-gray-500 transition-all shadow-sm text-sm min-w-[240px]"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X size={16} />
              </button>
            )}
          </div>

          <div className="relative flex-1 md:flex-none" ref={rtRef}>
            <button
              onClick={() => setIsRTOpen(!isRTOpen)}
              className="px-4 py-2.5 w-full bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm text-sm appearance-none cursor-pointer hover:bg-gray-100 min-w-[120px] flex items-center justify-between text-gray-700"
            >

              <span>{filterRT ? `RT ${filterRT}` : 'Semua RT'}</span>
              <ChevronDown size={16} className={`text-gray-400 transition-transform ${isRTOpen ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
              {isRTOpen && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="absolute top-full mt-1 w-full bg-white border border-gray-100 rounded-xl shadow-xl z-50 overflow-hidden">
                  <div className="max-h-60 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
                    <div onClick={() => { setFilterRT(''); setIsRTOpen(false); }} className="px-4 py-2.5 text-sm cursor-pointer hover:bg-blue-50 text-gray-600">Semua RT</div>
                    {RT_OPTIONS.map(rt => (
                      <div key={rt} onClick={() => { setFilterRT(rt); setIsRTOpen(false); }} className={`px-4 py-2.5 text-sm cursor-pointer hover:bg-blue-50 ${filterRT === rt ? 'text-primary font-medium bg-primary/5' : 'text-gray-600'}`}>RT {rt}</div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Bulk Action */}
      {selectedUsers.length > 0 && (
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 flex flex-wrap items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <span className="bg-primary text-white text-xs font-bold px-2.5 py-1 rounded-md">
              {selectedUsers.length}
            </span>
            <span className="text-sm text-primary-dark font-medium">Pengguna Dipilih</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleBulkDelete}
              className="flex items-center gap-2 px-4 py-2 bg-white text-red-600 border border-red-100 rounded-lg hover:bg-red-50 text-sm font-medium transition-colors shadow-sm"
            >
              <Trash2 size={16} /> Hapus Terpilih
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {filteredUsers.length === 0 ? (
          <div className="text-center py-20 px-4">
            <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <UsersIcon className="text-gray-300" size={40} />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Belum ada warga</h3>
            <p className="text-gray-500 text-sm max-w-xs mx-auto mt-1">
              Tidak ditemukan data yang sesuai dengan pencarian Anda.
            </p>
          </div>
        ) : (
          <>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    <th className="px-6 py-4 w-12">
                      <input
                        type="checkbox"
                        checked={selectedUsers.length === filteredUsers.length}
                        onChange={handleSelectAll}
                        className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary/20 cursor-pointer"
                      />
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Nama</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Kontak</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Lokasi</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {currentUsers.map((user) => (
                    <tr key={user._id} className="group hover:bg-blue-50/30 transition-colors duration-150">
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(user._id)}
                          onChange={() => handleSelectUser(user._id)}
                          className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary/20 cursor-pointer"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 border border-gray-200 bg-gray-100">
                            {user.photo ? (
                              <img
                                src={user.photo.startsWith('http') ? user.photo : `http://localhost:5000${user.photo}`}
                                alt={user.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  console.log('Photo load failed for user:', user.name, user.photo);
                                  e.target.style.display = 'none';
                                  const fallback = document.createElement('div');
                                  fallback.className = 'w-full h-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm';
                                  fallback.textContent = user.name?.charAt(0).toUpperCase();
                                  e.target.parentElement.appendChild(fallback);
                                }}
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                                {user.name?.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">{user.name}</h4>

                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm text-gray-700">{user.email}</span>
                          <span className="text-xs text-gray-400">{user.phone || '-'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium  text-gray-700 ">
                          RT {user.rt}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${user.status === 'active'
                          ? 'bg-green-50 text-green-700 border-green-200'
                          : 'bg-red-50 text-red-700 border-red-200'
                          }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${user.status === 'active' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                          {user.status === 'active' ? 'Aktif' : 'Banned'}
                        </span>
                      </td>

                      {/* PERBAIKAN WARNA TOMBOL */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleBanUser(user._id, user.status)}
                            className={`p-2 rounded-lg transition-colors ${user.status === 'active'
                              ? 'text-gray-400 hover:text-red-600 hover:bg-red-50' // Active: Hover Merah (Ban)
                              : 'text-red-500 bg-red-50 hover:bg-green-50 hover:text-green-600' // Banned: Hover Hijau (Unban)
                              }`}
                            title={user.status === 'active' ? 'Ban User' : 'Unban User'}
                          >
                            {user.status === 'active' ? <Ban size={16} /> : <CheckCircle size={16} />}
                          </button>

                          <button
                            onClick={() => handleDeleteClick(user._id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Hapus User"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile View */}
            <div className="block md:hidden divide-y divide-gray-100">
              {currentUsers.map((user) => (
                <div key={user._id} className="p-4 flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={selectedUsers.includes(user._id)}
                    onChange={() => handleSelectUser(user._id)}
                    className="mt-1 w-4 h-4 text-primary rounded border-gray-300"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-gray-100 border border-gray-200">
                        {user.photo ? (
                          <img
                            src={user.photo.startsWith('http') ? user.photo : `http://localhost:5000${user.photo}`}
                            alt={user.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              console.log('Photo load failed for user:', user.name, user.photo);
                              e.target.style.display = 'none';
                              const fallback = document.createElement('div');
                              fallback.className = 'w-full h-full bg-blue-500 flex items-center justify-center text-white font-bold text-sm';
                              fallback.textContent = user.name?.charAt(0).toUpperCase();
                              e.target.parentElement.appendChild(fallback);
                            }}
                          />
                        ) : (
                          <div className="w-full h-full bg-blue-500 flex items-center justify-center text-white font-bold text-sm">
                            {user.name?.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900 truncate">{user.name}</h4>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">RT {user.rt}</span>
                      <span className={`text-xs px-2 py-0.5 rounded ${user.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                        {user.status}
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        // Perbaikan logika warna mobile juga
                        className={user.status === 'active' ? 'bg-white text-gray-600 border-gray-300 hover:text-red-600 hover:border-red-300' : 'bg-red-50 text-red-600 border-red-200 hover:bg-green-50 hover:text-green-600 hover:border-green-300'}
                        variant="outline"
                        fullWidth
                        onClick={() => handleBanUser(user._id, user.status)}
                      >
                        {user.status === 'active' ? 'Ban' : 'Aktifkan'}
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        fullWidth
                        onClick={() => handleDeleteClick(user._id)}
                      >
                        Hapus
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-50 bg-gray-50/30">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={filteredUsers.length}
                itemsPerPage={itemsPerPage}
                onPageChange={handlePageChange}
              />
            </div>
          </>
        )}
      </div>

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleConfirmDelete}
        title="Hapus Warga?"
        message="Apakah Anda yakin ingin menghapus data warga ini? Tindakan ini tidak dapat dibatalkan dan warga akan kehilangan akses."
        confirmText="Ya, Hapus"
        cancelText="Batal"
        confirmVariant="danger"
      />
    </div>
  );
};

export default Users;