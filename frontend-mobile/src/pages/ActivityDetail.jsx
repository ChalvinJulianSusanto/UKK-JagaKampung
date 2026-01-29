import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, MapPin, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { activitiesAPI } from '../api';
import Loading from '../components/common/Loading';

const ActivityDetail = () => {
    const { id: activityId } = useParams();
    const navigate = useNavigate();
    const [activity, setActivity] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchActivity();
    }, [activityId]);

    const fetchActivity = async () => {
        try {
            setLoading(true);
            const response = await activitiesAPI.getById(activityId);

            if (response.data && response.data.success && response.data.data) {
                setActivity(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching activity:', error);
        } finally {
            setLoading(false);
        }
    };

    const getPhotoUrl = (photoPath) => {
        if (!photoPath) return null;
        if (photoPath.startsWith('http')) return photoPath;

        const apiBaseUrl = (import.meta.env.VITE_API_URL ||
            (window.location.hostname.includes('vercel.app')
                ? 'https://ukk-jagakampung.onrender.com/api'
                : 'http://localhost:5000/api')).replace('/api', '');

        return `${apiBaseUrl}${photoPath}`;
    };

    const getDaysRemaining = (eventDate) => {
        const today = new Date();
        const event = new Date(eventDate);
        const diffTime = event - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) return { text: 'Telah berlalu', isPast: true };
        if (diffDays === 0) return { text: 'Hari ini', isPast: false };
        if (diffDays === 1) return { text: '1 hari lagi', isPast: false };
        return { text: `${diffDays} hari lagi`, isPast: false };
    };

    const getComputedStatus = (activity) => {
        let status = activity.status;
        if (activity.time && activity.eventDate) {
            const now = new Date();
            const eventISODate = new Date(activity.eventDate).toISOString().split('T')[0];
            const todayISODate = now.toISOString().split('T')[0];
            const dateCompare = new Date(eventISODate) - new Date(todayISODate);

            if (dateCompare > 0) status = 'upcoming';
            else if (dateCompare < 0) status = 'completed';
            else {
                const [h, m] = activity.time.split(':');
                const eventTime = new Date();
                eventTime.setHours(h, m, 0);
                status = now >= eventTime ? 'ongoing' : 'upcoming';
            }
        }
        return status;
    };

    const getStatusInfo = (status) => {
        const statusMap = {
            upcoming: { label: 'Akan Datang', color: 'text-blue-700', bg: 'bg-blue-50' },
            ongoing: { label: 'Berlangsung', color: 'text-green-700', bg: 'bg-green-50' },
            completed: { label: 'Selesai', color: 'text-gray-700', bg: 'bg-gray-50' }
        };
        return statusMap[status] || statusMap.upcoming;
    };

    if (loading) {
        return <Loading fullScreen />;
    }

    if (!activity) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen px-4 bg-gray-50">
                <Calendar size={64} className="text-gray-300 mb-4" />
                <h2 className="text-xl font-bold text-gray-800 mb-2">Kegiatan Tidak Ditemukan</h2>
                <p className="text-gray-600 mb-6">Kegiatan yang Anda cari tidak tersedia</p>
                <button
                    onClick={() => navigate(-1)}
                    className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-semibold"
                >
                    Kembali
                </button>
            </div>
        );
    }

    const photoUrl = getPhotoUrl(activity.photo);
    const daysInfo = getDaysRemaining(activity.eventDate);
    const computedStatus = getComputedStatus(activity);
    const statusInfo = getStatusInfo(computedStatus);

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-2xl mx-auto bg-white min-h-screen">
                {/* Hero Banner with Overlay Title and Back Button */}
                <div className="relative w-full bg-black flex justify-center items-center overflow-hidden">
                    {photoUrl ? (
                        <>
                            <img
                                src={photoUrl}
                                alt={activity.title}
                                className="w-full h-auto max-h-[500px] object-contain"
                            />
                            {/* Gradient overlay for back button visibility */}
                            <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-black/60 to-transparent pointer-events-none"></div>
                        </>
                    ) : (
                        <div className="w-full h-64 bg-gradient-to-br from-blue-500 via-blue-600 to-purple-600"></div>
                    )}

                    {/* Back Button Overlay */}
                    <button
                        onClick={() => navigate(-1)}
                        className="absolute top-4 left-4 p-2 rounded-full bg-black/20 backdrop-blur-md hover:bg-black/30 transition-all z-10"
                    >
                        <ArrowLeft size={24} className="text-white" />
                    </button>
                </div>

                {/* Content Container */}
                <div className="px-6 pb-20">
                    {/* Status and Date Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="py-6 space-y-4"
                    >
                        {/* Title - Moved Here */}
                        <h1 className="text-2xl font-bold text-gray-900 leading-tight">
                            {activity.title}
                        </h1>

                        <div className="flex items-center justify-start gap-3">
                            {/* Show status label unless it's "Hari ini" (redundant with "Akan Datang") */}
                            {!(daysInfo.text === 'Hari ini' && computedStatus === 'upcoming') && (
                                <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold ${statusInfo.bg} ${statusInfo.color}`}>
                                    {statusInfo.label}
                                </span>
                            )}

                            {!daysInfo.isPast && computedStatus === 'upcoming' && (
                                <span className="text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg">
                                    {daysInfo.text}
                                </span>
                            )}
                        </div>

                        {/* Date Display */}
                        <div className="flex items-center gap-2 text-gray-700">
                            <Calendar size={18} className="text-gray-500" />
                            <span className="font-semibold text-base">
                                {format(new Date(activity.eventDate), 'dd MMMM yyyy', { locale: id })}
                            </span>
                            {activity.time && (
                                <>
                                    <div className="w-1 h-1 bg-gray-300 rounded-full mx-1"></div>
                                    <Clock size={18} className="text-gray-500" />
                                    <span className="font-semibold text-base">{activity.time} WIB</span>
                                </>
                            )}
                        </div>

                        {/* Location Display */}
                        {(activity.location || activity.rt) && (
                            <div className="flex items-center gap-2 text-gray-700">
                                <MapPin size={18} className="text-gray-500" />
                                <span className="font-medium text-base">
                                    {activity.location ? activity.location : `RT ${activity.rt}`}
                                </span>
                            </div>
                        )}
                    </motion.div>

                    {/* Divider */}
                    <div className="border-t border-gray-200"></div>

                    {/* Description Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="py-6"
                    >
                        <h2 className="text-lg font-bold text-gray-900 mb-4">Deskripsi Kegiatan</h2>
                        <div className="prose prose-sm max-w-none">
                            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap text-base">
                                {activity.description}
                            </p>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default ActivityDetail;
