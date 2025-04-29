import { Request, Response } from 'express';
import AuthService from '../services/authService';
import { fetchFerryData } from '../services/ferrySearchService';
import { computeFerryCharges } from '../services/ferryComputeChargesService';
import { createFerryTicket, getLatestTicket, getVoyageTotalFare } from '../services/ferryCreateTicketService';
import { UserBalanceService } from '../services/userBalanceService';
import { commitTransaction, getTransactionData, removeFromBookings } from '../services/transactionService';
import { checkSufficientOnHoldBalance, getUserFundsOnHold } from '../services/userFundsService';
import { fetchTicketData } from '../services/ferryTicketSearchService';
import { voidTicket } from '../services/ferryVoidTicketService';
import { issueRefund } from '../services/refundService';
import { hydrateTransactions } from '../services/transactionHydrationService';
import { getFerryPrintUrl } from '../services/ferryGetPrintUrlService';
import { isAdmin } from '../utils/user';
import { sendResponse } from '../utils/response';
import { TransactionTypes } from '../enums/TransactionTypes';
import { FirebaseCollections } from '../enums/FirebaseCollections';
import { handleErrorResponse } from '../middlewares/handleErrorResponse';
import { DEFAULT_COLLECTION, DEFAULT_CURRENCY, DEFAULT_KEY, DEFAULT_LIMIT, DEFAULT_SORT_BY, TICKET_CREATION_WAIT_TIME_MS } from '../utils/constants';

export class FerryController {

  /**
   * Search for available ferry trips
   */
  static async search(req: Request, res: Response): Promise<void> {
    
    try {
      const token = await AuthService.getToken();
      const results = await fetchFerryData(req.body, token);
      sendResponse(req, res, true, 200, 'Ferry search completed successfully', results);
    } catch (error) {
      const trackingId = (Array.isArray(req.headers["x-correlation-id"])
        ? req.headers["x-correlation-id"][0]
        : req.headers["x-correlation-id"]) ?? '';
      handleErrorResponse(req, res, error, trackingId, 'Ferry search');
    }
  }

  /**
   * Compute charges for a ferry booking
   */
  static async computeCharges(req: Request, res: Response): Promise<void> {
    
    try {
      const token = await AuthService.getToken();
      const results = await computeFerryCharges(req.body, token);
      
      // Store compute charges result in req.session for later use
      if (req.session) {
        req.session.ferryComputeCharges = results;
      }

      sendResponse(req, res, true, 200, 'Ferry charges computed successfully', results);
    } catch (error) {
      const trackingId = (Array.isArray(req.headers["x-correlation-id"])
        ? req.headers["x-correlation-id"][0]
        : req.headers["x-correlation-id"]) ?? '';
      handleErrorResponse(req, res, error, trackingId, 'Compute charges');
    }
  }

  /**
   * Hold a ferry booking (currently in maintenance mode)
   */
  static async holdBooking(req: Request, res: Response): Promise<void> {
    
    try {
      // Return maintenance mode message
      sendResponse(req, res, false, 402, "Ferry Module Is Under Maintenance Mode. We will notify once it's back.", null);
    } catch (error) {
      const trackingId = (Array.isArray(req.headers["x-correlation-id"])
        ? req.headers["x-correlation-id"][0]
        : req.headers["x-correlation-id"]) ?? '';
      handleErrorResponse(req, res, error, trackingId, 'Hold booking');
    }
  }

