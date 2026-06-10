import { Request, Response, NextFunction } from 'express';

export interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
    };
}

export const authenticateUser = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    // Basic placeholder for token validation and user extraction.
    // Replace with real JWT logic later.
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    const token = authHeader.split(' ')[1];
    
    // For now, assume the token IS the user ID (mock implementation)
    // Replace with: const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = {
        id: token
    };

    next();
};
