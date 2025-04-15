import express from 'express';
import { FerryController } from '../controllers/ferryController';
import { requireAdmin, extractUserFromHeaders } from '../middlewares/userHeadersMiddleware';
import { validateSessionKey } from '../middlewares/sessionMiddleware';

const router = express.Router();

router.use(validateSessionKey);
router.use(extractUserFromHeaders);

router.post('/search', FerryController.search);
router.post('/compute_charges', FerryController.computeCharges);
router.post('/hold_booking', FerryController.holdBooking);
router.post('/create_ticket', FerryController.createTicket);
router.post('/get_tickets', FerryController.getTickets);
router.post('/confirm_booking', FerryController.confirmBooking);
router.post('/void-booking/:transactionId', FerryController.voidBooking);
router.post('/hydrate_transactions', requireAdmin, FerryController.hydrateTransactions);
router.get('/view_ticket/:barkotaTransactionId', FerryController.viewTicket);

export default router;