  /**
   * Create a ferry ticket
   */
  static async createTicket(req: Request, res: Response): Promise<void> {
    
    try {
      // Validate request data
      FerryController.validateCreateTicketRequest(req);
      
      const cachedComputeCharges = req.session!.ferryComputeCharges;
      const total = await getVoyageTotalFare(cachedComputeCharges);
      const userId = req.session!.user!.id;

      // Check user balance
      const { user, currency } = await FerryController.checkUserBalanceForTicket(userId, total);

      // Get token for API authentication
      const token = await AuthService.getToken();

      try {
        // Create the ticket
        const { printUrl, ticketDataArray, confirmationNumber } = 
          await FerryController.executeTicketCreation(req.body, token);
        
        // Commit the transaction
        await commitTransaction({
          userId: user?.id || '',
          amount: total, // this will be auto-negated in commitTransaction
          currency: currency,
          type: TransactionTypes.ferry,
          createdBy: user?.id || '',
          userName: `${user?.first_name} ${user?.last_name}`,
          meta: {
            request: req.body,
            response: ticketDataArray,
            compute_charges: cachedComputeCharges,
            printUrl: printUrl,
            booking_reference_no: confirmationNumber,
          },
        });
        
        // Return the response
        sendResponse(req, res, true, 200, 'Ferry ticket created successfully', {
          status: true,
          printUrl: printUrl,
          data: ticketDataArray,
          booking_reference_no: confirmationNumber,
        });
      } catch (ticketError) {
        // Enhanced error handling for ticket creation failure
        console.log('Error during ticket creation or processing', {
          error: ticketError instanceof Error ? ticketError.message : String(ticketError),
          request: req.body,
        });
        throw new Error(`Failed to create ticket: ${ticketError instanceof Error ? ticketError.message : 'Unknown error'}`);
      }
    } catch (error) {
        const trackingId = (Array.isArray(req.headers["x-correlation-id"])
        ? req.headers["x-correlation-id"][0]
        : req.headers["x-correlation-id"]) ?? '';
      handleErrorResponse(req, res, error, trackingId, 'Create ticket');
    }
  }

  /**
   * Validate request data for creating a ticket
   */
  private static validateCreateTicketRequest(req: Request): void {
    if (!req.session?.ferryComputeCharges) {
      throw new Error("No cached compute charges found. Please compute charges first.");
    }
  
    if (!req.body.contactInfo) {
      throw new Error("Missing contact information in request");
    }
      
    if (!req.body.passengers || !Array.isArray(req.body.passengers) || req.body.passengers.length === 0) {
      throw new Error("Missing or invalid passenger information in request");
    }
  
    if (!req.session?.user?.id) {
      throw new Error("User not authenticated. Please log in again.");
    }
  }
  
  /**
    * Check user balance for ticket purchase
    */
  private static async checkUserBalanceForTicket(
    userId: string, 
    total: number, 
  ): Promise<{ user: any, currency: string }> {
    const user = await UserBalanceService.getUser(userId);
  
    const currency = user?.currency || DEFAULT_CURRENCY;
  
    if (!isAdmin(user)) {
      const balance = await UserBalanceService.getUserBalanceData(userId);
      if (!balance || balance.total < total) {
        throw new Error("Insufficient balance to proceed with ticket purchase.");
      }

      const hasSufficientBalance = await checkSufficientOnHoldBalance(
        userId,
        balance.total,
        total,
        currency,
      );

      if (!hasSufficientBalance) {
        const fundsOnHold = await getUserFundsOnHold(userId, currency);
        throw new Error(`Not enough credits for this transaction because ${fundsOnHold} ${currency} is still on hold.`);
      }
    }
  
    return { user, currency };
  }
  
  /**
  * Create ferry ticket
  */
  private static async executeTicketCreation(
    requestBody: any,
    token: string,
  ): Promise<{ printUrl: string, ticketDataArray: any[], confirmationNumber: string }> {
    // Create the ferry ticket
    const ticketResponse = await createFerryTicket(requestBody, token);
      
    if (!ticketResponse.printUrl) {
      throw new Error("No print URL found in the response.");
    }
      
    // Wait a short time for the ticket to be processed
    await new Promise(resolve => setTimeout(resolve, TICKET_CREATION_WAIT_TIME_MS));
      
    // Get the latest ticket data
    const ticketDataArray = await getLatestTicket();

    if (!ticketDataArray || ticketDataArray.length === 0) {
      throw new Error("No ticket data found after creation.");
    }
  
    const ticketData = ticketDataArray[0];
    
    if (!ticketData || !ticketData.transactionInfo || !ticketData.transactionInfo.bookingReferenceNumber) {
      throw new Error("Invalid ticket data received.");
    }
    
    const confirmationNumber = ticketData.transactionInfo.bookingReferenceNumber;

    return { printUrl: ticketResponse.printUrl, ticketDataArray, confirmationNumber };
  }

