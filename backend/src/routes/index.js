const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const testRoutes = require('./testRoutes');
const bugRoutes = require('./bugRoutes');
const { supabaseAdmin } = require('../config/supabase');

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'QualitySync API is running',
    timestamp: new Date().toISOString(),
  });
});

// Debug endpoint to test Supabase connection (development only)
router.get('/debug/supabase', async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({ success: false, message: 'Not found' });
  }

  try {
    // Try to count users to test connection
    const { data, error, count } = await supabaseAdmin
      .from('users')
      .select('id', { count: 'exact', head: true });

    if (error) {
      return res.json({
        success: false,
        message: 'Supabase connection failed',
        error: {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
        },
      });
    }

    res.json({
      success: true,
      message: 'Supabase connection successful',
      userCount: count,
    });
  } catch (err) {
    res.json({
      success: false,
      message: 'Exception testing Supabase',
      error: err.message,
    });
  }
});

// Mount routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/tests', testRoutes);
router.use('/bugs', bugRoutes);

module.exports = router;
