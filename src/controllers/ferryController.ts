import { Request, Response } from 'express';
import AuthService from '../services/authService';
import { fetchFerryData } from '../services/ferrySearchService';
import { computeFerryCharges } from '../services/ferryComputeChargesService';
import { createFerryTicket, getLatestTicket, getVoyageTotalFare } from '../services/ferryCreateTicketService';
import { sendResponse } from '../utils/response';
import { getTrackingId } from '../middlewares/loggerMiddleware';
import logger from '../utils/logger';

export class FerryController {

  static async search(req: Request, res: Response): Promise<void> {
    const trackingId = getTrackingId(req);
    
    try {
      const token = await AuthService.getToken();
      const results = await fetchFerryData(req.body, token, trackingId);
      sendResponse(req, res, true, 200, 'Ferry search completed successfully', results);
    } catch (error) {
      const statusCode = error instanceof Error ? 400 : 500;
      const message = statusCode === 400 && error instanceof Error
        ? (error as Error).message
        : `Internal server error. Please contact our administrator and present this tracking ID: ${trackingId}`;
      sendResponse(req, res, false, statusCode, message, error);
    }
  }

  static async computeCharges(req: Request, res: Response): Promise<void> {
    const trackingId = getTrackingId(req);
    
    try {
      const token = await AuthService.getToken();
      const results = await computeFerryCharges(req.body, token, trackingId);
      
      // Store compute charges result in req.session for later use
      if (req.session) {
        req.session.ferryComputeCharges = results;
      }

      sendResponse(req, res, true, 200, 'Ferry charges computed successfully', results);
    } catch (error) {
      const statusCode = error instanceof Error ? 400 : 500;
      const message = statusCode === 400 && error instanceof Error
        ? (error as Error).message
        : `Internal server error. Please contact our administrator and present this tracking ID: ${trackingId}`;
      sendResponse(req, res, false, statusCode, message, error);
    }
  }

  static async holdBooking(req: Request, res: Response): Promise<void> {
    const trackingId = getTrackingId(req);
    
    try {
      // Return maintenance mode message
      sendResponse(req, res, false, 402, "Ferry Module Is Under Maintenance Mode. We will notify once it's back.", null);
    } catch (error) {
      sendResponse(req, res, false, 500, `Internal server error. Please contact our administrator and present this tracking ID: ${trackingId}`, error);
    }
  }

  static async createTicket(req: Request, res: Response): Promise<void> {
    const trackingId = getTrackingId(req);
    
    try {
      // Get the cached compute charges from session
      const cachedComputeCharges = req.session?.ferryComputeCharges;
      if (!cachedComputeCharges) {
        throw new Error("No cached compute charges found. Please compute charges first.");
      }

      // Get token for API authentication
      const token = await AuthService.getToken();
      
      // Create the ferry ticket
      const ticketResponse = await createFerryTicket(req.body, token, trackingId);
      
      if (!ticketResponse.printUrl) {
        throw new Error("No print URL found in the response.");
      }
      
      // Wait a short time for the ticket to be processed
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Get the latest ticket data
      const ticketDataArray = await getLatestTicket(token, trackingId);

      if (!ticketDataArray || ticketDataArray.length === 0) {
        throw new Error("No ticket data found after creation.");
      }

      const ticketData = ticketDataArray[0];
      
      if (!ticketData || !ticketData.transactionInfo || !ticketData.transactionInfo.bookingReferenceNumber) {
        throw new Error("Invalid ticket data received.");
      }
      
      const confirmationNumber = ticketData.transactionInfo.bookingReferenceNumber;
      
      // Return the response
      sendResponse(req, res, true, 200, 'Ferry ticket created successfully', {
        status: true,
        printUrl: ticketResponse.printUrl,
        data: ticketDataArray,
        booking_reference_no: confirmationNumber,
      });
      
    } catch (error) {
      const statusCode = error instanceof Error ? 400 : 500;
      const message = statusCode === 400 && error instanceof Error
        ? (error as Error).message
        : `Internal server error. Please contact our administrator and present this tracking ID: ${trackingId}`;
      logger.error({
        message: 'Create ticket failed',
        trackingId,
        error: error instanceof Error ? error.message : String(error),
        request: req.body
      });
      sendResponse(req, res, false, statusCode, message, error);
    }
  }
}