   /**
   * Get ferry tickets based on search criteria
   */
  static async getTickets(req: Request, res: Response): Promise<void> {
    
    try {
      // Get token for API authentication
      const token = await AuthService.getToken();
      const results = await fetchTicketData(req.body, token);
    
      sendResponse(req, res, true, 200, 'Ticket search completed successfully', results);
    } catch (error) {
      const trackingId = (Array.isArray(req.headers["x-correlation-id"])
        ? req.headers["x-correlation-id"][0]
        : req.headers["x-correlation-id"]) ?? '';
      handleErrorResponse(req, res, error, trackingId, 'Get tickets');
    }
  }

  /**
   * Confirm a ferry booking
   */
  static async confirmBooking(req: Request, res: Response): Promise<void> {
    
    try {
      // Simple success response, matching the PHP implementation
      sendResponse(req, res, true, 200, 'Booking confirmed successfully', {
        success: true,
      });
    } catch (error) {
      const trackingId = (Array.isArray(req.headers["x-correlation-id"])
        ? req.headers["x-correlation-id"][0]
        : req.headers["x-correlation-id"]) ?? '';
      handleErrorResponse(req, res, error, trackingId, 'Confirm booking');
    }
  }

  /**
   * Void a ferry booking
   */
  static async voidBooking(req: Request, res: Response): Promise<void> {
    const transactionId = req.params.transactionId;
    
    try {
      // Validate input
      if (!transactionId) {
        throw new Error("Transaction ID is required");
      }
      
      // Get transaction data
      const transactionData = await getTransactionData(transactionId);
      if (!transactionData) {
        throw new Error("Transaction not found");
      }
      
      // Get user info
      const userId = req.session?.user?.id;
      if (!userId) throw new Error("User not authenticated. Please log in again.");
      
      const user = await UserBalanceService.getUser(userId);
      const isUserAdmin = isAdmin(user);

      await FerryController.processVoidBooking(
        transactionData, 
        isUserAdmin, 
        req.body.remarks,
        transactionId, 
        user,
      );
      
      sendResponse(req, res, true, 200, 'Booking voided successfully', {
        status: true,
      });
    } catch (error) {
      const trackingId = (Array.isArray(req.headers["x-correlation-id"])
        ? req.headers["x-correlation-id"][0]
        : req.headers["x-correlation-id"]) ?? '';
      handleErrorResponse(req, res, error, trackingId, 'Void booking');
    }
  }

  /**
   * Process void booking operation
   */
  private static async processVoidBooking(
      transactionData: any, 
      isUserAdmin: boolean, 
      remarks: string,
      transactionId: string,
      user: any,
  ): Promise<void> {
      // Get ticket data from transaction meta
      const ticketDataArray = transactionData.meta?.response;
      if (!ticketDataArray || !Array.isArray(ticketDataArray) || ticketDataArray.length === 0) {
        throw new Error("No ticket data found in transaction");
      }

      // Get auth token for Barkota API
      const token = await AuthService.getToken();
      
      // Void each ticket in the transaction
      const voidRemarks = remarks || "Voided by user";
      await FerryController.voidTickets(ticketDataArray, voidRemarks, token);
      
      // Issue refund if user is not admin
      let isRefundSuccess = true;
      if (!isUserAdmin) {
        isRefundSuccess = await issueRefund({
          transactionId,
          userId: transactionData.userId,
          amount: transactionData.amount,
          currency: transactionData.currency || DEFAULT_CURRENCY,
          meta: transactionData.meta || {},
          agentId: transactionData.agent_id,
          userName: transactionData.user_name || `${user?.first_name} ${user?.last_name}`,
        });
      }
      
      // Remove from bookings collection
      if (isRefundSuccess) {
        await removeFromBookings(transactionId);
      }
  }

