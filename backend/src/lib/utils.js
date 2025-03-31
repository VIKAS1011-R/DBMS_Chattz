import jwt from 'jsonwebtoken';

export const generateTokens = (userID, res) => {
    const token = jwt.sign({ id: userID }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });

    res.cookie('jwt', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV !== 'development',
        sameSite: 'Strict',
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });
    return token;
}