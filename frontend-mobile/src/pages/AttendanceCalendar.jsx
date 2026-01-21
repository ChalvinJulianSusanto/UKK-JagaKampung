import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    startOfMonth,
    endOfMonth,
    eachDayOfInterval,
    format,
    isSameDay,
    isSameMonth,
    addMonths,
    subMonths,
    startOfWeek,
    endOfWeek,
    isToday,
    isBefore,
    startOfDay,
    parseISO
} from 'date-fns';
import { id } from 'date-fns/locale';
import { ArrowLeft, ChevronLeft, ChevronRight, Heart, Award } from 'lucide-react';
import { attendancesAPI } from '../api';
import MaskedIcon from '../components/MaskedIcon';
import heartIcon from '../assets/heart.png';
import sweetIcon from '../assets/heart.png';
import brokenIcon from '../assets/broken.png';

const AttendanceCalendar = () => {
    const navigate = useNavigate();
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [attendanceData, setAttendanceData] = useState([]);
    const [loading, setLoading] = useState(true);

    // Fetch attendance data
    useEffect(() => {
        fetchAttendanceData();
    }, []);

    const fetchAttendanceData = async () => {
        try {
            setLoading(true);
            const response = await attendancesAPI.getMyAttendanceHistory();
            if (response.success) {
                console.log('Attendance Data:', response.data);
                setAttendanceData(response.data);
            }
        } catch (error) {
            console.error('Error fetching attendance:', error);
        } finally {
            setLoading(false);
        }
    };

    // Get calendar days for selected month
    const monthStart = startOfMonth(selectedDate);
    const monthEnd = endOfMonth(selectedDate);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

    // Check attendance status for a date
    const getAttendanceStatus = (date) => {
        const dayStart = startOfDay(date);
        const attendance = attendanceData.find(a => {
            const attDate = a.date.includes('T') ? parseISO(a.date) : new Date(a.date);
            return isSameDay(startOfDay(attDate), dayStart);
        });

        if (!attendance) {
            return isBefore(dayStart, startOfDay(new Date())) ? 'absent' : 'future';
        }

        return attendance.type === 'masuk' || attendance.type === 'pulang' ? 'attended' : 'absent';
    };

    // Calculate statistics for current month
    const calculateStats = () => {
        const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
        const today = startOfDay(new Date());

        // Days in this month up to and including today
        const validDays = monthDays.filter(day => {
            const dayStart = startOfDay(day);
            return isBefore(dayStart, today) || isSameDay(dayStart, today);
        });

        // Count attended days
        const attendedDays = validDays.filter(day => getAttendanceStatus(day) === 'attended').length;

        // Calculate current streak
        // Find the most recent consecutive attendance period
        let streak = 0;
        let currentStreak = 0;

        // Sort days from newest to oldest (today first)
        const sortedDays = [...validDays].sort((a, b) => b - a);

        // First, check if today or most recent days are attended
        let foundAttended = false;
        for (const day of sortedDays) {
            const status = getAttendanceStatus(day);

            if (status === 'attended') {
                currentStreak++;
                foundAttended = true;
            } else if (status === 'absent') {
                // If we haven't found any attended days yet, keep looking
                // If we already found attended days, stop (end of streak)
                if (foundAttended) {
                    break;
                }
                // Otherwise continue looking for the most recent streak
            } else if (status === 'future') {
                // Skip future days
                continue;
            }
        }

        streak = currentStreak;

        // Count missed days (past days that were not attended)
        const missedDays = validDays.filter(day => {
            const status = getAttendanceStatus(day);
            const dayStart = startOfDay(day);
            return status === 'absent' && isBefore(dayStart, today);
        }).length;

        return { attendedDays, streak, missedDays };
    };

    const stats = calculateStats();
    console.log('=== ATTENDANCE CALENDAR DEBUG ===');
    console.log('Calculated Stats:', stats);
    console.log('Today:', format(new Date(), 'dd/MM/yyyy'));
    console.log('=================================');

    // Navigation
    const goToPreviousMonth = () => setSelectedDate(subMonths(selectedDate, 1));
    const goToNextMonth = () => setSelectedDate(addMonths(selectedDate, 1));

    const dayNames = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Memuat kalender...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 sticky top-0 z-10 shadow-lg">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <h1 className="text-xl font-bold">Kalender Kehadiranmu</h1>
                </div>
            </div>

            <div className="p-4 max-w-2xl mx-auto">
                {/* Stats Cards */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                    {/* Total Attended */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-xl p-3 shadow-sm border border-gray-100"
                    >
                        <div className="flex items-center gap-2">
                            <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center">
                                <MaskedIcon src={heartIcon} color="#EC4899" size={24} alt="Heart" />
                            </div>
                            <div>
                                <p className="text-xl font-bold text-gray-800">{stats.attendedDays} hari</p>
                                <p className="text-[10px] text-gray-500"></p>
                            </div>
                        </div>
                    </motion.div>

                    {/* Streak */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-white rounded-xl p-3 shadow-sm border border-gray-100"
                    >
                        <div className="flex items-center gap-2">
                            <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                                <Award size={24} className="text-yellow-500" />
                            </div>
                            <div>
                                <p className="text-xl font-bold text-gray-800">{stats.streak} hari</p>
                                <p className="text-[10px] text-gray-500"></p>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Calendar Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 mb-4"
                >
                    {/* Month Navigator */}
                    <div className="flex items-center justify-between mb-3">
                        <button
                            onClick={goToPreviousMonth}
                            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <ChevronLeft size={20} className="text-gray-600" />
                        </button>
                        <h2 className="text-base font-bold text-gray-800">
                            {format(selectedDate, 'MMMM yyyy', { locale: id })}
                        </h2>
                        <button
                            onClick={goToNextMonth}
                            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <ChevronRight size={20} className="text-gray-600" />
                        </button>
                    </div>

                    {/* Day Names */}
                    <div className="grid grid-cols-7 gap-1.5 mb-2">
                        {dayNames.map((day, idx) => (
                            <div key={idx} className="text-center text-[11px] font-semibold text-gray-600">
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Calendar Grid */}
                    <div className="grid grid-cols-7 gap-1.5">
                        {calendarDays.map((day, idx) => {
                            const status = getAttendanceStatus(day);
                            const isCurrentMonth = isSameMonth(day, selectedDate);
                            const isTodayDate = isToday(day);
                            const dateNumber = format(day, 'd');

                            return (
                                <div
                                    key={idx}
                                    className="relative flex items-center justify-center py-2"
                                >
                                    {status === 'attended' ? (
                                        // Attended: Heart icon with date number inside
                                        <div className={`relative w-8 h-8 flex items-center justify-center ${isTodayDate ? '' : ''
                                            }`}>
                                            <MaskedIcon
                                                src={sweetIcon}
                                                color="#2563EB"
                                                size={34}
                                                alt="Attended"
                                            />
                                            <span className="absolute inset-0 flex items-center justify-center text-white text-xs font-light">
                                                {dateNumber}
                                            </span>
                                        </div>
                                    ) : status === 'absent' ? (
                                        isTodayDate ? (
                                            // Today but not attended: Heart with static border (no animation)
                                            <div className="relative w-10 h-10 flex items-center justify-center">
                                                {/* Static border wrapper with inline style */}
                                                <div
                                                    className="absolute inset-0 rounded-xl"
                                                    style={{
                                                        border: '3px dashed #2563eb'
                                                    }}
                                                />
                                                {/* Heart icon with date */}
                                                <div className="relative w-8 h-8 flex items-center justify-center">
                                                    <MaskedIcon
                                                        src={sweetIcon}
                                                        color="#7e93ffff"
                                                        size={34}
                                                        alt="Today"
                                                    />
                                                    <span className="absolute inset-0 flex items-center justify-center text-white text-xs font-light">
                                                        {dateNumber}
                                                    </span>
                                                </div>
                                            </div>
                                        ) : (
                                            // Past absent: Icon with background and date number inside
                                            <div className="w-8 h-8 bg-gray-200 rounded-lg flex items-center justify-center relative">
                                                <MaskedIcon
                                                    src={brokenIcon}
                                                    color="#d5d6d6ff"
                                                    size={28}
                                                    alt="Absent"
                                                />
                                                <span className="absolute inset-0 flex items-center justify-center text-blue-800 text-xs font-bold">
                                                    {dateNumber}
                                                </span>
                                            </div>
                                        )
                                    ) : (
                                        // Future: Only date number, no icon
                                        <span className={`text-sm font-medium ${!isCurrentMonth ? 'text-gray-300' :
                                            isTodayDate ? 'text-blue-600 font-bold border-2 border-blue-500 rounded-lg w-8 h-8 flex items-center justify-center' :
                                                'text-gray-700'
                                            }`}>
                                            {dateNumber}
                                        </span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </motion.div>

                {/* Missed Days Summary */}
                {stats.missedDays > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-white p-1  border border-gray-200"
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-10 h-10  rounded-full flex items-center justify-center">
                                    <MaskedIcon src={brokenIcon} color="#94A3B8" size={24} alt="Sad" />
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-gray-800">
                                        {stats.missedDays} hari kehadiranmu terlewat
                                    </p>
                                </div>
                            </div>

                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
};

export default AttendanceCalendar;