  /**
   * Void all tickets in a transaction
   */
  private static async voidTickets(
      ticketDataArray: any[], 
      remarks: string, 
      token: string,
  ): Promise<void> {
      let allVoided = true;
      
      for (const ticketData of ticketDataArray) {
        if (!ticketData) continue;
        
        const bookingId = ticketData.barkotaBookingId;
        if (!bookingId) {
          console.log('Warning: Missing barkotaBookingId in ticket data', {
            ticketData,
          });
          continue;
        }

        // Call the void API
        const voidResult = await voidTicket(bookingId, remarks, token);
        if (!voidResult) {
          allVoided = false;
          console.log('Error: Failed to void booking', {
            bookingId,
          });
        }
      }
      
      if (!allVoided) {
        throw new Error("Failed to void one or more bookings");
      }
  }

  /**
   * Hydrate transactions with additional data
   */
  static async hydrateTransactions(req: Request, res: Response): Promise<void> {
    
    try {
      // Check if user is admin
      const userId = req.session?.user?.id;
      if (!userId) throw new Error("User not authenticated. Please log in again.");
      
      const user = await UserBalanceService.getUser(userId);
      if (!isAdmin(user)) {
        throw new Error("Unauthorized: Only administrators can hydrate transactions");
      }
      
      // Extract parameters from request
      const collection = (req.body.collection || DEFAULT_COLLECTION) as FirebaseCollections;
      const key = req.body.key || DEFAULT_KEY;
      const sortBy = req.body.sortBy || DEFAULT_SORT_BY;
      const limit = req.body.limit || DEFAULT_LIMIT;
      
      // Optional transformer function
      let transformer: ((item: any) => any) | undefined = undefined;
      if (req.body.transform === 'toTransaction') {
        transformer = (item: any) => {
          // Transformer logic to convert item to transaction format
          return {
            ...item,
            processed: true,
            hydrated_at: new Date().toISOString(),
          };
        };
      }
      
      // Trigger the hydration process
      const result = await hydrateTransactions(
        collection as FirebaseCollections,
        key,
        sortBy,
        limit,
        transformer,
      );
      
      sendResponse(req, res, true, 200, 'Transaction hydration completed successfully', {
        batches: result.length,
        totalDocuments: result.reduce((sum, batch) => sum + (batch.processedIds?.length || 0), 0),
      });
    } catch (error) {
      const trackingId = (Array.isArray(req.headers["x-correlation-id"])
          ? req.headers["x-correlation-id"][0]
          : req.headers["x-correlation-id"]) ?? '';
      handleErrorResponse(req, res, error, trackingId, 'Hydrate Transaction');
    }
  }

  /**
   * View a ferry ticket
   */
  static async viewTicket(req: Request, res: Response): Promise<void> {
    const barkotaTransactionId = req.params.barkotaTransactionId;
    
    try {
      // Validate input
      if (!barkotaTransactionId) {
        throw new Error("Barkota Transaction ID is required");
      }

      // Get token for API authentication
      const token = await AuthService.getToken();
      
      // Get print URL
      const printUrl = await getFerryPrintUrl(barkotaTransactionId, token);
      
      sendResponse(req, res, true, 200, 'Print URL retrieved successfully', {
        printUrl,
      });
    } catch (error) {
      const trackingId = (Array.isArray(req.headers["x-correlation-id"])
        ? req.headers["x-correlation-id"][0]
        : req.headers["x-correlation-id"]) ?? '';
      handleErrorResponse(req, res, error, trackingId, 'View ticket');
    }
  }
}