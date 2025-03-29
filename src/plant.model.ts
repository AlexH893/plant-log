export interface Plant {
  scientific_name: string;
  water: string;
  fertilize: string;
  last_watered: string;
  last_fertilized: string;
  watered: boolean;
  fertilized: boolean;
  quantity: number;
  common_name: string;
  collectionId?: number;
  id: number;
  times_watered?: number;
  times_fertilized?: number;
}
