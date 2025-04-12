import axios from 'axios';
import dotenv from 'dotenv';
import { getApiUrl } from '../config/ferryApiConfig';
import logger from '../utils/logger';

dotenv.config();

/**
 * Gets the print URL for a ferry ticket transaction
 */
export const getFerryPrintUrl = async (
    barkotaTransactionId: string,
    token: string,
    trackingId: string,
): Promise<string> => {
    try {
        const url = getApiUrl('getFerryPrintUrl');
        const timeout = parseInt(process.env.API_TIMEOUT || '30000', 10);

        // Log external API request
        logger.info({
            message: `API Request: ${url}`,
            trackingId,
            method: 'POST',
            url,
            barkotaTransactionId
        });

        const startTime = Date.now();

        const response = await axios({
            method: 'POST',
            url,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-Request-ID': trackingId,
                'Authorization': `Bearer ${token}`,
            },
            data: {
                barkotaTransactionId
            },
            timeout,
        });

        const responseTime = Date.now() - startTime;
        
        // Log response
        logger.info({
            message: `API Response: ${url}`,
            trackingId,
            statusCode: response.status,
            responseTime: `${responseTime}ms`,
        });

        // Handle API error messages
        if (response.data && response.data.error_message) {
            throw new Error(
                Array.isArray(response.data.error_message) 
                    ? response.data.error_message.join(', ')
                    : response.data.error_message
            );
        }

        // Validate response format
        if (!response.data || !response.data.body) {
            throw new Error("Invalid response from Barkota API.");
        }

        // Check for error status in the response body
        if (response.data.body.status) {
            const errorTitle = response.data.body.title || '';
            const errorDetail = response.data.body.detail || '';
            const errorMsg = `Error: ${errorTitle} - ${errorDetail}`;
            
            // This is a simplification of the isThrowGenericErrorMessage function from PHP
            // You might want to implement a proper version based on your needs
            throw new Error(errorMsg);
        }

        const printUrl = response.data.body.printUrl;
        if (!printUrl) {
            throw new Error("Print URL not found in response");
        }

        return printUrl;
    } catch (error) {
        logger.error({
            message: 'Get print URL request failed',
            trackingId,
            barkotaTransactionId,
            error: error instanceof Error ? error.message : String(error)
        });
        
        if (axios.isAxiosError(error)) {
            const status = error.response?.status;
            
            if (status === 401) {
                throw new Error('Authentication failed: Invalid or expired token');
            } else if (status === 400) {
                throw new Error(`Bad request: ${JSON.stringify(error.response?.data)}`);
            }
        }
        throw error;
    }
};