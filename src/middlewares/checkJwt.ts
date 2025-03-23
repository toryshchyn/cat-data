import { expressjwt } from 'express-jwt';
import jwksRsa from 'jwks-rsa';
import { RequestHandler } from 'express';
import dotenv from 'dotenv';
dotenv.config();

const domain = process.env.AUTH0_DOMAIN; 
const audience = process.env.AUTH0_AUDIENCE; 
console.log('issuer:', domain);
export const checkJwt: RequestHandler = expressjwt({
    secret: jwksRsa.expressJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: `${domain}.well-known/jwks.json`,
    }),
    audience: audience,
    issuer: `${domain}`,
    algorithms: ['RS256'],
});
