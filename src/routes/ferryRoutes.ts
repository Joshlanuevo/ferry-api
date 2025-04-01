import express from 'express';
import { FerryController } from '../controllers/ferryController';

const router = express.Router();

router.post('/search', FerryController.search);
router.post('/compute_charges', FerryController.computeCharges);
router.post('/hold_booking', FerryController.holdBooking);
router.post('/create_ticket', FerryController.createTicket);
router.post('/get_tickets', FerryController.getTickets);
router.post('/confirm_booking', FerryController.confirmBooking);

export default router;