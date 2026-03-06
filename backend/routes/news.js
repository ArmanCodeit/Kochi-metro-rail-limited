const express = require('express');
const router = express.Router();
const News = require('../models/News');
const User = require('../models/User');
const { body, validationResult } = require('express-validator');

// Middleware to verify token (simplified)
const verifyToken = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }
    next();
};

// Get all active news
router.get('/all', async (req, res) => {
    try {
        const news = await News.find({ isActive: true })
            .sort({ priority: -1, createdAt: -1 })
            .populate('postedBy', 'fullName email');
        
        res.json(news);
    } catch (error) {
        console.error('Error fetching news:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get news by ID
router.get('/:id', async (req, res) => {
    try {
        const news = await News.findById(req.params.id)
            .populate('postedBy', 'fullName email');
        
        if (!news) {
            return res.status(404).json({ message: 'News not found' });
        }
        
        res.json(news);
    } catch (error) {
        console.error('Error fetching news:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Create news (only for station_master and officer)
router.post('/create', verifyToken, [
    body('title').notEmpty().withMessage('Title is required'),
    body('content').notEmpty().withMessage('Content is required'),
    body('newsType').isIn(['announcement', 'maintenance', 'alert', 'information']),
    body('priority').isIn(['low', 'medium', 'high', 'urgent']).optional()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { title, content, description, newsType, affectedLines, affectedStations, priority, postedById, postedByName, postedByRole } = req.body;

        // Verify user role
        if (!['station_master', 'officer'].includes(postedByRole)) {
            return res.status(403).json({ message: 'Only station masters and officers can post news' });
        }

        const news = await News.create({
            title,
            content,
            description,
            newsType,
            affectedLines: affectedLines || [],
            affectedStations: affectedStations || [],
            priority: priority || 'medium',
            postedBy: postedById,
            postedByName,
            postedByRole,
            isActive: true
        });

        res.status(201).json({
            message: 'News created successfully',
            news
        });

    } catch (error) {
        console.error('Error creating news:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update news (only by creator)
router.put('/:id', verifyToken, async (req, res) => {
    try {
        const { title, content, description, newsType, affectedLines, affectedStations, priority, isActive } = req.body;

        let news = await News.findById(req.params.id);
        if (!news) {
            return res.status(404).json({ message: 'News not found' });
        }

        if (title) news.title = title;
        if (content) news.content = content;
        if (description) news.description = description;
        if (newsType) news.newsType = newsType;
        if (affectedLines) news.affectedLines = affectedLines;
        if (affectedStations) news.affectedStations = affectedStations;
        if (priority) news.priority = priority;
        if (typeof isActive !== 'undefined') news.isActive = isActive;
        news.updatedAt = new Date();

        await news.save();

        res.json({
            message: 'News updated successfully',
            news
        });

    } catch (error) {
        console.error('Error updating news:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete news
router.delete('/:id', verifyToken, async (req, res) => {
    try {
        const news = await News.findByIdAndDelete(req.params.id);
        if (!news) {
            return res.status(404).json({ message: 'News not found' });
        }

        res.json({
            message: 'News deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting news:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Mark news as viewed
router.post('/:id/view', async (req, res) => {
    try {
        const { userId } = req.body;

        const news = await News.findById(req.params.id);
        if (!news) {
            return res.status(404).json({ message: 'News not found' });
        }

        // Check if already viewed
        const alreadyViewed = news.viewedBy.some(v => v.userId.toString() === userId);
        if (!alreadyViewed) {
            news.viewedBy.push({
                userId,
                viewedAt: new Date()
            });
            await news.save();
        }

        res.json({ message: 'News marked as viewed' });

    } catch (error) {
        console.error('Error marking news as viewed:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get news history for user
router.get('/user/:userId', async (req, res) => {
    try {
        const news = await News.find({
            isActive: true,
            'viewedBy.userId': req.params.userId
        }).sort({ createdAt: -1 });

        res.json(news);
    } catch (error) {
        console.error('Error fetching news history:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
