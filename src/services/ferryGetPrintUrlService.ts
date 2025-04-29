import axios from 'axios';
import dotenv from 'dotenv';
import { FerryErrorResponse } from '../models/FerryErrorResponse';
import { getApiUrl } from '../config/ferryApiConfig';

dotenv.config();

/**
 * Gets the print URL for a ferry ticket transaction
 */
export const getFerryPrintUrl = async (
    barkotaTransactionId: string,
    token: string,
): Promise<string> => {
    try {
        const url = getApiUrl('getFerryPrintUrl');
        const timeout = parseInt(process.env.API_TIMEOUT || '30000', 10);

        const response = await axios({
            method: 'POST',
            url,
            headers: {
                'Authorization': `Bearer ${token}`,
            },
            data: {
                barkotaTransactionId
            },
            timeout,
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
        if (axios.isAxiosError(error)) {
            const errorData = error.response?.data;
            if (errorData && errorData.error) {
            const errorResponse = new FerryErrorResponse(errorData);
            throw new Error(`Error: ${errorResponse.title} - ${errorResponse.detail}`);
            }
            throw new Error(`API request failed: ${error.message} - ${JSON.stringify(error.response?.data || {})}`);
        }
        throw error;
    }
};