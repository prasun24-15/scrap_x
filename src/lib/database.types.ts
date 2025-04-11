export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      scrap_listings: {
        Row: {
          id: string;
          seller_id: string;
          material_type_id: string;
          title: string;
          description: string | null;
          quantity: number;
          unit: string;
          listed_price: number;
          image_url: string | null;
          classification: string | null;
          confidence: number | null;
          weight_estimation: number | null;
          geolocation: Json | null;
          address: string | null;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          seller_id: string;
          material_type_id: string;
          title: string;
          description?: string | null;
          quantity: number;
          unit?: string;
          listed_price: number;
          image_url?: string | null;
          classification?: string | null;
          confidence?: number | null;
          weight_estimation?: number | null;
          geolocation?: Json | null;
          address?: string | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          seller_id?: string;
          material_type_id?: string;
          title?: string;
          description?: string | null;
          quantity?: number;
          unit?: string;
          listed_price?: number;
          image_url?: string | null;
          classification?: string | null;
          confidence?: number | null;
          weight_estimation?: number | null;
          geolocation?: Json | null;
          address?: string | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      material_types: {
        Row: {
          id: string;
          name: string;
          category: string;
          description: string | null;
        };
      };
    };
    Functions: {
      create_geography_point: {
        Args: {
          longitude: number;
          latitude: number;
        };
        Returns: Json;
      };
      get_listing_coordinates: {
        Args: {
          listing_id: string;
        };
        Returns: ListingWithCoordinates;
      };
      get_listings_with_coordinates: {
        Args: Record<string, never>;
        Returns: ListingCoordinates[];
      };
    };
  };
}

export interface ListingWithCoordinates {
  id: string;
  title: string;
  description: string | null;
  listed_price: number;
  status: string;
  created_at: string;
  seller_id: string;
  material_type_id: string;
  latitude: number;
  longitude: number;
  quantity: number;
  unit: string;
  image_url: string | null;
  address: string | null;
  classification: string | null;
  confidence: number | null;
  weight_estimation: number | null;
  material_type: {
    id: string;
    name: string;
    category: string;
    description: string | null;
  };
  profiles: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
  geolocation: {
    type: string;
    coordinates: number[];
  } | null;
}

export interface ListingCoordinates {
  latitude: number;
  longitude: number;
} 