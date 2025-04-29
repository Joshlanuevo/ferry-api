import axios from 'axios';
import dotenv from 'dotenv';
import { FerryErrorResponse } from '../models/FerryErrorResponse';
import { FerryComputeChargesRequest } from '../models/FerryComputeCharges/FerryComputeChargesRequest';
import { FerryComputeChargesResponse } from '../models/FerryComputeCharges/FerryComputeChargesResponse';
import { getApiUrl } from '../config/ferryApiConfig';

dotenv.config();

/**
 * Calls external Barkota API to compute ferry charges
 */
export const computeFerryCharges = async (
  request: FerryComputeChargesRequest,
  token: string,
): Promise<FerryComputeChargesResponse> => {
  try {
    const url = getApiUrl('computeCharges');
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

    // Check if response has status property indicating an error
    if (response.data && response.data.status) {
      const errorMsg = `Error: ${response.data.title || 'Unknown error'} - ${response.data.detail || 'No details provided'}`;
      throw new Error(errorMsg);
    }

    // Validate response format
    if (!response.data || typeof response.data !== 'object') {
      throw new Error("Invalid response format from Barkota API");
    }

    const responseData = response.data;

    return {
      ...responseData,
      meta: {
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