import axios from 'axios';
import dotenv from 'dotenv';
import { FerryErrorResponse } from '../models/FerryErrorResponse';
import { FerrySearchRequest } from '../models/FerrySearch/FerrySearchRequest';
import { FerrySearchResponse } from '../models/FerrySearch/FerrySearchResponse';
import { getApiUrl } from '../config/ferryApiConfig';

dotenv.config();

/**
 * Calls external Barkota API to fetch ferry search data
 */
export const fetchFerryData = async (
    request: FerrySearchRequest,
    token: string,
): Promise<FerrySearchResponse> => {
    try {
        const url = getApiUrl('ferrySearch');
        const timeout = parseInt(process.env.API_TIMEOUT || '30000', 10);

        const response = await axios({
            method: 'POST',
            url,
            headers: {
                'Authorization': `Bearer ${token}`,
            },
            data: request,
            timeout,
        });

        // Handle API error messages
        if (response.data && response.data.error_message) {
            throw new Error(response.data.error_message);
        }

        const responseData = response.data;

        // Validate response format
        if (!Array.isArray(responseData)) {
            throw new Error("Invalid response format from Barkota API. Expected an array.");
        }

        return {
            data: responseData,
            meta: {
                totalResults: responseData.length,
                requestTimestamp: new Date().toISOString(),
            }
        };
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