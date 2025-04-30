import express from 'express';
import { FerryController } from '../controllers/ferryController';
import { authenticateJWT } from '../middlewares/authMiddleware';

const router = express.Router();

// Public endpoints (no authentication required)
router.post('/search', FerryController.search);
router.post('/compute_charges', FerryController.computeCharges);

// Protected endpoints (require user to be logged in)
router.post('/hold_booking', authenticateJWT, FerryController.holdBooking);
router.post('/create_ticket', authenticateJWT, FerryController.createTicket);
router.post('/get_tickets', authenticateJWT, FerryController.getTickets);
router.post('/confirm_booking', authenticateJWT, FerryController.confirmBooking);
router.post('/void-booking/:transactionId', authenticateJWT, FerryController.voidBooking);
router.get('/view_ticket/:barkotaTransactionId', authenticateJWT, FerryController.viewTicket);

// Admin-only (still requires user to be authenticated, admin check done in controller)
router.post('/hydrate_transactions', authenticateJWT, FerryController.hydrateTransactions);

export default router;