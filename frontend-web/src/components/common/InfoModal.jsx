import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { X, ChevronDown, ChevronUp, BookOpen, Users, Calendar, ClipboardCheck, FileBarChart } from 'lucide-react';
import { useState } from 'react';

const FAQItem = ({ question, answer, icon: Icon }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-gray-100 last:border-none">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between py-4 px-2 hover:bg-gray-50/50 transition-colors text-left group"
      >
        <div className="flex items-center gap-4">
          <div className={`p-2 rounded-lg transition-colors ${isOpen ? 'bg-gray-100 text-gray-800' : 'bg-gray-50 text-gray-500 group-hover:text-gray-700'}`}>
            <Icon size={20} strokeWidth={1.5} />
          </div>
          <span className={`font-medium transition-colors ${isOpen ? 'text-gray-900' : 'text-gray-600 group-hover:text-gray-900'}`}>
            {question}
          </span>
        </div>
        <div className={`transform transition-transform duration-200 text-gray-400 ${isOpen ? 'rotate-180' : ''}`}>
          <ChevronDown size={18} />
        </div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="pb-4 pl-[3.25rem] pr-4 text-sm text-gray-500 leading-relaxed">
              {answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const InfoModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const faqData = [
    {
      question: "Bagaimana cara mengelola Data Warga?",
      answer: "Masuk ke menu 'Data Warga' di sidebar. Anda dapat melihat daftar warga, menambahkan warga baru dengan tombol 'Tambah', serta mengedit atau menghapus data warga yang sudah ada. Pastikan data NIK dan nomor telepon valid.",
      icon: Users
    },
    {
      question: "Bagaimana cara membuat Jadwal Jaga?",
      answer: "Akses menu 'Jadwal Jaga'. Klik tombol 'Buat Jadwal' atau 'Generate Otomatis' untuk membuat jadwal secara acak. Anda juga bisa mengatur shift dan petugas secara manual sesuai kebutuhan RT.",
      icon: Calendar
    },
    {
      question: "Bagaimana memantau Kehadiran (Absensi)?",
      answer: "Buka menu 'Kehadiran'. Di sini Anda dapat melihat status kehadiran petugas jaga secara real-time (Hadir, Izin, atau Alpha). Bukti foto dan lokasi petugas juga dapat dilihat detailnya.",
      icon: ClipboardCheck
    },
    {
      question: "Cara mengunduh Laporan Kegiatan?",
      answer: "Masuk ke menu 'Laporan'. Pilih periode laporan yang diinginkan (Harian, Bulanan). Klik tombol 'Export' untuk mengunduh laporan dalam format PDF atau Excel untuk arsip administrasi.",
      icon: FileBarChart
    }
  ];

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-[60] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-white/50 overflow-hidden flex flex-col max-h-[85vh]"
            >
              {/* Header */}
              <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-50 rounded-xl text-gray-800">
                    <BookOpen size={24} strokeWidth={1.5} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 tracking-tight">Panduan Admin</h2>
                    <p className="text-sm text-gray-500 font-medium">Pusat bantuan & informasi JagaKampung</p>
                  </div>
                </div>
                <button 
                  onClick={onClose}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-full transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
                <div className="space-y-1">
                  {faqData.map((item, index) => (
                    <FAQItem key={index} {...item} />
                  ))}
                </div>
                
                {/* Footer Note */}
                <div className="mt-8 p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <p className="text-xs text-gray-500 text-center leading-relaxed">
                    Jika Anda mengalami kendala teknis lainnya, silakan hubungi tim pengembang atau administrator sistem utama.
                    <br/>
                    <span className="font-semibold text-gray-700">Versi 1.0.0 &bull; JagaKampung Admin Dashboard</span>
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default InfoModal;
