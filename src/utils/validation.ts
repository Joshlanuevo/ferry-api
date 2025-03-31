import { z } from 'zod';
import { FerrySearchRequest } from '../models/FerrySearch/FerrySearchRequest';
import { FerryComputeChargesRequest } from '../models/FerryComputeCharges/FerryComputeChargesRequest';
import { FerryTicketRequest } from '../models/FerryTicket';

const FerrySearchSchema = z.object({
  origin: z.number().int().positive('Origin must be a positive integer'),
  destination: z.number().int().positive('Destination must be a positive integer'),
  passengerCount: z.number().int().min(1).max(10, 'Maximum 10 passengers'),
  departureDate: z.string().refine(
    (date) => {
      const parsedDate = new Date(date);
      return !isNaN(parsedDate.getTime()) && parsedDate >= new Date();
    }, 
    { message: 'Invalid date or date must be in the future' }
  )
});

export const validateFerrySearchRequest = (request: unknown): FerrySearchRequest => {
  try {
    return FerrySearchSchema.parse(request);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map(err => 
        `${err.path.join('.')}: ${err.message}`
      ).join('; ');
      throw new Error(`Validation failed: ${errorMessages}`);
    }
    throw error;
  }
};

export const validateFerryComputeChargesRequest = (data: any): FerryComputeChargesRequest => {
  // Validate main request structure
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid request format: Request must be an object');
  }

  // Validate passengerList
  if (!Array.isArray(data.passengerList) || data.passengerList.length === 0) {
    throw new Error('Invalid request: passengerList must be a non-empty array');
  }

  // Validate each passenger
  data.passengerList.forEach((passenger: any, index: number) => {
    if (!passenger || typeof passenger !== 'object') {
      throw new Error(`Invalid passenger at index ${index}: Must be an object`);
    }

    if (!passenger.passenger || typeof passenger.passenger !== 'object') {
      throw new Error(`Invalid passenger info at index ${index}: Missing passenger details`);
    }

    // Validate passenger info required fields (only the truly essential ones)
    const requiredFields = ['firstname', 'lastname', 'gender', 'birthdate', 'nationality'];
    requiredFields.forEach(field => {
      if (!passenger.passenger[field]) {
        throw new Error(`Invalid passenger info at index ${index}: Missing required field '${field}'`);
      }
    });

    // Set default values for optional fields
    passenger.passenger.discountType = passenger.passenger.discountType || 'NONE';
    passenger.passenger.filenames = passenger.passenger.filenames || '';
    passenger.passenger.isDriver = passenger.passenger.isDriver || 0;

    // Validate price IDs
    if (!passenger.departurePriceId) {
      throw new Error(`Invalid passenger at index ${index}: Missing departurePriceId`);
    }
  });

  // Validate isServiceFee
  if (typeof data.isServiceFee !== 'number') {
    // Default to 0 if not provided or invalid
    data.isServiceFee = 0;
  }

  return data as FerryComputeChargesRequest;
};

/**
 * Validates ferry ticket request data
 */
export const validateFerryTicketRequest = (data: any): FerryTicketRequest => {
  if (!data) {
    throw new Error('Request body is required');
  }

  if (!data.passengers || !Array.isArray(data.passengers) || data.passengers.length === 0) {
    throw new Error('At least one passenger is required');
  }

  // Validate each passenger
  data.passengers.forEach((passenger: any, index: number) => {
    if (!passenger.passenger) {
      throw new Error(`Passenger information is missing for passenger at index ${index}`);
    }
    
    if (!passenger.departurePriceId) {
      throw new Error(`Departure price ID is required for passenger at index ${index}`);
    }
    
    // Validate passenger info
    const passengerInfo = passenger.passenger;
    if (!passengerInfo.firstname) {
      throw new Error(`First name is required for passenger at index ${index}`);
    }
    
    if (!passengerInfo.lastname) {
      throw new Error(`Last name is required for passenger at index ${index}`);
    }
    
    if (passengerInfo.gender === undefined) {
      throw new Error(`Gender is required for passenger at index ${index}`);
    }
    
    if (!passengerInfo.birthdate) {
      throw new Error(`Birthdate is required for passenger at index ${index}`);
    }
    
    if (!passengerInfo.nationality) {
      throw new Error(`Nationality is required for passenger at index ${index}`);
    }
    
    if (!passengerInfo.discountType) {
      throw new Error(`Discount type is required for passenger at index ${index}`);
    }
  });

  // Validate contact info
  if (!data.contactInfo) {
    throw new Error('Contact information is required');
  }
  
  const contactInfo = data.contactInfo;
  if (!contactInfo.name) {
    throw new Error('Contact name is required');
  }
  
  if (!contactInfo.email) {
    throw new Error('Contact email is required');
  }
  
  if (!contactInfo.mobile) {
    throw new Error('Contact mobile number is required');
  }
  
  if (!contactInfo.address) {
    throw new Error('Contact address is required');
  }

  return data as FerryTicketRequest;
};