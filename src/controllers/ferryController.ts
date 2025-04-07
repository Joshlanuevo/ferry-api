import { Request, Response } from 'express';
import AuthService from '../services/authService';
import { fetchFerryData } from '../services/ferrySearchService';
import { computeFerryCharges } from '../services/ferryComputeChargesService';
import { createFerryTicket, getLatestTicket, getVoyageTotalFare } from '../services/ferryCreateTicketService';
import { UserBalanceService } from '../services/userBalanceService';
import { commitTransaction } from '../services/transactionService2';
import { checkSufficientOnHoldBalance, getUserFundsOnHold } from '../services/userFundsService';
import { fetchTicketData } from '../services/ferryTicketSearchService';
import { isAdmin } from '../utils/user';
import { sendResponse } from '../utils/response';
import { getTrackingId } from '../middlewares/loggerMiddleware';
import logger from '../utils/logger';
import { TransactionTypes } from '../enums/TransactionTypes';

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

      // Check if request contains required fields
      if (!req.body.contactInfo) {
        throw new Error("Missing contact information in request");
      }
      
      if (!req.body.passengers || !Array.isArray(req.body.passengers) || req.body.passengers.length === 0) {
        throw new Error("Missing or invalid passenger information in request");
      }

      const total = await getVoyageTotalFare(cachedComputeCharges);

      // Log the total for verification
      logger.info({
        message: 'Total fare calculated',
        trackingId,
        total,
        computeCharges: cachedComputeCharges,
      });

      const userId = req.session?.user?.id;
      if (!userId) throw new Error("User not authenticated. Please log in again.");

      const user = await UserBalanceService.getUser(userId);

      logger.info({
        message: 'User admin check',
        trackingId,
        userId,
        isAdmin: isAdmin(user),
        userObj: user,
      });

      if (!isAdmin(user)) {
        const balance = await UserBalanceService.getUserBalanceData(userId);
        if (!balance || balance.total < total) {
          throw new Error("Insufficient balance to proceed with ticket purchase.");
        }

        const hasSufficientBalance = await checkSufficientOnHoldBalance(
          userId,
          balance.total,
          total,
          user?.currency || 'PHP',
          trackingId,
        );

        if (!hasSufficientBalance) {
          const fundsOnHold = await getUserFundsOnHold(userId, user?.currency || 'PHP', trackingId);
          throw new Error(`Not enough credits for this transaction because ${fundsOnHold} ${user?.currency || 'PHP'} is still on hold.`);
        }

        logger.info({
          message: 'User balance check',
          trackingId,
          userId,
          balance,
          total,
        }); 
      }
1 
      // Get token for API authentication
      const token = await AuthService.getToken();

      try {
        // Create the ferry ticket
        const ticketResponse = await createFerryTicket(req.body, token, trackingId);
        
        if (!ticketResponse.printUrl) {
          throw new Error("No print URL found in the response.");
        }
        
        // Wait a short time for the ticket to be processed
        await new Promise(resolve => setTimeout(resolve, 1000));
        
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

        // 💸 Commit the transaction
        await commitTransaction({
          userId: user?.id || '',
          amount: total, // this will be auto-negated in commitTransaction
          currency: user?.currency || 'PHP',
          type: TransactionTypes.ferry,
          createdBy: user?.id || '',
          userName: `${user?.first_name} ${user?.last_name}`,
          meta: {
            request: req.body,
            response: ticketDataArray,
            compute_charges: cachedComputeCharges,
            printUrl: ticketResponse.printUrl,
            booking_reference_no: confirmationNumber,
          },
        });
        
        // Return the response
        sendResponse(req, res, true, 200, 'Ferry ticket created successfully', {
          status: true,
          printUrl: ticketResponse.printUrl,
          data: ticketDataArray,
          booking_reference_no: confirmationNumber,
        });
      } catch (ticketError) {
        // Enhanced error handling for ticket creation failure
        logger.error({
          message: 'Error during ticket creation or processing',
          trackingId,
          error: ticketError instanceof Error ? ticketError.message : String(ticketError),
          request: req.body
        });
        
        throw new Error(`Failed to create ticket: ${ticketError instanceof Error ? ticketError.message : 'Unknown error'}`);
      }
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

  static async getTickets(req: Request, res: Response): Promise<void> {
    const trackingId = getTrackingId(req);
    
    try {
      // Get token for API authentication
      const token = await AuthService.getToken();
      
      // Fetch ticket data based on request parameters
      const results = await fetchTicketData(req.body, token, trackingId);
      
      sendResponse(req, res, true, 200, 'Ticket search completed successfully', results);
    } catch (error) {
      const statusCode = error instanceof Error ? 400 : 500;
      const message = statusCode === 400 && error instanceof Error
        ? (error as Error).message
        : `Internal server error. Please contact our administrator and present this tracking ID: ${trackingId}`;
      logger.error({
        message: 'Get tickets failed',
        trackingId,
        error: error instanceof Error ? error.message : String(error),
        request: req.body
      });
      sendResponse(req, res, false, statusCode, message, error);
    }
  }

  static async confirmBooking(req: Request, res: Response): Promise<void> {
    const trackingId = getTrackingId(req);
    
    try {
      // Simple success response, matching the PHP implementation
      sendResponse(req, res, true, 200, 'Booking confirmed successfully', {
        success: true
      });
    } catch (error) {
      const statusCode = error instanceof Error ? 400 : 500;
      const message = statusCode === 400 &&  error instanceof Error
        ? (error as Error).message
        : `Internal server error. Please contact our administrator and present this tracking ID: ${trackingId}`;
      logger.error({
        message: 'Confirm booking failed',
        trackingId,
        error: error instanceof Error ? error.message : String(error),
        request: req.body
      });
      sendResponse(req, res, false, statusCode, message, error);
    }
  }
}