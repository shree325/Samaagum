import express from 'express';
import dotenv from 'dotenv';
import pool from './config/database';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Basic health check route
app.get('/health', async (req, res) => {
    try {
        const result = await pool.query('SELECT NOW()');
        res.json({
            status: 'OK',
            message: 'Samaagum Backend is running and database is connected.',
            dbTime: result.rows[0].now
        });
    } catch (error: any) {
        res.status(500).json({
            status: 'ERROR',
            message: 'Database connection failed',
            error: error.message
        });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
    console.log(`🔗 Health check available at http://localhost:${PORT}/health`);
});