const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, 'Judul kegiatan harus diisi'],
            trim: true,
        },
        description: {
            type: String,
            required: function () {
                return this.category === 'activity';
            },
            trim: true,
        },
        time: {
            type: String,
            required: function () {
                return this.category === 'activity';
            },
        },
        location: {
            type: String,
            required: function () {
                return this.category === 'activity';
            },
            trim: true,
        },
        photo: {
            type: String,
            default: null,
        },
        documentation: {
            type: [String],
            default: [],
        },
        rt: {
            type: String,
            enum: ['01', '02', '03', '04', '05', '06', 'RW-01'],
            required: [true, 'RT harus dipilih'],
        },
        eventDate: {
            type: Date,
            required: [true, 'Tanggal kegiatan harus diisi'],
        },
        status: {
            type: String,
            enum: ['upcoming', 'ongoing', 'completed'],
            default: 'upcoming',
        },
        category: {
            type: String,
            enum: ['activity', 'documentation'],
            default: 'activity',
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

// Index untuk optimasi query
activitySchema.index({ rt: 1, eventDate: -1 });
activitySchema.index({ status: 1 });

module.exports = mongoose.model('Activity', activitySchema);
